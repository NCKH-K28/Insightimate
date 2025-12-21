import { SystemMessage } from '@langchain/core/messages';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { TavilySearch } from '@langchain/tavily';
import { ZIssueItem } from '@/contracts/issues/issues.query';
import z from 'zod';
import { tool } from '@langchain/core/tools';

const ProjectPlanSchema = z.object({ tasks: z.array(ZIssueItem) });

const MAX_REVISIONS = 2;

// ------------------------------
// Tools (stable names, stable schemas)
// ------------------------------
const tavily = new TavilySearch({ maxResults: 5, topic: 'general' });

const web_search = tool(
  async ({ query }: { query: string }) => {
    const res = await tavily.invoke({ query });
    return res;
  },
  {
    name: 'web_search',
    description:
      'Search the web for latest documentation/specs (versions, APIs, integrations, uncommon libs). Return short, actionable findings.',
    schema: z.object({ query: z.string().min(3) }),
  },
);

const read_tech_stack = tool(
  async () => {
    return {
      framework: 'Next.js (unknown version)',
      runtime: 'Node.js (unknown version)',
      language: 'TypeScript',
      ui: ['TailwindCSS', 'shadcn/ui (if present)'],
      validation: ['zod'],
      api: ['app/api/* (if using Next App Router)'],
      db: {
        type: 'Unknown',
        orm: 'Unknown',
      },
      conventions: {
        featureFolders: ['app/(routes)/*', 'app/api/*'],
        testing: ['Unknown'],
        linting: ['Unknown'],
      },
      notes: 'This is a stub. Replace with real repo detection for high-quality Tech Notes.',
    };
  },
  {
    name: 'read_tech_stack',
    description: 'Read and summarize the project tech stack & conventions as JSON.',
    schema: z.object({}),
  },
);

// ------------------------------
const llm = new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash', temperature: 0.2 });
const llmWithTools = llm.bindTools([web_search, read_tech_stack]);

// ------------------------------
// Helpers (markers to control routing)
// ------------------------------
const TECH_STACK_MARKER = 'TECH_STACK::AUTHORITATIVE';
const CRITIC_MARKER = 'CRITIC::REVIEW';
const NEEDS_REVISION_MARKER = '__REVISION_NEEDED__';
const OK_MARKER = '__REVISION_OK__';

function hasTechStack(messages: any[]) {
  return messages.some(
    (m) => m?.role === 'system' && String(m?.content || '').includes(TECH_STACK_MARKER),
  );
}

function revisionCount(messages: any[]) {
  return messages.filter(
    (m) => m?.role === 'system' && String(m?.content || '').includes(CRITIC_MARKER),
  ).length;
}

function lastMessage(state: typeof MessagesAnnotation.State) {
  return state.messages[state.messages.length - 1] as any;
}

// ------------------------------
// Nodes
// ------------------------------
async function loadTechStackNode(state: typeof MessagesAnnotation.State) {
  // Deterministic: always load once at the beginning (or whenever missing)
  const tech = await read_tech_stack.invoke({});

  return {
    messages: [
      ...state.messages,
      new SystemMessage(
        `${TECH_STACK_MARKER}\nUse this as the single source of truth for Tech Notes.\n${JSON.stringify(
          tech,
          null,
          2,
        )}`,
      ),
    ],
  };
}

async function researchNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;

  const sysMsg = new SystemMessage(`
You are the "Spec Writer / Researcher Agent".

GOALS:
- Gather missing information before drafting the task plan.
- Only use web search when necessary (new tech/new versions, third-party services, uncommon libraries, or unusual bugs).

MANDATORY RULES:
1) If the Tech Stack is not present in the context -> call the "read_tech_stack" tool.
2) If the request involves: newer Next.js/React versions, integrations (Stripe/VNPay/Firebase), frequently changing APIs/SDKs, or uncommon libraries/rare bugs
   -> call the "web_search" tool with a specific query.
3) If no tools are needed:
   - Return short "Research Notes" (assumptions + open questions + what we already know).
4) Do NOT write the task list in this step.
`);

  const result = await llmWithTools.invoke([sysMsg, ...messages]);
  return { messages: [result] };
}

