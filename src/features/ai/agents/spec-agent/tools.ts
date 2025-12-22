/**
 * Spec Agent Tools
 *
 * Tools for analyzing requirements and breaking down tasks
 */

import { z } from 'zod';
import { AgentToolDefinition, AgentContext } from '../base-streaming-agent';
import {
  getIssue,
  listIssues,
  patchIssues,
  ZGetIssueInput,
  ZListIssuesInput,
} from '../../insightmate/services/issues';
import { getProject, ZGetProjectInput } from '../../insightmate/services/project';
import { llmAnalyze, buildIssueContext, buildIssuesContext } from '../utils/llm-analyze';

// ===== Schemas =====

export const ZAnalyzeRequirementInput = z.object({
  text: z.string().min(1).describe('The requirement text to analyze'),
  projectId: z.string().optional().describe('Optional project ID for context'),
});

export const ZAnalyzeRequirementOutput = z.object({
  summary: z.string().describe('Brief summary of the requirement'),
  requirements: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        type: z.enum(['functional', 'non-functional', 'technical', 'business']),
        priority: z.enum(['must-have', 'should-have', 'nice-to-have']),
      }),
    )
    .describe('Extracted requirements'),
  assumptions: z.array(z.string()).describe('Assumptions made during analysis'),
  questions: z.array(z.string()).describe('Clarifying questions for the user'),
});

export const ZBreakdownTaskInput = z.object({
  issueId: z.string().optional().describe('Existing issue ID to break down'),
  description: z.string().optional().describe('Task description to break down'),
  maxSubtasks: z.number().min(1).max(20).default(10).describe('Maximum number of subtasks'),
});

export const ZSubTask = z.object({
  summary: z.string().describe('Short summary of the subtask'),
  description: z.string().describe('Detailed description'),
  type: z.enum(['Frontend', 'Backend', 'Database', 'DevOps', 'Design', 'Testing', 'Documentation']),
  estimatedPoints: z.number().min(1).max(21).describe('Fibonacci story points'),
  acceptanceCriteria: z.array(z.string()).describe('Acceptance criteria'),
  technicalNotes: z.string().optional().describe('Technical implementation notes'),
});

export const ZBreakdownTaskOutput = z.object({
  parentSummary: z.string().describe('Summary of the parent task'),
  subtasks: z.array(ZSubTask).describe('List of subtasks'),
  totalEstimatedPoints: z.number().describe('Sum of all subtask points'),
  suggestedOrder: z.array(z.number()).describe('Suggested execution order (indices)'),
});

export const ZSuggestDependenciesInput = z.object({
  taskIds: z.array(z.string()).min(2).describe('Task IDs to analyze for dependencies'),
  projectId: z.string().optional().describe('Project ID for context'),
});

export const ZDependency = z.object({
  from: z.string().describe('Task ID that depends on another'),
  to: z.string().describe('Task ID that must be completed first'),
  type: z.enum(['blocks', 'relates-to', 'duplicates']),
  reason: z.string().describe('Reason for the dependency'),
});

export const ZSuggestDependenciesOutput = z.object({
  dependencies: z.array(ZDependency).describe('Suggested dependencies'),
  independentTasks: z.array(z.string()).describe('Tasks that can be worked independently'),
  criticalPath: z.array(z.string()).describe('Critical path task IDs'),
});

// Schema for creating subtasks in database
export const ZCreateSubtasksInput = z.object({
  projectId: z.string().describe('Project ID to create subtasks in'),
  parentIssueId: z.string().optional().describe('Parent issue ID for subtasks'),
  subtasks: z
    .array(
      z.object({
        summary: z.string().describe('Subtask summary'),
        description: z.string().optional().describe('Subtask description'),
        typeId: z.string().describe('Issue type ID'),
        statusId: z.string().describe('Initial status ID'),
        priorityId: z.string().describe('Priority ID'),
        storyPoints: z.number().optional().describe('Story points estimate'),
      }),
    )
    .describe('List of subtasks to create'),
});

export const ZCreateSubtasksOutput = z.object({
  success: z.boolean(),
  createdCount: z.number(),
  createdIssueIds: z.array(z.string()),
  message: z.string(),
});

// ===== Tool Definitions =====

export const analyzeRequirementTool: AgentToolDefinition<typeof ZAnalyzeRequirementInput> = {
  name: 'analyze_requirement',
  description:
    'Analyze a requirement text and extract actionable items, assumptions, and clarifying questions.',
  inputSchema: ZAnalyzeRequirementInput,
  execute: async (input, context) => {
    // Fetch project context if available
    let projectContext = '';
    if (input.projectId) {
      try {
        const project = await getProject({ id: input.projectId }, { actorId: context.actorId });
        projectContext = `Project: ${project.name}\nTypes: ${project.types?.map((t: { name: string }) => t.name).join(', ') || 'N/A'}`;
      } catch {
        // Ignore errors
      }
    }

    const systemPrompt = `You are a software requirements analyst. Analyze the given requirement and extract structured information.
${projectContext ? `\n${projectContext}` : ''}`;

    const result = await llmAnalyze({
      schema: ZAnalyzeRequirementOutput,
      systemContext: systemPrompt,
      prompt: `Analyze this requirement:

REQUIREMENT:
${input.text}

Extract:
1. A brief summary (1-2 sentences)
2. Clear requirements (assign unique IDs like REQ-1, REQ-2)
3. Any assumptions you're making
4. Questions that need clarification before implementation`,
    });

    return result;
  },
};

