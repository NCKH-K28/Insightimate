import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from './registry';
import { AgentTool } from './types';
import { z } from 'zod';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  const mockTool: AgentTool = {
    name: 'test_tool',
    description: 'A test tool',
    schema: z.object({ foo: z.string() }),
    execute: async ({ foo }) => ({ bar: foo }),
  };

  it('should register and retrieve a tool', () => {
    registry.register(mockTool);
    const retrieved = registry.get('test_tool');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('test_tool');
  });

  it('should list all tools', () => {
    registry.register(mockTool);
    expect(registry.list()).toHaveLength(1);
  });

  it('should overwrite existing tool with same name', () => {
    registry.register(mockTool);
    const newTool = { ...mockTool, description: 'Updated' };
    registry.register(newTool);
    expect(registry.get('test_tool')?.description).toBe('Updated');
  });
});
