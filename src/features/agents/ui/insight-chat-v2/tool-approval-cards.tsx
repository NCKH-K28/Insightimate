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
import {
  CheckCircle2,
  Code,
  FileText,
  Layers,
  PackagePlus,
  TestTube,
  Target,
  Clock,
  ArrowUpDown,
  Pencil,
  PlusCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// ============= Types =============

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

interface SetEstimationInput {
  issueId: string;
  storyPoints: number;
  estimatedHours?: number;
}

interface ReorderBacklogInput {
  projectId: string;
  sprintId?: string;
  criteria: 'wsjf' | 'urgency' | 'impact' | 'manual';
}

interface PatchIssuesInput {
  creates?: Array<{ summary: string; projectId: string; [key: string]: unknown }>;
  updates?: Array<{ id: string; statusId?: string; summary?: string; [key: string]: unknown }>;
  deletes?: Array<{ id: string }>;
}

// ============= Helpers =============

const getPointsColor = (points?: number) => {
  if (!points) return 'bg-muted text-muted-foreground';
  if (points <= 2) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (points <= 5)
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  if (points <= 8)
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

const getTaskIcon = (summary: string) => {
  const lower = summary.toLowerCase();
  if (lower.includes('test')) return <TestTube className='size-4' />;
  if (lower.includes('api') || lower.includes('backend')) return <Code className='size-4' />;
  if (lower.includes('ui') || lower.includes('frontend') || lower.includes('design'))
    return <Layers className='size-4' />;
  if (lower.includes('doc')) return <FileText className='size-4' />;
  return <CheckCircle2 className='size-4' />;
};

const getCriteriaLabel = (criteria: string) => {
  switch (criteria) {
    case 'wsjf':
      return 'WSJF Score';
    case 'urgency':
      return 'Urgency';
    case 'impact':
      return 'Impact';
    case 'manual':
      return 'Manual Order';
    default:
      return criteria;
  }
};

// ============= SubtasksApprovalCard =============

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

// ============= EstimationApprovalCard =============

interface EstimationApprovalCardProps {
  input: SetEstimationInput;
  className?: string;
}

export const EstimationApprovalCard: React.FC<EstimationApprovalCardProps> = ({
  input,
  className,
}) => {
  return (
    <Card className={cn('border-purple-200 dark:border-purple-800/50 overflow-hidden', className)}>
      <CardHeader className='bg-linear-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 py-3 px-4'>
        <div className='flex items-center gap-3'>
          <div className='flex size-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-800/50'>
            <Target className='size-4 text-purple-600 dark:text-purple-400' />
          </div>
          <div>
            <CardTitle className='text-sm font-semibold'>Set Estimation</CardTitle>
            <CardDescription className='text-xs font-mono text-purple-600 dark:text-purple-400'>
              {input.issueId}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='flex items-center justify-center gap-6'>
          <div className='flex flex-col items-center gap-2'>
            <div
              className={cn(
                'flex size-16 items-center justify-center rounded-xl text-2xl font-bold',
                getPointsColor(input.storyPoints),
              )}
            >
              {input.storyPoints}
            </div>
            <span className='text-xs text-muted-foreground'>Story Points</span>
          </div>
          {input.estimatedHours && (
            <>
              <Separator orientation='vertical' className='h-12' />
              <div className='flex flex-col items-center gap-2'>
                <div className='flex size-16 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-2xl font-bold text-blue-700 dark:text-blue-400'>
                  <Clock className='size-5 mr-1' />
                  {input.estimatedHours}h
                </div>
                <span className='text-xs text-muted-foreground'>Hours</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============= ReorderBacklogApprovalCard =============

interface ReorderBacklogApprovalCardProps {
  input: ReorderBacklogInput;
  className?: string;
}

export const ReorderBacklogApprovalCard: React.FC<ReorderBacklogApprovalCardProps> = ({
  input,
  className,
}) => {
  return (
    <Card className={cn('border-blue-200 dark:border-blue-800/50 overflow-hidden', className)}>
      <CardHeader className='bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 py-3 px-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-800/50'>
              <ArrowUpDown className='size-4 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <CardTitle className='text-sm font-semibold'>Reorder Backlog</CardTitle>
              <CardDescription className='text-xs'>
                Sắp xếp lại theo {getCriteriaLabel(input.criteria)}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant='outline'
            className='text-xs bg-blue-100/50 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300'
          >
            {getCriteriaLabel(input.criteria)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='space-y-2 text-sm'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>Project:</span>
            <span className='font-mono text-xs'>{input.projectId}</span>
          </div>
          {input.sprintId && (
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground'>Sprint:</span>
              <span className='font-mono text-xs'>{input.sprintId}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ============= PatchIssuesApprovalCard =============

interface PatchIssuesApprovalCardProps {
  input: PatchIssuesInput;
  className?: string;
}

export const PatchIssuesApprovalCard: React.FC<PatchIssuesApprovalCardProps> = ({
  input,
  className,
}) => {
  const createCount = input.creates?.length || 0;
  const updateCount = input.updates?.length || 0;
  const deleteCount = input.deletes?.length || 0;

  return (
    <Card
      className={cn('border-emerald-200 dark:border-emerald-800/50 overflow-hidden', className)}
    >
      <CardHeader className='bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 py-3 px-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-800/50'>
              <Pencil className='size-4 text-emerald-600 dark:text-emerald-400' />
            </div>
            <CardTitle className='text-sm font-semibold'>Update Issues</CardTitle>
          </div>
          <div className='flex items-center gap-2'>
            {createCount > 0 && (
              <Badge className='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs'>
                <PlusCircle className='size-3 mr-1' /> {createCount}
              </Badge>
            )}
            {updateCount > 0 && (
              <Badge className='bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs'>
                <Pencil className='size-3 mr-1' /> {updateCount}
              </Badge>
            )}
            {deleteCount > 0 && (
              <Badge className='bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs'>
                <Trash2 className='size-3 mr-1' /> {deleteCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-4 space-y-3'>
        {/* Creates */}
        {input.creates && input.creates.length > 0 && (
          <div className='space-y-1'>
            <div className='text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1'>
              <PlusCircle className='size-3' /> Create
            </div>
            {input.creates.map((item, idx) => (
              <div key={idx} className='text-sm pl-4 flex items-center gap-2'>
                <ArrowUp className='size-3 text-green-500' />
                <span>{item.summary}</span>
              </div>
            ))}
          </div>
        )}

        {/* Updates */}
        {input.updates && input.updates.length > 0 && (
          <div className='space-y-1'>
            <div className='text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1'>
              <Pencil className='size-3' /> Update
            </div>
            {input.updates.map((item, idx) => (
              <div key={idx} className='text-sm pl-4 flex items-center gap-2'>
                <Minus className='size-3 text-blue-500' />
                <span className='font-mono text-xs'>{item.id}</span>
                {item.statusId && <span className='text-muted-foreground'>→ Status change</span>}
                {item.summary && (
                  <span className='text-muted-foreground truncate max-w-40'>→ {item.summary}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Deletes */}
        {input.deletes && input.deletes.length > 0 && (
          <div className='space-y-1'>
            <div className='text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1'>
              <Trash2 className='size-3' /> Delete
            </div>
            {input.deletes.map((item, idx) => (
              <div key={idx} className='text-sm pl-4 flex items-center gap-2'>
                <ArrowDown className='size-3 text-red-500' />
                <span className='font-mono text-xs'>{item.id}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============= ToolApprovalRenderer =============

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

  if (toolName === 'set_estimation' && isSetEstimationInput(input)) {
    return <EstimationApprovalCard input={input} className={className} />;
  }

  if (toolName === 'reorder_backlog' && isReorderBacklogInput(input)) {
    return <ReorderBacklogApprovalCard input={input} className={className} />;
  }

  if (toolName === 'patch_issues' && isPatchIssuesInput(input)) {
    return <PatchIssuesApprovalCard input={input} className={className} />;
  }

  // Fallback: Render JSON for unknown tools
  return (
    <Card className={cn('border-border', className)}>
      <CardHeader className='py-3 px-4'>
        <CardTitle className='text-sm font-medium'>Tool: {toolName}</CardTitle>
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <pre className='text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-60'>
          {JSON.stringify(input, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

// ============= Type Guards =============

function isCreateSubtasksInput(input: unknown): input is CreateSubtasksInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    'subtasks' in input &&
    Array.isArray((input as CreateSubtasksInput).subtasks)
  );
}

function isSetEstimationInput(input: unknown): input is SetEstimationInput {
  return (
    typeof input === 'object' && input !== null && 'issueId' in input && 'storyPoints' in input
  );
}

function isReorderBacklogInput(input: unknown): input is ReorderBacklogInput {
  return typeof input === 'object' && input !== null && 'projectId' in input && 'criteria' in input;
}

function isPatchIssuesInput(input: unknown): input is PatchIssuesInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    ('creates' in input || 'updates' in input || 'deletes' in input)
  );
}
