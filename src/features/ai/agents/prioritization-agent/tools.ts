/**
 * Prioritization Agent Tools
 *
 * Tools for analyzing urgency, impact, and prioritizing backlog using WSJF
 */

import { z } from 'zod';
import { AgentToolDefinition, AgentContext } from '../base-streaming-agent';
import {
  getIssue,
  listIssues,
  patchIssues,
  ZGetIssueInput,
  ZListIssuesInput,
  ZPatchIssueInput,
} from '../../insightmate/services/issues';
import {
  getProject,
  listProjects,
  ZGetProjectInput,
  ZListProjectsInput,
} from '../../insightmate/services/project';
import {
  getSprint,
  listSprints,
  ZGetSprintInput,
  ZListSprintsInput,
} from '../../insightmate/services/sprint';
import { prisma } from '@/lib/prisma';
import { llmAnalyze, buildIssueContext } from '../utils/llm-analyze';

// ===== Schemas =====

export const ZAnalyzeUrgencyInput = z.object({
  issueId: z.string().describe('Issue ID to analyze'),
});

export const ZAnalyzeUrgencyOutput = z.object({
  urgencyScore: z.number().min(1).max(10).describe('Urgency score (1-10)'),
  level: z.enum(['critical', 'high', 'medium', 'low']).describe('Urgency level'),
  factors: z
    .array(
      z.object({
        factor: z.string(),
        score: z.number().min(1).max(10),
        description: z.string(),
      }),
    )
    .describe('Factors contributing to urgency'),
  deadlineRisk: z.boolean().describe('Is there a deadline at risk?'),
  reasoning: z.string().describe('Explanation of urgency assessment'),
});

export const ZAnalyzeImpactInput = z.object({
  issueId: z.string().describe('Issue ID to analyze'),
});

export const ZAnalyzeImpactOutput = z.object({
  impactScore: z.number().min(1).max(10).describe('Business impact score (1-10)'),
  level: z.enum(['critical', 'high', 'medium', 'low']).describe('Impact level'),
  areas: z
    .array(
      z.object({
        area: z.enum(['revenue', 'users', 'operations', 'compliance', 'security', 'tech-debt']),
        impact: z.enum(['positive', 'negative', 'neutral']),
        magnitude: z.enum(['high', 'medium', 'low']),
        description: z.string(),
      }),
    )
    .describe('Business areas affected'),
  riskReduction: z.number().min(0).max(10).describe('Risk reduction value'),
  opportunityEnablement: z.number().min(0).max(10).describe('Opportunity enablement value'),
  reasoning: z.string().describe('Explanation of impact assessment'),
});

export const ZSuggestPriorityInput = z.object({
  issueId: z.string().describe('Issue ID to prioritize'),
  urgencyScore: z.number().optional().describe('Pre-calculated urgency score'),
  impactScore: z.number().optional().describe('Pre-calculated impact score'),
  effortPoints: z.number().optional().describe('Story points for WSJF calculation'),
});

export const ZSuggestPriorityOutput = z.object({
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).describe('Suggested priority'),
  wsjfScore: z.number().describe('Weighted Shortest Job First score'),
  reasoning: z.string().describe('Explanation of priority suggestion'),
  comparison: z
    .array(
      z.object({
        issueId: z.string(),
        priority: z.string(),
        wsjfScore: z.number(),
      }),
    )
    .optional()
    .describe('Comparison with similar issues'),
});

export const ZReorderBacklogInput = z.object({
  projectId: z.string().describe('Project ID to reorder backlog'),
  sprintId: z.string().optional().describe('Specific sprint to reorder'),
  criteria: z
    .enum(['wsjf', 'urgency', 'impact', 'manual'])
    .default('wsjf')
    .describe('Ordering criteria'),
});

export const ZReorderBacklogOutput = z.object({
  orderedIssues: z
    .array(
      z.object({
        issueId: z.string(),
        summary: z.string(),
        priority: z.string(),
        wsjfScore: z.number().optional(),
        rank: z.number(),
      }),
    )
    .describe('Ordered list of issues'),
  changes: z.number().describe('Number of position changes'),
  reasoning: z.string().describe('Explanation of ordering'),
});

// ===== WSJF Calculation Helper =====

function calculateWSJF(urgency: number, impact: number, effort: number): number {
  // WSJF = (Business Value + Time Criticality + Risk Reduction) / Job Size
  // Simplified: (Impact + Urgency) / Effort
  if (effort <= 0) return 0;
  return (impact + urgency) / effort;
}

function scoreToLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function wsjfToPriority(wsjf: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (wsjf >= 3) return 'Critical';
  if (wsjf >= 2) return 'High';
  if (wsjf >= 1) return 'Medium';
  return 'Low';
}

// ===== Tool Definitions =====

export const analyzeUrgencyTool: AgentToolDefinition<typeof ZAnalyzeUrgencyInput> = {
  name: 'analyze_urgency',
  description:
    'Analyze the urgency of an issue based on deadlines, dependencies, and time criticality.',
  inputSchema: ZAnalyzeUrgencyInput,
  execute: async (input, context) => {
    const issue: any = await getIssue({ id: input.issueId }, { actorId: context.actorId });
    const issueContext = buildIssueContext(issue);

    const result = await llmAnalyze({
      schema: ZAnalyzeUrgencyOutput,
      systemContext: `You are a project manager analyzing task urgency.
Consider: deadlines, dependencies, customer impact, team blockers, external factors.
Score 1-10 where 10 is most urgent.`,
      prompt: `Analyze the urgency of this task:

${issueContext}

Factors to consider:
- Due date proximity
- Is it blocking other work?
- Customer expectation
- External commitments
- Current sprint pressure

Provide urgency score (1-10), level, factors, deadline risk, and reasoning.`,
    });

    return result;
  },
};

export const analyzeImpactTool: AgentToolDefinition<typeof ZAnalyzeImpactInput> = {
  name: 'analyze_impact',
  description:
    'Analyze the business impact of an issue including revenue, users, and risk reduction.',
  inputSchema: ZAnalyzeImpactInput,
  execute: async (input, context) => {
    const issue: any = await getIssue({ id: input.issueId }, { actorId: context.actorId });
    const issueContext = buildIssueContext(issue);

    const result = await llmAnalyze({
      schema: ZAnalyzeImpactOutput,
      systemContext: `You are a business analyst assessing feature impact.
Consider: revenue, user experience, operations efficiency, compliance, security, tech debt.
Score 1-10 where 10 is highest impact.`,
      prompt: `Analyze the business impact of this task:

${issueContext}

For each business area, determine:
- Whether it has positive, negative, or neutral impact
- The magnitude (high/medium/low)

Also assess risk reduction and opportunity enablement values.`,
    });

    return result;
  },
};

export const suggestPriorityTool: AgentToolDefinition<typeof ZSuggestPriorityInput> = {
  name: 'suggest_priority',
  description: 'Suggest priority for an issue using WSJF (Weighted Shortest Job First) framework.',
  inputSchema: ZSuggestPriorityInput,
  execute: async (input, context) => {
    const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });

    // Get scores - use provided or defaults
    const urgency = input.urgencyScore || 5;
    const impact = input.impactScore || 5;
    const effort = input.effortPoints || issue.storyPoints || 5;

    // Calculate WSJF
    const wsjfScore = calculateWSJF(urgency, impact, effort);
    const priority = wsjfToPriority(wsjfScore);

    const reasoning = `WSJF Score: ${wsjfScore.toFixed(2)} = (Impact ${impact} + Urgency ${urgency}) / Effort ${effort}

Breakdown:
- Urgency: ${urgency}/10 (${scoreToLevel(urgency)})
- Impact: ${impact}/10 (${scoreToLevel(impact)})
- Effort: ${effort} points

Recommended Priority: ${priority}`;

    return {
      priority,
      wsjfScore: Math.round(wsjfScore * 100) / 100,
      reasoning,
      comparison: undefined, // Could be enhanced to compare with similar issues
    };
  },
};

