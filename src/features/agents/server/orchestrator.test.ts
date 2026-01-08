import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOrchestrator } from './orchestrator';
import { toolRegistry } from './registry';
import { AgentTool } from './types';
import { z } from 'zod';

// Mock Planner
vi.mock('./planner', () => {
  return {
    Planner: class {
      plan = vi.fn().mockResolvedValue({
        steps: [
          {
            thought: 'Test thought',
            toolName: 'mock_tool',
            toolInput: { val: 'hello' },
          },
        ],
        finalThought: 'Done',
      });
    },
  };
});

describe('AgentOrchestrator', () => {
  const mockContext = {
    userId: 'user1',
    workspaceId: 'ws1',
    runId: 'run1',
  };

  beforeEach(() => {
    toolRegistry.clear();
  });

  it('should execute a plan', async () => {
    const mockTool: AgentTool = {
      name: 'mock_tool',
      description: 'Mock',
      schema: z.object({ val: z.string() }),
      execute: async ({ val }) => ({ result: val.toUpperCase() }),
    };
    toolRegistry.register(mockTool);

    const orchestrator = new AgentOrchestrator();
    const result = await orchestrator.run('Do something', mockContext);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].output).toEqual({ result: 'HELLO' });
    expect(result.finalThought).toBe('Done');
  });
});
