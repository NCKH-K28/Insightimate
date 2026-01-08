import { Planner } from './planner';
import { toolRegistry } from './registry';
import { AgentContext } from './types';
import { traceRepository } from './trace-repository';

export class AgentOrchestrator {
  private planner: Planner;

  constructor(modelName: string = 'gemini-2.0-flash') {
    this.planner = new Planner(modelName);
  }

  async run(input: string, context: AgentContext, history: any[] = []) {
    const startTime = Date.now();
    let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
    let plan;
    const results: any[] = [];

    try {
      // 1. Plan
      plan = await this.planner.plan(input, history);
      console.log('[Agent] Plan:', JSON.stringify(plan, null, 2));

      // 2. Execute Steps
      for (const step of plan.steps) {
        console.log(`[Agent] Executing step: ${step.toolName}`);
        const tool = toolRegistry.get(step.toolName);

        if (!tool) {
          throw new Error(`Tool ${step.toolName} not found`);
        }

        // TODO: Schema validation before execution
        const output = await tool.execute(step.toolInput, context);
        results.push({
          step: step.thought,
          tool: step.toolName,
          input: step.toolInput,
          output,
        });
      }

      return {
        plan,
        results,
        finalThought: plan.finalThought,
      };
    } catch (error) {
      status = 'FAILED';
      throw error;
    } finally {
      // 3. Save Trace
      await traceRepository
        .save({
          runId: context.runId,
          userId: context.userId,
          input,
          plan,
          steps: results,
          finalOutput: plan?.finalThought,
          durationMs: Date.now() - startTime,
          status,
        })
        .catch((err) => console.error('Failed to save trace:', err));
    }
  }
}