export const breakdownTaskTool: AgentToolDefinition<typeof ZBreakdownTaskInput> = {
  name: 'breakdown_task',
  description: 'Break down a large task or issue into smaller, atomic subtasks with estimates.',
  inputSchema: ZBreakdownTaskInput,
  execute: async (input, context) => {
    let issueDescription = input.description || '';
    let parentSummary = '';

    if (input.issueId) {
      try {
        const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });
        parentSummary = issue.summary;
        issueDescription = `${issue.summary}\n\n${issue.description || ''}`;
      } catch {
        // Fall back to provided description
      }
    }

    if (!issueDescription) {
      return {
        parentSummary: '',
        subtasks: [],
        totalEstimatedPoints: 0,
        suggestedOrder: [],
      };
    }

    const result = await llmAnalyze({
      schema: ZBreakdownTaskOutput,
      systemContext: `You are a technical lead breaking down user stories into implementable subtasks.
Use Fibonacci scale for story points: 1, 2, 3, 5, 8, 13, 21.
Create atomic, testable subtasks.`,
      prompt: `Break down this task into subtasks (max ${input.maxSubtasks}):

TASK:
${issueDescription}

For each subtask provide:
- Summary (short, actionable title)
- Description (detailed implementation guidance)
- Type (Frontend/Backend/Database/DevOps/Design/Testing/Documentation)
- Estimated points (Fibonacci: 1,2,3,5,8,13,21)
- Acceptance criteria (testable conditions)
- Technical notes (optional implementation hints)

Also suggest the optimal execution order as array of indices.`,
    });

    return {
      ...result,
      parentSummary: parentSummary || result.parentSummary,
    };
  },
};

export const suggestDependenciesTool: AgentToolDefinition<typeof ZSuggestDependenciesInput> = {
  name: 'suggest_dependencies',
  description: 'Analyze tasks and suggest dependencies between them, including critical path.',
  inputSchema: ZSuggestDependenciesInput,
  execute: async (input, context) => {
    // Fetch all tasks
    const issues = await listIssues(
      { ids: input.taskIds, pagination: { page: 1, limit: 100, sort: 'asc', sortBy: 'id' } },
      { actorId: context.actorId },
    );

    if (!issues.data?.length) {
      return {
        dependencies: [],
        independentTasks: input.taskIds,
        criticalPath: [],
      };
    }

    const tasksContext = buildIssuesContext(issues.data);

    const result = await llmAnalyze({
      schema: ZSuggestDependenciesOutput,
      systemContext: `You are a project planner analyzing task dependencies.
Identify which tasks block others, relate to each other, or are duplicates.`,
      prompt: `Analyze these tasks for dependencies:

TASKS:
${tasksContext}

For each dependency:
- from: task ID that depends on another
- to: task ID that must be completed first
- type: blocks | relates-to | duplicates
- reason: brief explanation

Also identify:
- Independent tasks (can start immediately)
- Critical path (sequence of blocking tasks)`,
    });

    return result;
  },
};

// Reuse existing tools for fetching context
export const getIssueTool: AgentToolDefinition<typeof ZGetIssueInput> = {
  name: 'get_issue',
  description: 'Get issue details by ID for context',
  inputSchema: ZGetIssueInput,
  execute: async (input, context) => {
    return getIssue(input, { actorId: context.actorId });
  },
};

export const listIssuesTool: AgentToolDefinition<typeof ZListIssuesInput> = {
  name: 'list_issues',
  description: 'List issues with filters for context',
  inputSchema: ZListIssuesInput,
  execute: async (input, context) => {
    return listIssues(input, { actorId: context.actorId });
  },
};

export const getProjectTool: AgentToolDefinition<typeof ZGetProjectInput> = {
  name: 'get_project',
  description: 'Get project details including available types, statuses, priorities',
  inputSchema: ZGetProjectInput,
  execute: async (input, context) => {
    return getProject(input, { actorId: context.actorId });
  },
};

// Tool to create subtasks in database (requires approval)
export const createSubtasksTool: AgentToolDefinition<typeof ZCreateSubtasksInput> = {
  name: 'create_subtasks',
  description:
    'Create subtasks in the database from a breakdown. Requires user approval before execution.',
  inputSchema: ZCreateSubtasksInput,
  needsApproval: true,
  execute: async (input, context) => {
    console.log('[create_subtasks] Tool executed with', input.subtasks.length, 'subtasks');
    try {
      // Build creates array for patchIssues
      const creates = input.subtasks.map((subtask) => ({
        projectId: input.projectId,
        summary: subtask.summary,
        description: subtask.description || '',
        typeId: subtask.typeId,
        statusId: subtask.statusId,
        priorityId: subtask.priorityId,
        storyPoints: subtask.storyPoints,
        parentId: input.parentIssueId,
      }));

      // patchIssues returns void, so we assume success if no error is thrown
      await patchIssues({ creates }, { actorId: context.actorId });

      console.log('[create_subtasks] Successfully created', input.subtasks.length, 'subtasks');

      return {
        success: true,
        createdCount: input.subtasks.length,
        createdIssueIds: [], // IDs not returned by patchIssues
        message: `Successfully created ${input.subtasks.length} subtasks`,
      };
    } catch (error) {
      return {
        success: false,
        createdCount: 0,
        createdIssueIds: [],
        message: `Failed to create subtasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

// ===== All Spec Agent Tools =====

export const specAgentTools = [
  analyzeRequirementTool,
  breakdownTaskTool,
  suggestDependenciesTool,
  createSubtasksTool,
  getIssueTool,
  listIssuesTool,
  getProjectTool,
];
