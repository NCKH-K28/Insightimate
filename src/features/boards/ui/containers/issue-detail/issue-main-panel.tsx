'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import IssueActivity from '../../components/issue-activity';
import EditableText from '../../components/editable-text';
import EditableRichText from '../../components/editable-rich-text';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IssueItem } from '@/contracts/issues/issues.query';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  getBoardIssueQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { toast } from 'sonner';
import SubIssues from './sub-issues';

export type Issue = IssueItem & {
  description: string | null;
  summary: string | null;
  storyPoints: number | null;
  originalEstimate: number | null;
};

interface IssueMainPanelProps {
  params: { workspaceId: string; projectId: string; boardId: string; issueId: string };
  className?: string;
}

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
            <button className='flex items-center gap-2 py-2 px-2 -ml-2 rounded-md hover:bg-accent/50'>
              {isOpen ? (
                <ChevronDown className='size-4 text-muted-foreground' />
              ) : (
                <ChevronRight className='size-4 text-muted-foreground' />
              )}
              {icon}
              <h3 className='font-semibold text-sm'>{title}</h3>
            </button>
          </CollapsibleTrigger>
          {action && <div className='opacity-0 group-hover:opacity-100'>{action}</div>}
        </div>
        <CollapsibleContent className='mt-2'>{children}</CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className={className}>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          {icon}
          <h3 className='font-semibold text-sm'>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className='space-y-6 p-6'>
    <Skeleton className='h-5 w-20 rounded-full' />
    <Skeleton className='h-9 w-3/4' />
    <div className='space-y-3'>
      <Skeleton className='h-4 w-24' />
      <Skeleton className='h-40 w-full rounded-lg' />
    </div>
    <div className='space-y-3'>
      <Skeleton className='h-4 w-20' />
      <Skeleton className='h-12 w-full rounded-lg' />
      <Skeleton className='h-12 w-full rounded-lg' />
    </div>
    <div className='space-y-3'>
      <Skeleton className='h-4 w-16' />
      <Skeleton className='h-32 w-full rounded-lg' />
    </div>
  </div>
);

type EditableParams = { params: { boardId: string; projectId: string; issueId: string } };

export const EditableSummary = ({ params }: EditableParams) => {
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
        success: 'Summary updated',
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
      inputClassName='text-2xl font-bold tracking-tight'
      className='text-2xl font-bold tracking-tight hover:text-foreground/80'
      required
      placeholder='Enter issue summary...'
    />
  );
};

const EditableDescription = ({ params }: EditableParams) => {
  const { data: description, isPending } = useQuery({
    ...getBoardIssueQueryOptions(params),
    select: (data) => data.description,
  });
  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const updateDescription = async (value: string) => {
    if (value === description) return;
    await toast
      .promise(updateIssue.mutateAsync({ description: value }), {
        loading: 'Updating description.. .',
        success: 'Description updated',
        error: 'Failed to update description',
      })
      .unwrap();
  };

  if (isPending) return <Skeleton className='h-40 w-full rounded-lg' />;

  return (
    <EditableRichText
      value={description ?? ''}
      onSave={updateDescription}
      maxHeight='400px'
      placeholder='Add a description.. .'
      className='border border-border rounded-md prose prose-sm dark:prose-invert max-w-none'
    />
  );
};

function IssueMainPanel({ className, params }: IssueMainPanelProps) {
  const { data: issue, isPending } = useSuspenseQuery(getBoardIssueQueryOptions(params));

  if (isPending) return <LoadingSkeleton />;
  if (!issue) throw new Error('Issue not found');

  return (
    <section className={cn('flex flex-col gap-2 p-4', className)}>
      <Section icon={<FileText className='size-4 text-muted-foreground' />} title='Description'>
        <EditableDescription params={params} />
      </Section>

      {issue.type.hierarchy > 0 && <SubIssues params={params} />}

      <IssueActivity issueId={issue.id} />
    </section>
  );
}

export default IssueMainPanel;
