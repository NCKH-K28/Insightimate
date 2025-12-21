import { z } from 'zod';
import { StateGraph, END, START } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PlanTree, PlanNode, ProjectDraft, PlanTreeSchema, PlanNodeSchema } from '../schemas';
import { inferTargetHierarchy } from '../infer';
import { findEligibleNodes, countDistinctHierarchies } from './helpers';

// --- State Definition ---
export const AgentStateSchema = z.object({
  prompt: z.string(),
  contexts: z.any(),
  plan: PlanTreeSchema,
  targetHierarchy: z.number(),
  iterations: z.number(),
  maxIterations: z.number(),
});

export type AgentState = {
  prompt: string;
  contexts: ProjectDraft;
  plan: PlanTree;
  targetHierarchy: number;
  iterations: number;
  maxIterations: number;
};

// --- Model Setup ---
const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  temperature: 0.0, // stricter determinism
});

// --- Prompts & Helpers ---
const SYSTEM_PROMPT_BASE = `You are a Project Planning Agent (Deterministic).
Your goal is to break down a request into a structured project plan of Issues.
Contexts provided include Issue Types (with hierarchy levels), Statuses, and Priorities.

RULES:
1. Hierarchy: Respect the 'hierarchy' level of Issue Types. 
   - You can only create children with a hierarchy strictly LOWER than the parent.
   - 0 is the lowest level.
2. Structure: 
   - Summary must be clear and actionable.
   - Description must provide context.
   - Story Points: estimate if possible, else null.
3. Determinism:
   - You MUST order children arrays by:
     1. Issue Type Hierarchy (DESCENDING)
     2. Summary (ASCENDING) (Case-insensitive)
     3. If strictly equal, stable key (effectively summary).
   - Do NOT use random IDs. We will generate them later.
4. Output JSON only.
`;

// --- Nodes ---

async function plannerNode(state: AgentState): Promise<Partial<AgentState>> {
  const { prompt, contexts } = state;
  const targetH = inferTargetHierarchy(prompt, contexts);

  // Calculate maxIterations
  const distinctHierarchies = countDistinctHierarchies(contexts);
  const maxIterations = distinctHierarchies + 2;

  const plannerPrompt = `
  User Request: "${prompt}"
  
  Target Hierarchy Level (Inferred): ${targetH} (Try to reach this depth eventually).
  
  Available Issue Types:
  ${JSON.stringify(contexts.issueTypes, null, 2)}
  
  Task: Create the initial High-Level Plan (Root Nodes).
  These should be the highest appropriate level (e.g., Epics).
  Do NOT go too deep yet. Just the top level.
  `;

  const structuredModel = model.withStructuredOutput(PlanTreeSchema);

  const result = await structuredModel.invoke([
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    { role: 'user', content: plannerPrompt },
  ]);

  // Ensure result is a valid PlanTree (withStructuredOutput returns generated object)
  // We might need to handle null/error, but strict mode usually throws or returns null.
  // Assuming success for deterministic flow.
  const safeResult = result as unknown as PlanTree;

  // Enforce sorting just in case
  const sortedRoot = sortChildren(safeResult.root || [], contexts);

  return {
    plan: { root: sortedRoot },
    targetHierarchy: targetH,
    maxIterations,
    iterations: 0,
    contexts,
  };
}

async function expanderNode(state: AgentState): Promise<Partial<AgentState>> {
  const { plan, targetHierarchy, contexts, iterations } = state;

  // 1. Identification
  const eligible = findEligibleNodes(plan, targetHierarchy, contexts);
  if (eligible.length === 0) return { iterations: iterations + 1 };

  // 2. Batch Prompting
  const indices = eligible.map((e, i) => ({
    index: i,
    summary: e.node.summary,
    typeId: e.node.typeId,
  }));

  const expanderPrompt = `
  Current Plan Iteration: ${iterations}
  Target Hierarchy Level: ${targetHierarchy}
  
  Items to Expand (eligible for more detail):
  ${JSON.stringify(indices, null, 2)}
  
  Available Issue Types:
  ${JSON.stringify(contexts.issueTypes, null, 2)}
  
  Task: Generate children (sub-tasks) for each of the listed items.
  - MUST NOT exceed hierarchy constraints (child hierarchy < parent hierarchy).
  - Provide a list of expansions matching the indices.
  - If an item should not be expanded further (completeness), return empty children for it.
  `;

  // We need a schema that maps index -> children
  const ExpansionSchema = z.object({
    expansions: z.array(
      z.object({
        index: z.number(),
        children: z.array(PlanNodeSchema),
      }),
    ),
  });

  const structuredModel = model.withStructuredOutput(ExpansionSchema);
  const response = await structuredModel.invoke([
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    { role: 'user', content: expanderPrompt },
  ]);

  const newPlan = JSON.parse(JSON.stringify(plan)) as PlanTree;
  const eligibleInNewPlan = findEligibleNodes(newPlan, targetHierarchy, contexts);

  const safeResponse = response as unknown as {
    expansions: { index: number; children: PlanNode[] }[];
  };

  if (safeResponse && safeResponse.expansions) {
    for (const expansion of safeResponse.expansions) {
      if (expansion.index >= 0 && expansion.index < eligibleInNewPlan.length) {
        const target = eligibleInNewPlan[expansion.index].node;
        const sortedChildren = sortChildren(expansion.children, contexts);
        target.children = sortedChildren;
      }
    }
  }

  return {
    plan: newPlan,
    iterations: iterations + 1,
  };
}

