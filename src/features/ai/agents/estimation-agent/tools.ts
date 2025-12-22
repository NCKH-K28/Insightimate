/**
 * Estimation Agent Tools
 *
 * Tools for estimating story points, duration, and analyzing historical data
 */

import { z } from 'zod';
import { AgentToolDefinition, AgentContext } from '../base-streaming-agent';
import {
  getIssue,
  listIssues,
  issueMetrics,
  patchIssues,
  ZGetIssueInput,
  ZListIssuesInput,
  ZIssueMetricsInput,
  ZIssueMetricsOutput,
  ZPatchIssueInput,
} from '../../insightmate/services/issues';
import { getProject, ZGetProjectInput } from '../../insightmate/services/project';
import { prisma } from '@/lib/prisma';
import { llmAnalyze, buildIssueContext } from '../utils/llm-analyze';

// ===== Schemas =====

export const ZEstimateStoryPointsInput = z.object({
  issueId: z.string().optional().describe('Issue ID to estimate'),
  description: z.string().optional().describe('Task description to estimate'),
  acceptanceCriteria: z.array(z.string()).optional().describe('Acceptance criteria for context'),
});

export const ZEstimateStoryPointsOutput = z.object({
  points: z.number().describe('Estimated story points (Fibonacci: 1,2,3,5,8,13,21)'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level'),
  reasoning: z.string().describe('Explanation of the estimate'),
  factors: z
    .array(
      z.object({
        factor: z.string(),
        impact: z.enum(['increases', 'decreases', 'neutral']),
        weight: z.number().min(1).max(5),
      }),
    )
    .describe('Factors affecting the estimate'),
  range: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .describe('Possible range if confidence is low'),
});

export const ZEstimateDurationInput = z.object({
  issueId: z.string().optional().describe('Issue ID to estimate'),
  points: z.number().optional().describe('Story points if already estimated'),
  teamVelocity: z.number().optional().describe('Team velocity (points per sprint)'),
  sprintLengthDays: z.number().default(14).describe('Sprint length in days'),
});

export const ZEstimateDurationOutput = z.object({
  durationDays: z.number().describe('Estimated duration in days'),
  durationHours: z.number().describe('Estimated duration in hours'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level'),
  assumptions: z.array(z.string()).describe('Assumptions made'),
});

export const ZAnalyzeHistoricalInput = z.object({
  projectId: z.string().describe('Project ID to analyze'),
  keywords: z.array(z.string()).optional().describe('Keywords to find similar tasks'),
  issueType: z.string().optional().describe('Filter by issue type'),
  limit: z.number().default(20).describe('Maximum number of historical tasks to analyze'),
});

export const ZAnalyzeHistoricalOutput = z.object({
  sampleSize: z.number().describe('Number of historical tasks analyzed'),
  avgPoints: z.number().describe('Average story points'),
  avgDurationDays: z.number().describe('Average actual duration in days'),
  pointsDistribution: z
    .array(
      z.object({
        points: z.number(),
        count: z.number(),
        percentage: z.number(),
      }),
    )
    .describe('Distribution of story points'),
  insights: z.array(z.string()).describe('Key insights from historical data'),
});

export const ZSetEstimationInput = z.object({
  issueId: z.string().describe('Issue ID to update'),
  storyPoints: z.number().describe('Story points to set'),
  estimatedHours: z.number().optional().describe('Estimated hours to set'),
});

export const ZSetEstimationOutput = z.object({
  success: z.boolean(),
  issueId: z.string(),
  message: z.string(),
});

// ===== Tool Definitions =====

export const estimateStoryPointsTool: AgentToolDefinition<typeof ZEstimateStoryPointsInput> = {
  name: 'estimate_story_points',
  description:
    'Estimate story points for a task based on complexity, risk, and effort. Uses Fibonacci scale.',
  inputSchema: ZEstimateStoryPointsInput,
  execute: async (input, context) => {
    let description = input.description || '';
    let issueContext = '';

    if (input.issueId) {
      try {
        const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });
        issueContext = buildIssueContext(issue);
        description = `${issue.summary}\n\n${issue.description || ''}`;
      } catch {
        // Fall back to provided description
      }
    }

    if (!description && !issueContext) {
      return {
        points: 3,
        confidence: 'low' as const,
        reasoning: 'No description provided, using default estimate',
        factors: [],
        range: { min: 1, max: 8 },
      };
    }

    const acText = input.acceptanceCriteria?.length
      ? `\n\nAcceptance Criteria:\n${input.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n')}`
      : '';

    const result = await llmAnalyze({
      schema: ZEstimateStoryPointsOutput,
      systemContext: `You are an experienced agile estimator. Use Fibonacci scale: 1, 2, 3, 5, 8, 13, 21.
Consider: complexity, unknowns, technical debt, testing effort, dependencies.
1-2: trivial changes, 3-5: typical features, 8-13: complex features, 21: needs breakdown.`,
      prompt: `Estimate story points for this task:

${issueContext || description}${acText}

Provide:
1. Points (Fibonacci: 1,2,3,5,8,13,21)
2. Confidence level (low/medium/high)
3. Reasoning for the estimate
4. Factors affecting the estimate with impact and weight
5. A range (min-max) if confidence is low`,
    });

    return result;
  },
};

