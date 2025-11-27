'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  User,
  Calendar,
  Zap,
  GitBranch,
  Clock,
  Target,
  Link2,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSuspenseQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getBoardIssueQueryOptions } from '@/features/boards/api/actions';
import { IssueStatusSelector } from '../../selectors';
import { IssueAssigneeSelector } from '../../selectors/issue-assignee-selector';
import { IssueStartDateSelector } from '../../selectors/issue-start-date-selector';
import { IssueDueDateSelector } from '../../selectors/issue-due-date-selector';
import { IssueStoryPointInput } from '../../selectors/issue-story-point-input';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// ============ Types ============

interface IssueSidePanelProps {
  params: { boardId: string; projectId: string; issueId: string };
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

interface ParentIssueBadgeProps {
  onClick?: () => void;
  type?: { id: string; name: string; color?: string; iconURL?: string };
  parent?: {
    id: string;
    key: string;
    summary: string;
    type?: { id: string; name: string; color?: string; iconURL?: string | null; hierarchy: number };
  } | null;
}

const ParentIssueBadge = ({ parent, onClick }: ParentIssueBadgeProps) => {
  if (!parent) {
    return (
      <Button
        variant='outline'
        size='sm'
        className='h-8 text-muted-foreground border-dashed hover:border-solid hover:bg-accent/50'
        onClick={onClick}
      >
        <Link2 className='h-3.5 w-3.5 mr-1.5' />
        Add parent issue
      </Button>
    );
  }

  const { key: parentKey, summary: parentTitle, type } = parent;
  return (
    <Button variant='ghost' size='sm' className='h-auto p-1' onClick={onClick}>
      <Badge variant='outline' className='text-xs font-medium'>
        <Avatar className='size-4'>
          <AvatarImage src={type?.iconURL ?? ''} alt={type?.name || 'Type Icon'} />
          <AvatarFallback>{type?.name.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <span className='text-sm font-medium'>{parentKey}</span>
      </Badge>
      <span className='text-sm text-foreground truncate max-w-[120px]'>{parentTitle}</span>
    </Button>
  );
};

interface SprintBadgeProps {
  sprint?: { id: string; name: string } | null;
  onClick?: () => void;
}

const SprintBadge = ({ sprint, onClick }: SprintBadgeProps) => {
  if (!sprint) {
    return (
      <Button
        variant='outline'
        size='sm'
        className='h-8 text-muted-foreground border-dashed hover:border-solid hover:bg-accent/50'
        onClick={onClick}
      >
        <Zap className='h-3.5 w-3.5 mr-1.5' />
        Add to sprint
      </Button>
    );
  }

  return (
    <Button
      variant='ghost'
      size='sm'
      className='h-auto py-1.5 px-2 justify-start gap-2 hover:bg-accent/50 group'
      onClick={onClick}
    >
      <div className='flex items-center gap-2 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30'>
        <Zap className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
        <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>{sprint.name}</span>
      </div>
      <ChevronRight className='h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto' />
    </Button>
  );
};

interface MetadataFooterProps {
  createdAt: Date | string;
  updatedAt: Date | string;
  reporter?: { name: string };
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
          {/* Header Actions */}
          <div className='flex items-center justify-between gap-3'>
            <div className='group'>
              <IssueStatusSelector params={params} />
            </div>
          </div>

          {/* Details Accordion */}
          <Accordion type='multiple' defaultValue={['details', 'planning']} className='space-y-3'>
            {/* Details Section */}
            <AccordionItem
              value='details'
              className='border rounded-lg bg-card shadow-sm overflow-hidden'
            >
              <AccordionTrigger className='px-4 py-3 hover:no-underline hover:bg-accent/50 transition-colors'>
                <div className='flex items-center gap-2'>
                  <Target className='h-4 w-4 text-muted-foreground' />
                  <span className='text-sm font-semibold'>Details</span>
                </div>
              </AccordionTrigger>

              <AccordionContent className='px-4 pb-4 pt-2'>
                <div className='space-y-5'>
                  {/* Assignee */}
                  <FieldRow icon={<User className='h-4 w-4' />} label='Assignee'>
                    <IssueAssigneeSelector params={params} />
                  </FieldRow>

                  {/* Parent Issue */}
                  <FieldRow icon={<GitBranch className='h-4 w-4' />} label='Parent Issue'>
                    <ParentIssueBadge parent={issue.parent} />
                  </FieldRow>

                  {/* Sprint */}
                  <FieldRow icon={<Zap className='h-4 w-4' />} label='Sprint'>
                    <SprintBadge sprint={issue.sprint} />
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

      {/* Quick Actions Footer */}
      <div className='border-t border-border p-3 bg-muted/30'>
        <div className='flex items-center justify-between gap-2'>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='sm' className='h-8 gap-1.5 text-xs'>
                  <Copy className='h-3.5 w-3.5' />
                  Copy ID
                </Button>
              </TooltipTrigger>
              <TooltipContent side='top'>
                <p>Copy issue ID: {issue.key}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='sm' className='h-8 gap-1.5 text-xs'>
                  <ExternalLink className='h-3.5 w-3.5' />
                  Open in new tab
                </Button>
              </TooltipTrigger>
              <TooltipContent side='top'>
                <p>Open issue in new tab</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}

IssueSidePanel.displayName = 'IssueSidePanel';
export default IssueSidePanel;