export const reorderBacklogTool: AgentToolDefinition<typeof ZReorderBacklogInput> = {
  name: 'reorder_backlog',
  description: 'Reorder backlog issues based on prioritization criteria. Requires approval.',
  inputSchema: ZReorderBacklogInput,
  needsApproval: true,
  execute: async (input, context) => {
    // Fetch issues for the project
    const filterParams: Parameters<typeof listIssues>[0] = {
      projectIds: [input.projectId],
      categories: ['TODO', 'IN_PROGRESS'], // Only non-done issues
      pagination: { page: 1, limit: 100, sort: 'asc', sortBy: 'id' },
    };

    if (input.sprintId) {
      filterParams.sprintIds = [input.sprintId];
    }

    const issues = await listIssues(filterParams, { actorId: context.actorId });

    if (!issues.data?.length) {
      return {
        orderedIssues: [],
        changes: 0,
        reasoning: 'No issues found to reorder',
      };
    }

    // Calculate score for each issue based on criteria
    const scoredIssues = issues.data.map((issue) => {
      const urgency = 5; // Default, ideally would analyze each
      const impact = 5; // Default
      const effort = issue.storyPoints || 5;

      let score = 0;
      switch (input.criteria) {
        case 'wsjf':
          score = calculateWSJF(urgency, impact, effort);
          break;
        case 'urgency':
          score = urgency;
          break;
        case 'impact':
          score = impact;
          break;
        default:
          score = 0;
      }

      return {
        issueId: issue.id,
        summary: issue.summary,
        priority: issue.priority?.name || 'None',
        wsjfScore: score,
        originalRank: issue.rank || 0,
      };
    });

    // Sort by score (descending) for priority-based ordering
    const sorted = [...scoredIssues].sort((a, b) => b.wsjfScore - a.wsjfScore);

    // Count position changes
    let changes = 0;
    const orderedIssues = sorted.map((issue, index) => {
      const newRank = index + 1;
      if (issue.originalRank !== newRank) changes++;
      return {
        issueId: issue.issueId,
        summary: issue.summary,
        priority: issue.priority,
        wsjfScore: issue.wsjfScore,
        rank: newRank,
      };
    });

    // Update ranks in database
    if (changes > 0) {
      await prisma.$transaction(
        orderedIssues.map((item) =>
          prisma.boardIssue.updateMany({
            where: { issueId: item.issueId },
            data: { rank: item.rank },
          }),
        ),
      );
    }

    return {
      orderedIssues,
      changes,
      reasoning: `Reordered ${issues.data.length} issues by ${input.criteria}. ${changes} positions changed.`,
    };
  },
};

// Reuse tools for context
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

export const listProjectsTool: AgentToolDefinition<typeof ZListProjectsInput> = {
  name: 'list_projects',
  description:
    'Search and list projects by name, key, or workspace. Use when user mentions a project by name (e.g., "GymViet", "Dự án ABC") to find its ID.',
  inputSchema: ZListProjectsInput,
  execute: async (input, context) => {
    return listProjects(input, { actorId: context.actorId });
  },
};

export const getSprintTool: AgentToolDefinition<typeof ZGetSprintInput> = {
  name: 'get_sprint',
  description: 'Get sprint details by ID. Use to understand sprint scope and timeline.',
  inputSchema: ZGetSprintInput,
  execute: async (input, context) => {
    return getSprint(input, { actorId: context.actorId });
  },
};

export const listSprintsTool: AgentToolDefinition<typeof ZListSprintsInput> = {
  name: 'list_sprints',
  description: 'List sprints for a board. Use to see available sprints for backlog ordering.',
  inputSchema: ZListSprintsInput,
  execute: async (input, context) => {
    return listSprints(input, { actorId: context.actorId });
  },
};

// Cross-agent compatibility tools
export const getProjectTool: AgentToolDefinition<typeof ZGetProjectInput> = {
  name: 'get_project',
  description: 'Get project details including available statuses, types, and priorities.',
  inputSchema: ZGetProjectInput,
  execute: async (input, context) => {
    return getProject(input, { actorId: context.actorId });
  },
};

export const patchIssuesTool: AgentToolDefinition<typeof ZPatchIssueInput> = {
  name: 'patch_issues',
  description:
    'Create, update, or delete issues. Use for status changes, field updates. Requires approval.',
  inputSchema: ZPatchIssueInput,
  needsApproval: true,
  execute: async (input, context) => {
    await patchIssues(input, { actorId: context.actorId });
    return {
      success: true,
      creates: input.creates?.length || 0,
      updates: input.updates?.length || 0,
      deletes: input.deletes?.length || 0,
    };
  },
};

// ===== All Prioritization Agent Tools =====

export const prioritizationAgentTools = [
  analyzeUrgencyTool,
  analyzeImpactTool,
  suggestPriorityTool,
  reorderBacklogTool,
  getIssueTool,
  listIssuesTool,
  listProjectsTool,
  getSprintTool,
  listSprintsTool,
  getProjectTool,
  patchIssuesTool,
];
