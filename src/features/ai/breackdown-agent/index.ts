import { GenerateRequestSchema, GenerateResponse, ProjectDraft } from './schemas';
import { graph, AgentState } from './graph';
import { flattenPlanTree } from './flatten';

export async function generateIssues(input: {
  prompt: string;
  contexts: ProjectDraft;
}): Promise<GenerateResponse> {
  const parse = GenerateRequestSchema.safeParse(input);
  if (!parse.success) throw new Error(`Validation Error: ${parse.error.message}`);

  const initialState = {
    prompt: input.prompt,
    contexts: input.contexts,
    plan: { root: [] },
    targetHierarchy: 0,
    iterations: 0,
    maxIterations: 0,
  };

  // invoke graph
  const resultState = (await graph.invoke(initialState)) as unknown as AgentState;

  // resultState.plan is the final PlanTree
  if (!resultState.plan || !resultState.plan.root) {
    throw new Error('Agent failed to generate a valid plan.');
  }

  // Flatten
  const finalIssues = flattenPlanTree(resultState.plan, input.contexts);

  return { issues: finalIssues };
}

export * from './schemas';