export const estimateDurationTool: AgentToolDefinition<typeof ZEstimateDurationInput> = {
  name: 'estimate_duration',
  description: 'Estimate duration in days/hours based on story points and team velocity.',
  inputSchema: ZEstimateDurationInput,
  execute: async (input, context) => {
    let points = input.points;

    // If no points provided but issueId given, fetch story points
    if (!points && input.issueId) {
      try {
        const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });
        points = issue.storyPoints ?? undefined;
      } catch {
        // Fall back to default
      }
    }

    points = points || 3; // Default to 3 points
    const velocity = input.teamVelocity || 30; // Default: 30 points per sprint
    const sprintDays = input.sprintLengthDays || 14;

    // Calculate: (points / velocity) * sprintDays
    const durationDays = Math.ceil((points / velocity) * sprintDays);
    const durationHours = durationDays * 8;

    // Determine confidence based on velocity source
    const confidence = input.teamVelocity ? 'high' : 'medium';

    return {
      durationDays,
      durationHours,
      confidence: confidence as 'low' | 'medium' | 'high',
      assumptions: [
        `Story points: ${points}`,
        `Team velocity: ${velocity} points/sprint${input.teamVelocity ? '' : ' (default)'}`,
        `Sprint length: ${sprintDays} days`,
        'No blockers or external dependencies',
        '8-hour workday assumed',
      ],
    };
  },
};

export const analyzeHistoricalTool: AgentToolDefinition<typeof ZAnalyzeHistoricalInput> = {
  name: 'analyze_historical',
  description: 'Analyze historical data from similar completed tasks for estimation reference.',
  inputSchema: ZAnalyzeHistoricalInput,
  execute: async (input, context) => {
    try {
      // Query completed issues (resolvedAt not null)
      const issues = await listIssues(
        {
          projectIds: [input.projectId],
          categories: ['DONE'],
          pagination: { page: 1, limit: input.limit || 20, sort: 'desc', sortBy: 'createdAt' },
        },
        { actorId: context.actorId },
      );

      if (!issues.data?.length) {
        return {
          sampleSize: 0,
          avgPoints: 0,
          avgDurationDays: 0,
          pointsDistribution: [],
          insights: ['No completed issues found in this project'],
        };
      }

      // Calculate statistics
      const issuesWithPoints = issues.data.filter((i) => typeof i.storyPoints === 'number');
      const totalPoints = issuesWithPoints.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
      const avgPoints = issuesWithPoints.length > 0 ? totalPoints / issuesWithPoints.length : 0;

      // Calculate duration (resolvedAt - createdAt)
      const issuesWithDuration = issues.data.filter((i) => i.resolvedAt && i.createdAt);
      let avgDurationDays = 0;
      if (issuesWithDuration.length > 0) {
        const totalDays = issuesWithDuration.reduce((sum, i) => {
          const resolved = new Date(i.resolvedAt!);
          const created = new Date(i.createdAt);
          const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0);
        avgDurationDays = totalDays / issuesWithDuration.length;
      }

      // Calculate points distribution
      const pointsCounts: Record<number, number> = {};
      issuesWithPoints.forEach((i) => {
        const pts = i.storyPoints || 0;
        pointsCounts[pts] = (pointsCounts[pts] || 0) + 1;
      });

      const pointsDistribution = Object.entries(pointsCounts).map(([pts, count]) => ({
        points: Number(pts),
        count,
        percentage: Math.round((count / issuesWithPoints.length) * 100),
      }));

      // Generate insights
      const insights = [
        `Analyzed ${issues.data.length} completed issues`,
        issuesWithPoints.length > 0
          ? `Average story points: ${avgPoints.toFixed(1)}`
          : 'No story points data available',
        avgDurationDays > 0
          ? `Average completion time: ${avgDurationDays.toFixed(1)} days`
          : 'No completion time data available',
      ];

      return {
        sampleSize: issues.data.length,
        avgPoints: Math.round(avgPoints * 10) / 10,
        avgDurationDays: Math.round(avgDurationDays * 10) / 10,
        pointsDistribution,
        insights,
      };
    } catch (error) {
      return {
        sampleSize: 0,
        avgPoints: 0,
        avgDurationDays: 0,
        pointsDistribution: [],
        insights: ['Failed to fetch historical data'],
      };
    }
  },
};

export const setEstimationTool: AgentToolDefinition<typeof ZSetEstimationInput> = {
  name: 'set_estimation',
  description: 'Update the estimation (story points, hours) for an issue. Requires approval.',
  inputSchema: ZSetEstimationInput,
  needsApproval: true,
  execute: async (input, context) => {
    try {
      await prisma.issue.update({
        where: { id: input.issueId },
        data: {
          storyPoints: input.storyPoints,
          originalEstimate: input.estimatedHours,
        },
      });

      return {
        success: true,
        issueId: input.issueId,
        message: `Updated estimation: ${input.storyPoints} story points${input.estimatedHours ? `, ${input.estimatedHours} hours` : ''}`,
      };
    } catch (error) {
      return {
        success: false,
        issueId: input.issueId,
        message: `Failed to update: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

// Reuse get_issue for context
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

export const issueMetricsTool: AgentToolDefinition<typeof ZIssueMetricsInput> = {
  name: 'issue_metrics',
  description:
    'Get metrics for issues in a project (velocity, cycle time, throughput). Use for historical analysis.',
  inputSchema: ZIssueMetricsInput,
  execute: async (input, context) => {
    return issueMetrics(input, { actorId: context.actorId });
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

// ===== All Estimation Agent Tools =====

export const estimationAgentTools = [
  estimateStoryPointsTool,
  estimateDurationTool,
  analyzeHistoricalTool,
  setEstimationTool,
  getIssueTool,
  listIssuesTool,
  issueMetricsTool,
  getProjectTool,
  patchIssuesTool,
];
