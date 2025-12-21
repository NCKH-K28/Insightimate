import { NextRequest, NextResponse } from 'next/server';
import { generateIssues, GenerateRequestSchema } from '@/features/agents/old';

export async function GET(_req: NextRequest) {
  try {
    const validated = GenerateRequestSchema.safeParse({
      prompt: 'Generate 5 issues for the project',
      contexts: {
        issueTypes: [
          { id: 'epic', name: 'Epic', hierarchy: 2 },
          { id: 'story', name: 'Story', hierarchy: 1 },
          { id: 'task', name: 'Task', hierarchy: 1 },
          { id: 'sub-task', name: 'Sub-Task', hierarchy: 0 },
        ],
        statuses: [
          { id: 'todo', name: 'To Do', category: 'TODO' },
          { id: 'in-progress', name: 'In Progress', category: 'IN_PROGRESS' },
          { id: 'done', name: 'Done', category: 'DONE' },
        ],
        priorities: [
          { id: 'low', name: 'Low' },
          { id: 'medium', name: 'Medium' },
          { id: 'high', name: 'High' },
        ],
        defaultStatusId: 'todo',
        defaultPriorityId: 'low',
      },
    });

    if (!validated.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validated.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    // Call the agent
    const { issues } = await generateIssues(validated.data);

    return NextResponse.json({ issues });
  } catch (error: any) {
    console.error('[API] Agent Generation Error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      },
      { status: 500 },
    );
  }
}
