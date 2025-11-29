'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, ListTree, MessageSquare, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import IssueActivity from '../../components/issue-activity';
import EditableText from '../../components/editable-text';
import EditableRichText from '../../components/editable-rich-text';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IssueItem } from '@/contracts/issues/issues.query';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  getBoardIssueQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SubIssues from './sub-issues';

// ============ Types ============

export type Issue = IssueItem & {
  description: string | null;
  summary: string | null;
  storyPoints: number | null;
  originalEstimate: number | null;
};

export type IssueUpdatePayload = Partial<
  Pick<Issue, 'summary' | 'description' | 'storyPoints' | 'originalEstimate'>
>;

interface IssueMainPanelProps {
  params: { workspaceId: string; projectId: string; boardId: string; issueId: string };
  className?: string;
}

// ============ Sub Components ============

interface SectionProps {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  className?: string;
}

const Section = ({
  icon,
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  action,
  className,
}: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <div className='flex items-center justify-between group'>
          <CollapsibleTrigger asChild>
            <button className='flex items-center gap-2 py-2 hover:bg-accent/50 rounded-md px-2 -ml-2 transition-colors'>
              {isOpen ? (
                <ChevronDown className='size-4 text-muted-foreground' />
              ) : (
                <ChevronRight className='size-4 text-muted-foreground' />
              )}
              {icon && <span className='text-muted-foreground'>{icon}</span>}
              <h3 className='font-semibold text-sm text-foreground'>{title}</h3>
            </button>
          </CollapsibleTrigger>
          {action && (
            <div className='opacity-0 group-hover:opacity-100 transition-opacity'>{action}</div>
          )}
        </div>
        <CollapsibleContent className='mt-2 animate-in slide-in-from-top-1 duration-200'>
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className={className}>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          {icon && <span className='text-muted-foreground'>{icon}</span>}
          <h3 className='font-semibold text-sm text-foreground'>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className='space-y-6 p-6 animate-pulse'>
    {/* Issue Key Skeleton */}
    <Skeleton className='h-5 w-20 rounded-full' />

    {/* Summary Skeleton */}
    <Skeleton className='h-9 w-3/4' />

    {/* Description Section Skeleton */}
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-4 rounded' />
        <Skeleton className='h-4 w-24' />
      </div>
      <Skeleton className='h-40 w-full rounded-lg' />
    </div>

    {/* Sub-issues Section Skeleton */}
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-4 rounded' />
        <Skeleton className='h-4 w-20' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-12 w-full rounded-lg' />
        <Skeleton className='h-12 w-full rounded-lg' />
      </div>
    </div>

    {/* Activity Section Skeleton */}
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Skeleton className='size-4 rounded' />
        <Skeleton className='h-4 w-16' />
      </div>
      <Skeleton className='h-32 w-full rounded-lg' />
    </div>
  </div>
);

type EditableSummaryProps = { params: { boardId: string; projectId: string; issueId: string } };
const EditableSummary = ({ params }: EditableSummaryProps) => {
  const { data: summary, isPending } = useQuery({
    ...getBoardIssueQueryOptions(params),
    select: (data) => data.summary,
  });

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const updateSummary = async (value: string) => {
    if (value === summary) return;
    await toast
      .promise(updateIssue.mutateAsync({ summary: value }), {
        loading: 'Updating summary...',
        success: 'Summary updated successfully',
        error: 'Failed to update summary',
      })
      .unwrap();
  };

  if (isPending) return <Skeleton className='h-9 w-3/4' />;
  if (!summary) throw new Error('Summary not found');

  return (
    <EditableText
      value={summary}
      onSave={updateSummary}
      inputClassName={cn(
        'text-2xl font-bold tracking-tight',
        'focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200',
      )}
      className={cn(
        'text-2xl font-bold tracking-tight text-foreground',
        'hover:text-foreground/80 transition-colors',
        'leading-tight',
      )}
      required
      placeholder='Enter issue summary...'
    />
  );
};

// const EditableDe
type EditableDescriptionProps = {
  params: { boardId: string; projectId: string; issueId: string };
};
const EditableDescription = ({ params }: EditableDescriptionProps) => {
  const { data: description, isPending } = useQuery({
    ...getBoardIssueQueryOptions(params),
    select: (data) => data.description,
  });

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const updateDescription = async (value: string) => {
    if (value === description) return;
    await toast
      .promise(updateIssue.mutateAsync({ description: value }), {
        loading: 'Updating description...',
        success: 'Description updated successfully',
        error: 'Failed to update description',
      })
      .unwrap();
  };

  if (isPending) return <Skeleton className='h-40 w-full rounded-lg' />;
  return (
    <EditableRichText
      value={description ?? ''}
      onSave={updateDescription}
      placeholder='Add a description to help others understand this issue...'
      minHeight='150px'
      maxHeight='500px'
      className={cn(
        'border border-border',
        'prose prose-sm dark:prose-invert max-w-none',
        'focus-within:ring-2 focus-within:ring-ring/20 rounded-md',
        'transition-all duration-200',
      )}
    />
  );
};

// ============ Main Component ============

function IssueMainPanel({ className, params }: IssueMainPanelProps) {
  const { data: issue, isPending } = useSuspenseQuery(getBoardIssueQueryOptions(params));

  // log
  console.log(issue);

  if (isPending) return <LoadingSkeleton />;
  if (!issue) throw new Error('Issue not found');

  return (
    <section
      aria-label='Issue details'
      className={cn('flex flex-col gap-2 p-4', 'animate-in fade-in duration-300', className)}
    >
      {/* Summary / Title */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='group h-10'>
          <EditableSummary params={params} />
        </div>
        <Badge variant='outline' className='px-2 py-1 text-xs font-medium'>
          <Avatar className='size-4'>
            <AvatarImage src={issue.type.iconURL ?? ''} alt={issue.type.name} />
            <AvatarFallback>{issue.type.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className='font-mono'>{issue.type.name}</span>
        </Badge>
      </div>
      <Separator />

      {/* Description Section */}
      <Section icon={<FileText className='size-4' />} title='Description'>
        <EditableDescription params={params} />
      </Section>

      <>{issue.type.hierarchy > 0 && <SubIssues params={params} />}</>

      {/* Activity Section */}
      <Section
        icon={<MessageSquare className='size-4' />}
        title='Activity'
        collapsible
        defaultOpen
        className='mt-2'
      >
        <Card className='border-border/50 shadow-sm'>
          <CardContent className='p-4'>
            <IssueActivity issueId={issue.id} />
          </CardContent>
        </Card>
      </Section>
    </section>
  );
}

IssueMainPanel.displayName = 'IssueMainPanel';
export default IssueMainPanel;
