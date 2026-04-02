'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  User,
  Calendar,
  Zap,
  GitBranch,
  Clock,
  Target,
  Sparkles,
  AlertCircle,
  Layers,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  getBoardIssueQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { IssueStatusSelector } from '../../selectors';
import { IssueAssigneeSelector } from '../../selectors/issue-assignee-selector';
import { IssueStartDateSelector } from '../../selectors/issue-start-date-selector';
import { IssueDueDateSelector } from '../../selectors/issue-due-date-selector';
import { IssueStoryPointInput } from '../../selectors/issue-story-point-input';
import { IssuePrioritySelector } from '../../selectors/issue-priority-selector';
import { IssueResolutionSelector } from '../../selectors/issue-resolution-selector';
import { IssueTypeSelectors } from '../../selectors/issue-type-selectors';
import BoardIssueSelectors from '../../selectors/board-issue-selectors';

// ============ Types ============

interface IssueSidePanelProps {
  params: { boardId: string; projectId: string; issueId: string; orgSlug?: string };
  className?: string;
}

// ============ Sub Components ============

interface FieldRowProps {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
}

const FieldRow = ({ icon, label, children, className, tooltip }: FieldRowProps) => (
  <div className={cn('group', className)}>
    <div className='flex items-center gap-2 mb-1.5'>
      {icon && (
        <span className='text-muted-foreground/70 group-hover:text-muted-foreground transition-colors'>
          {icon}
        </span>
      )}
      <Label className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
        {label}
      </Label>
      {tooltip && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle className='h-3 w-3 text-muted-foreground/50 cursor-help' />
            </TooltipTrigger>
            <TooltipContent side='top' className='max-w-xs'>
              <p className='text-xs'>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <div className='pl-6'>{children}</div>
  </div>
);

interface MetadataFooterProps {
  createdAt: Date | string;
  updatedAt: Date | string;
  reporter?: { name: string } | null;
}

const MetadataFooter = ({ createdAt, updatedAt, reporter }: MetadataFooterProps) => {
  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);

  return (
    <div className='space-y-2 pt-4 border-t border-border/50'>
      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span className='flex items-center gap-1.5'>
          <Clock className='h-3 w-3' />
          Created
        </span>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='cursor-help'>
                {formatDistanceToNow(createdDate, { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent side='left'>
              <p>{format(createdDate, 'PPpp')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className='flex items-center justify-between text-xs text-muted-foreground'>
        <span className='flex items-center gap-1.5'>
          <Sparkles className='h-3 w-3' />
          Updated
        </span>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='cursor-help'>
                {formatDistanceToNow(updatedDate, { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent side='left'>
              <p>{format(updatedDate, 'PPpp')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {reporter && (
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5'>
            <User className='h-3 w-3' />
            Reporter
          </span>
          <span>{reporter.name}</span>
        </div>
      )}
    </div>
  );
};

// ============ Main Component ============

function IssueSidePanel({ className, params }: IssueSidePanelProps) {
  const { data: issue } = useSuspenseQuery(getBoardIssueQueryOptions(params));

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));
  const handleUpdate = (data: typeof updateIssue.variables) => {
    if (updateIssue.isPending) return;
    if (!data) throw new Error('No data to update');
    updateIssue.mutate(data);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full overflow-hidden',
        'border-l border-border bg-background',
        className,
      )}
      aria-label='Issue details panel'
    >
      {/* Scrollable content */}
      <div className='flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'>
        <div className='p-5 space-y-5'>
          {/* Status — prominent at top */}
          <div className='group'>
            <IssueStatusSelector params={params} />
          </div>

          {/* Properties Section */}
          <Accordion type='multiple' defaultValue={['properties', 'planning']} className='space-y-3'>
            {/* Properties */}
            <AccordionItem
              value='properties'
              className='border rounded-lg bg-card shadow-sm overflow-hidden'
            >
              <AccordionTrigger className='px-4 py-3 hover:no-underline hover:bg-accent/50 transition-colors'>
                <div className='flex items-center gap-2'>
                  <Target className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-semibold'>Properties</span>
                </div>
              </AccordionTrigger>

              <AccordionContent className='px-4 pb-4 pt-2'>
                <div className='space-y-5'>
                  {/* Type */}
                  <FieldRow icon={<Layers className='h-4 w-4' />} label='Type'>
                    <IssueTypeSelectors
                      params={{ projectId: params.projectId }}
                      value={issue.typeId}
                      onChange={(typeId) => {
                        if (typeId) handleUpdate({ typeId });
                      }}
                    />
                  </FieldRow>

                  {/* Priority */}
                  <FieldRow icon={<Flag className='h-4 w-4' />} label='Priority'>
                    <IssuePrioritySelector params={params} />
                  </FieldRow>

                  {/* Assignee */}
                  <FieldRow icon={<User className='h-4 w-4' />} label='Assignee'>
                    <IssueAssigneeSelector params={params} />
                  </FieldRow>

                  {/* Parent Issue */}
                  <FieldRow icon={<GitBranch className='h-4 w-4' />} label='Parent Issue'>
                    <BoardIssueSelectors
                      className='max-w-40 overflow-hidden'
                      placeholder={issue.parent ? issue.parent.summary : 'Select epic'}
                      disabled={updateIssue.isPending}
                      params={{ orgSlug: params.orgSlug ?? '', boardId: issue.boardId }}
                      defaultValue={issue.parentId ?? null}
                      onChange={(value) => handleUpdate({ parentId: value })}
                      queryFilter={{
                        filter: { issueType: { hierarchy: issue.type.hierarchy + 1 } },
                      }}
                    />
                  </FieldRow>

                  {/* Sprint */}
                  <FieldRow icon={<Zap className='h-4 w-4' />} label='Sprint'>
                    {issue.sprint ? (
                      <div className='flex items-center gap-2 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30'>
                        <Zap className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                        <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                          {issue.sprint.name}
                        </span>
                      </div>
                    ) : (
                      <span className='text-sm text-muted-foreground italic'>No sprint</span>
                    )}
                  </FieldRow>

                  {/* Resolution */}
                  <FieldRow icon={<CheckCircle2 className='h-4 w-4' />} label='Resolution'>
                    <IssueResolutionSelector params={params} />
                  </FieldRow>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Planning Section */}
            <AccordionItem
              value='planning'
              className='border rounded-lg bg-card shadow-sm overflow-hidden'
            >
              <AccordionTrigger className='px-4 py-3 hover:no-underline hover:bg-accent/50 transition-colors'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-semibold'>Planning</span>
                </div>
              </AccordionTrigger>

              <AccordionContent className='px-4 pb-4 pt-2'>
                <div className='space-y-5'>
                  {/* Dates Grid */}
                  <div className='grid grid-cols-2 gap-4'>
                    <FieldRow
                      icon={<Calendar className='h-4 w-4' />}
                      label='Start Date'
                      className='col-span-1'
                    >
                      <IssueStartDateSelector params={params} />
                    </FieldRow>

                    <FieldRow
                      icon={<Calendar className='h-4 w-4' />}
                      label='Due Date'
                      className='col-span-1'
                    >
                      <IssueDueDateSelector params={params} />
                    </FieldRow>
                  </div>

                  {/* Story Points */}
                  <FieldRow
                    icon={<Sparkles className='h-4 w-4' />}
                    label='Story Points'
                    tooltip='Estimate the effort required for this issue using the Fibonacci sequence'
                  >
                    <IssueStoryPointInput params={params} />
                  </FieldRow>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Metadata Footer */}
          <MetadataFooter
            createdAt={issue.createdAt}
            updatedAt={issue.updatedAt}
            reporter={issue.reporter}
          />
        </div>
      </div>
    </aside>
  );
}

IssueSidePanel.displayName = 'IssueSidePanel';
export default IssueSidePanel;
