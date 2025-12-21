import { describe, it, expect, vi } from 'vitest';
import { Planner } from './planner';
import { toolRegistry } from './registry';
import { AgentTool } from './types';
import { z } from 'zod';

// Mock generateObject
vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      steps: [
        {
          thought: 'List issues to find bugs',
          toolName: 'list_issues',
          toolInput: { status: 'OPEN' },
        },
      ],
    },
  }),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(),
}));

describe('Planner', () => {
  it('should generate a plan based on tools', async () => {
    // Setup registry
    const mockTool: AgentTool = {
      name: 'list_issues',
      description: 'List issues',
      schema: z.any(),
      execute: async () => {},
    };
    toolRegistry.clear();
    toolRegistry.register(mockTool);

    const planner = new Planner();
    const plan = await planner.plan('Find open bugs');

    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].toolName).toBe('list_issues');
  });
});