async function fixerNode(state: AgentState): Promise<Partial<AgentState>> {
  const { plan, contexts, targetHierarchy } = state;

  const fixerPrompt = `
    Review the following Project Plan for consistency and completeness.
    Target Depth: Hierarchy Level ${targetHierarchy}.
    
    Plan:
    ${JSON.stringify(plan, null, 2)}
    
    Global Constraints:
    - No duplicate siblings (same summary).
    - Hierarchy must strictly descend.
    - All fields (summary, typeId) must be present.
    
    Output the corrected PlanTree.
    `;

  const structuredModel = model.withStructuredOutput(PlanTreeSchema);
  const result = await structuredModel.invoke([
    { role: 'system', content: SYSTEM_PROMPT_BASE },
    { role: 'user', content: fixerPrompt },
  ]);

  // Ensure result is a valid PlanTree
  const safeResult = result as unknown as PlanTree;

  // Enforce determinism on Fixer output
  if (safeResult.root) {
    safeResult.root = sortChildren(safeResult.root, contexts);
  }

  return {
    plan: safeResult, // Result is PlanTree
  };
}

// --- Helpers ---
function sortChildren(children: PlanNode[], contexts: ProjectDraft): PlanNode[] {
  if (!children) return [];

  // Create a map for hierarchy lookups to sort faster
  const typeHierarchy = new Map(contexts.issueTypes.map((t) => [t.id, t.hierarchy]));

  return children
    .sort((a, b) => {
      // 1. Hierarchy DESC
      const hA = typeHierarchy.get(a.typeId) ?? -1;
      const hB = typeHierarchy.get(b.typeId) ?? -1;
      if (hA !== hB) return hB - hA;

      // 2. Summary ASC
      const sA = a.summary.toLowerCase();
      const sB = b.summary.toLowerCase();
      if (sA < sB) return -1;
      if (sA > sB) return 1;

      return 0;
    })
    .map((child) => ({
      ...child,
      children: sortChildren(child.children, contexts),
    }));
}

// --- Graph Construction ---
function shouldContinue(state: AgentState) {
  const { plan, targetHierarchy, contexts, iterations, maxIterations } = state;

  // Stop if maxIterations reached
  if (iterations >= maxIterations) {
    return 'fixer';
  }

  // Stop if no eligible nodes
  const eligible = findEligibleNodes(plan, targetHierarchy, contexts);
  if (eligible.length === 0) {
    return 'fixer';
  }

  return 'expander';
}

// Define the graph channels
// For simple overwrite behavior (which we want), we use reducer: (x, y) => y ?? x
// or simpler, LangGraph default behavior for object state is usually merge/overwrite.
// But to be explicit with `channels`:
const channels = {
  prompt: { value: (x: string, y: string) => y ?? x, default: () => '' },
  contexts: {
    value: (x: any, y: any) => y ?? x,
    default: () => ({}) as any,
  },
  plan: {
    value: (x: PlanTree, y: PlanTree) => y ?? x,
    default: () => ({ root: [] }),
  },
  targetHierarchy: { value: (x: number, y: number) => y ?? x, default: () => 0 },
  iterations: { value: (x: number, y: number) => y ?? x, default: () => 0 },
  maxIterations: { value: (x: number, y: number) => y ?? x, default: () => 0 },
};

const workflow = new StateGraph<AgentState>({
  channels: channels,
})
  .addNode('planner', plannerNode)
  .addNode('expander', expanderNode)
  .addNode('fixer', fixerNode)
  .addEdge(START, 'planner')
  .addEdge('planner', 'expander')
  .addConditionalEdges('expander', shouldContinue, {
    expander: 'expander',
    fixer: 'fixer',
  })
  .addEdge('fixer', END);

export const graph = workflow.compile();
