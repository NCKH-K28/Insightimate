'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle2, Code, FileText, Layers, PackagePlus, TestTube } from 'lucide-react';

interface Subtask {
  summary: string;
  description?: string;
  typeId?: string;
  statusId?: string;
  priorityId?: string;
  storyPoints?: number;
}

interface CreateSubtasksInput {
  projectId: string;
  parentIssueId?: string;
  subtasks: Subtask[];
}

// Estimate story points color
const getPointsColor = (points?: number) => {
  if (!points) return 'bg-muted text-muted-foreground';
  if (points <= 2) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (points <= 5)
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (points <= 8)
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

// Get icon based on summary keywords
const getTaskIcon = (summary: string) => {
  const lower = summary.toLowerCase();
  if (lower.includes('test')) return <TestTube className='size-4' />;
  if (lower.includes('api') || lower.includes('backend')) return <Code className='size-4' />;
  if (lower.includes('ui') || lower.includes('frontend') || lower.includes('design'))
    return <Layers className='size-4' />;
  if (lower.includes('doc')) return <FileText className='size-4' />;
  return <CheckCircle2 className='size-4' />;
};

interface SubtasksApprovalCardProps {
  input: CreateSubtasksInput;
  className?: string;
}

export const SubtasksApprovalCard: React.FC<SubtasksApprovalCardProps> = ({ input, className }) => {
  const totalPoints = input.subtasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  return (
    <Card className={cn('border-orange-200 dark:border-orange-800/50 overflow-hidden', className)}>
      <CardHeader className='bg-linear-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 py-3 px-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-800/50'>
              <PackagePlus className='size-4 text-orange-600 dark:text-orange-400' />
            </div>
            <div>
              <CardTitle className='text-sm font-semibold'>Create Subtasks</CardTitle>
              <CardDescription className='text-xs'>
                {input.parentIssueId && (
                  <span className='font-mono text-orange-600 dark:text-orange-400'>
                    {input.parentIssueId}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='text-xs'>
              {input.subtasks.length} tasks
            </Badge>
            <Badge
              variant='outline'
              className={cn('text-xs font-mono', getPointsColor(totalPoints))}
            >
              {totalPoints} pts
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <Accordion type='single' collapsible className='w-full'>
          {input.subtasks.map((subtask, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className='border-b-0 border-t border-border/50'
            >
              <AccordionTrigger className='px-4 py-2.5 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/30'>
                <div className='flex items-center gap-3 text-left flex-1 min-w-0'>
                  <span className='flex size-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium'>
                    {index + 1}
                  </span>
                  <span className='text-muted-foreground shrink-0'>
                    {getTaskIcon(subtask.summary)}
                  </span>
                  <span className='text-sm font-medium truncate flex-1'>{subtask.summary}</span>
                  {subtask.storyPoints && (
                    <Badge
                      variant='outline'
                      className={cn(
                        'text-xs font-mono shrink-0 ml-2',
                        getPointsColor(subtask.storyPoints),
                      )}
                    >
                      {subtask.storyPoints} pts
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className='px-4 pb-3'>
                <div className='pl-9 text-sm text-muted-foreground leading-relaxed'>
                  {subtask.description || 'No description provided.'}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

// Generic tool approval renderer - detects tool type and renders appropriate UI
interface ToolApprovalRendererProps {
  toolName: string;
  input: unknown;
  className?: string;
}

export const ToolApprovalRenderer: React.FC<ToolApprovalRendererProps> = ({
  toolName,
  input,
  className,
}) => {
  // Render custom UI for known tools
  if (toolName === 'create_subtasks' && isCreateSubtasksInput(input)) {
    return <SubtasksApprovalCard input={input} className={className} />;
  }

  // Fallback: Render JSON for unknown tools
  return (
    <Card className={cn('border-border', className)}>
      <CardHeader className='py-3 px-4'>
        <CardTitle className='text-sm font-medium'>Tool Input</CardTitle>
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <pre className='text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-60'>
          {JSON.stringify(input, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

// Type guard
function isCreateSubtasksInput(input: unknown): input is CreateSubtasksInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    'subtasks' in input &&
    Array.isArray((input as CreateSubtasksInput).subtasks)
  );
}