async function draftNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;

  const structuredLLM = llm.withStructuredOutput(ProjectPlanSchema);
  const sysMsg = new SystemMessage(`
You are a senior Product Manager & Technical Architect.
Your job: Convert the user’s request into a detailed list of tasks that developers can start coding immediately.

QUALITY CONSTRAINTS (MANDATORY):
1) Acceptance Criteria must be extremely specific and step-based (click -> loading -> response -> redirect -> error states).
2) Tech Notes must follow the TECH STACK (${TECH_STACK_MARKER}) and reference concrete files/folders/libraries.
3) Break down work: NO single huge task. You must group tasks into Frontend / Backend / DB (and DevOps if needed).
4) Each task must have clear scope and be independently deliverable (include dependencies if any).

OUTPUT:
- Return valid JSON that matches ProjectPlanSchema exactly. Do not include any text outside the JSON.
`);

  const result = await structuredLLM.invoke([sysMsg, ...messages]);

  return {
    messages: [{ role: 'assistant', content: JSON.stringify(result) }],
  };
}

async function criticNode(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const draft = lastMessage(state)?.content ?? '';

  const sysMsg = new SystemMessage(`
You are the "QA/Critic" for the task plan.

You must check 4 criteria:
A) Acceptance Criteria must be extremely specific and step-based (click -> loading -> response -> redirect -> error states).
B) Tech Notes must follow the TECH STACK (${TECH_STACK_MARKER}) and reference concrete files/folders/libraries.
C) Task must be broken down into Frontend/Backend/DB (and DevOps if needed), no single huge task.
D) Task must be deliverable (include endpoints, data model changes, UI states).

Return exactly one of the following:
1) If it meets all criteria:
${OK_MARKER}

2) If it does not meet all criteria:
${NEEDS_REVISION_MARKER}
- (list specific errors to fix, the more specific the better)
- (suggestion on how to break down or add AC/Tech Notes)

Do not return anything else.
`);

  const review = await llm.invoke([
    sysMsg,
    ...messages,
    { role: 'user', content: `Here is the draft JSON to review:\n${draft}` },
  ]);

  return {
    messages: [
      new SystemMessage(`${CRITIC_MARKER}\n${String((review as any)?.content ?? review)}`),
    ],
  };
}

// ------------------------------
// Graph
// ------------------------------
const workflow = new StateGraph(MessagesAnnotation)
  .addNode('loadTechStack', loadTechStackNode)
  .addNode('researcher', researchNode)
  .addNode('tools', new ToolNode([web_search, read_tech_stack]))
  .addNode('drafter', draftNode)
  .addNode('critic', criticNode)

  // start -> ensure tech stack -> research
  .addEdge('__start__', 'loadTechStack')
  .addEdge('loadTechStack', 'researcher')

  // researcher -> tools (if tool calls) OR drafter
  .addConditionalEdges('researcher', (state) => {
    const last = lastMessage(state);

    // Safety: ensure tech stack exists (in case someone changes entry edges later)
    if (!hasTechStack(state.messages)) return 'loadTechStack';

    // @ts-ignore
    if (last?.tool_calls?.length > 0) return 'tools';
    return 'drafter';
  })
  .addEdge('tools', 'researcher')

  // drafter -> critic -> (revise drafter) OR end
  .addEdge('drafter', 'critic')
  .addConditionalEdges('critic', (state) => {
    const last = lastMessage(state);
    const content = String(last?.content ?? '');

    const revCount = revisionCount(state.messages);
    const needsRevision = content.includes(NEEDS_REVISION_MARKER);

    if (needsRevision && revCount <= MAX_REVISIONS) return 'drafter';
    return '__end__';
  });

export const draftAgent = workflow.compile();
