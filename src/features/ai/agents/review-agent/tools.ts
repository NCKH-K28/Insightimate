/**
 * Review Agent Tools
 *
 * Tools for reviewing task quality, descriptions, and acceptance criteria
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
import { getProject, ZGetProjectInput } from '../../insightmate/services/project';
import { llmAnalyze, buildIssueContext } from '../utils/llm-analyze';

// ===== Schemas =====

export const ZReviewDescriptionInput = z.object({
  issueId: z.string().describe('Issue ID to review'),
});

export const ZReviewDescriptionOutput = z.object({
  score: z.number().min(1).max(10).describe('Quality score (1-10)'),
  issues: z
    .array(
      z.object({
        type: z.enum(['clarity', 'completeness', 'actionability', 'scope', 'technical']),
        severity: z.enum(['critical', 'major', 'minor']),
        description: z.string(),
        location: z.string().optional(),
      }),
    )
    .describe('Issues found in the description'),
  strengths: z.array(z.string()).describe('Strengths of the description'),
  overallAssessment: z.string().describe('Overall assessment summary'),
});

export const ZSuggestImprovementsInput = z.object({
  issueId: z.string().describe('Issue ID to improve'),
  focusAreas: z
    .array(z.enum(['summary', 'description', 'acceptance-criteria', 'technical-notes']))
    .optional()
    .describe('Specific areas to focus on'),
});

export const ZSuggestImprovementsOutput = z.object({
  suggestions: z
    .array(
      z.object({
        area: z.enum(['summary', 'description', 'acceptance-criteria', 'technical-notes']),
        original: z.string().optional(),
        suggested: z.string(),
        reason: z.string(),
      }),
    )
    .describe('Improvement suggestions'),
  improvedDescription: z.string().optional().describe('Full improved description'),
  improvedAcceptanceCriteria: z.array(z.string()).optional().describe('Improved ACs'),
});

export const ZCheckAcceptanceCriteriaInput = z.object({
  issueId: z.string().describe('Issue ID to check'),
});

export const ZCheckAcceptanceCriteriaOutput = z.object({
  hasAcceptanceCriteria: z.boolean().describe('Whether ACs exist'),
  count: z.number().describe('Number of ACs'),
  quality: z.enum(['excellent', 'good', 'fair', 'poor', 'none']).describe('Quality assessment'),
  issues: z
    .array(
      z.object({
        criterion: z.string(),
        issue: z.string(),
        suggestion: z.string(),
      }),
    )
    .describe('Issues with existing ACs'),
  suggestedACs: z.array(z.string()).describe('Suggested additional ACs'),
});

export const ZValidateCompletenessInput = z.object({
  issueId: z.string().describe('Issue ID to validate'),
});

export const ZValidateCompletenessOutput = z.object({
  isComplete: z.boolean().describe('Whether the issue definition is complete'),
  score: z.number().min(0).max(100).describe('Completeness percentage'),
  checklist: z
    .array(
      z.object({
        item: z.string(),
        status: z.enum(['present', 'missing', 'incomplete']),
        importance: z.enum(['required', 'recommended', 'optional']),
      }),
    )
    .describe('Completeness checklist'),
  missingRequired: z.array(z.string()).describe('Missing required fields'),
  recommendations: z.array(z.string()).describe('Recommendations to improve'),
});

// ===== Tool Definitions =====

export const reviewDescriptionTool: AgentToolDefinition<typeof ZReviewDescriptionInput> = {
  name: 'review_description',
  description:
    'Review the quality of an issue description for clarity, completeness, and actionability.',
  inputSchema: ZReviewDescriptionInput,
  execute: async (input, context) => {
    const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });
    const issueContext = buildIssueContext(issue);

    const result = await llmAnalyze({
      schema: ZReviewDescriptionOutput,
      systemContext: `You are a QA specialist reviewing user story quality.
Assess: clarity, completeness, actionability, scope definition, technical detail.
Be constructive and specific with feedback.`,
      prompt: `Review the quality of this task description:

${issueContext}

Evaluate:
1. Is it clear what needs to be done?
2. Is there enough context?
3. Are there measurable outcomes?
4. Is the scope well-defined?
5. Are technical considerations addressed?

Provide a score (1-10), list issues with severity, identify strengths, and give an overall assessment.`,
    });

    return result;
  },
};

export const suggestImprovementsTool: AgentToolDefinition<typeof ZSuggestImprovementsInput> = {
  name: 'suggest_improvements',
  description: 'Suggest improvements for issue summary, description, or acceptance criteria.',
  inputSchema: ZSuggestImprovementsInput,
  execute: async (input, context) => {
    const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });
    const issueContext = buildIssueContext(issue);

    const focusText = input.focusAreas?.length
      ? `Focus on these areas: ${input.focusAreas.join(', ')}`
      : 'Cover all areas: summary, description, acceptance criteria, technical notes';

    const result = await llmAnalyze({
      schema: ZSuggestImprovementsOutput,
      systemContext: `You are a technical writer improving user story documentation.
Write clear, concise, actionable content.
Use Given-When-Then format for acceptance criteria.`,
      prompt: `Suggest improvements for this task:

${issueContext}

${focusText}

For each suggestion:
- Area being improved
- Original text (if applicable)
- Suggested replacement
- Reason for the change

Also provide a full improved description and list of acceptance criteria if appropriate.`,
    });

    return result;
  },
};

export const checkAcceptanceCriteriaTool: AgentToolDefinition<
  typeof ZCheckAcceptanceCriteriaInput
> = {
  name: 'check_acceptance_criteria',
  description: 'Check if acceptance criteria exist and assess their quality.',
  inputSchema: ZCheckAcceptanceCriteriaInput,
  execute: async (input, context) => {
    const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });
    const description = issue.description || '';

    // Check for AC patterns
    const acPatterns = [
      /acceptance criteria/i,
      /\[[ x]\]/g, // Checkboxes
      /given.*when.*then/i, // Gherkin
      /✅|☑️|☐/g, // Unicode checkboxes
      /^-\s/gm, // Bullet lists
    ];

    const hasExplicitAC = acPatterns.some((p) => p.test(description));

    // Extract potential ACs (lines that look like criteria)
    const lines = description.split('\n').filter((l) => l.trim());
    const potentialACs = lines.filter(
      (l) =>
        l.match(/^[-*•]\s/) || // Bullets
        l.match(/^\d+\.\s/) || // Numbered
        l.match(/\[[ x]\]/) || // Checkboxes
        l.match(/^(given|when|then|and)\s/i), // Gherkin
    );

    const result = await llmAnalyze({
      schema: ZCheckAcceptanceCriteriaOutput,
      systemContext: `You are a QA engineer evaluating acceptance criteria.
Good ACs are: specific, measurable, testable, using Given-When-Then format.`,
      prompt: `Evaluate the acceptance criteria in this task:

Summary: ${issue.summary}

Description:
${description}

Identified potential ACs:
${potentialACs.length > 0 ? potentialACs.join('\n') : 'None found'}

Assess:
1. Do proper ACs exist?
2. How many clear ACs are there?
3. Quality rating (excellent/good/fair/poor/none)
4. Issues with existing ACs
5. Suggested additional ACs (Given-When-Then format)`,
    });

    return {
      ...result,
      hasAcceptanceCriteria: hasExplicitAC || result.count > 0,
    };
  },
};

export const validateCompletenessTool: AgentToolDefinition<typeof ZValidateCompletenessInput> = {
  name: 'validate_completeness',
  description: 'Validate if an issue has all required information for development.',
  inputSchema: ZValidateCompletenessInput,
  execute: async (input, context) => {
    const issue = await getIssue({ id: input.issueId }, { actorId: context.actorId });

    // Build checklist based on issue data
    type ChecklistItem = {
      item: string;
      status: 'present' | 'missing' | 'incomplete';
      importance: 'required' | 'recommended' | 'optional';
    };

    const checklist: ChecklistItem[] = [
      {
        item: 'Summary',
        status: issue.summary && issue.summary.length > 5 ? 'present' : 'missing',
        importance: 'required',
      },
      {
        item: 'Description',
        status: issue.description
          ? issue.description.length > 50
            ? 'present'
            : 'incomplete'
          : 'missing',
        importance: 'required',
      },
      {
        item: 'Type',
        status: issue.type ? 'present' : 'missing',
        importance: 'required',
      },
      {
        item: 'Priority',
        status: issue.priority ? 'present' : 'missing',
        importance: 'recommended',
      },
      {
        item: 'Assignee',
        status: issue.assigneeId ? 'present' : 'missing',
        importance: 'optional',
      },
      {
        item: 'Story Points',
        status: typeof issue.storyPoints === 'number' ? 'present' : 'missing',
        importance: 'recommended',
      },
      {
        item: 'Due Date',
        status: issue.dueDate ? 'present' : 'missing',
        importance: 'optional',
      },
    ];

    // Check for acceptance criteria in description
    const hasAC = issue.description
      ? /acceptance criteria|given.*when.*then|\[[ x]\]/i.test(issue.description)
      : false;
    checklist.push({
      item: 'Acceptance Criteria',
      status: hasAC ? 'present' : 'missing',
      importance: 'recommended',
    });

    // Calculate score
    const weights = { required: 3, recommended: 2, optional: 1 };
    const totalWeight = checklist.reduce((sum, c) => sum + weights[c.importance], 0);
    const earnedWeight = checklist.reduce(
      (sum, c) => sum + (c.status === 'present' ? weights[c.importance] : 0),
      0,
    );
    const score = Math.round((earnedWeight / totalWeight) * 100);

    // Find missing required items
    const missingRequired = checklist
      .filter((c) => c.status === 'missing' && c.importance === 'required')
      .map((c) => c.item);

    const missingRecommended = checklist
      .filter((c) => c.status === 'missing' && c.importance === 'recommended')
      .map((c) => c.item);

    // Generate recommendations
    const recommendations: string[] = [];
    if (missingRequired.length > 0) {
      recommendations.push(`Add missing required fields: ${missingRequired.join(', ')}`);
    }
    if (missingRecommended.length > 0) {
      recommendations.push(`Consider adding: ${missingRecommended.join(', ')}`);
    }
    if (checklist.find((c) => c.item === 'Description')?.status === 'incomplete') {
      recommendations.push('Expand description to provide more context');
    }

    return {
      isComplete: missingRequired.length === 0,
      score,
      checklist,
      missingRequired,
      recommendations,
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

// ===== All Review Agent Tools =====

export const reviewAgentTools = [
  reviewDescriptionTool,
  suggestImprovementsTool,
  checkAcceptanceCriteriaTool,
  validateCompletenessTool,
  getIssueTool,
  listIssuesTool,
  getProjectTool,
  patchIssuesTool,
];
