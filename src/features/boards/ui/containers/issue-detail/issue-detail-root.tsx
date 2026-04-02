'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import IssueDetailHeader from './issue-detail-header';
import IssueMainPanel from './issue-main-panel';
import IssueSidePanel from './issue-side-panel';

// ============ Types ============

interface IssueDetailRootProps {
  params: {
    orgSlug: string;
    projId: string;
    issueId: string;
  };
}

// ============ Component ============

export default function IssueDetailRoot({ params }: IssueDetailRootProps) {
  // Fetch project to get boardId and orgId
  const { data: project, isPending: isProjectPending } = useQuery(
    getProjectQueryOptions({ projId: params.projId }),
  );

  const boardId = (project as any)?.boardId as string | undefined;
  const orgId = (project as any)?.orgId as string | undefined;

  if (isProjectPending) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-muted-foreground'>Loading project...</p>
      </div>
    );
  }

  if (!boardId) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p className='text-destructive'>Board not found for this project</p>
      </div>
    );
  }

  const issueParams = {
    orgSlug: params.orgSlug,
    projectId: params.projId,
    boardId,
    issueId: params.issueId,
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <IssueDetailHeader params={issueParams} />

      {/* Content: Main + Sidebar */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Main content — scrollable */}
        <main className='flex-1 overflow-y-auto'>
          <IssueMainPanel
            params={{ ...issueParams, projectId: params.projId }}
            orgId={orgId}
            className='max-w-4xl mx-auto'
          />
        </main>

        {/* Sidebar — fixed right */}
        <IssueSidePanel
          params={issueParams}
          className={cn(
            'hidden lg:flex',
            'w-80 xl:w-96 shrink-0',
          )}
        />
      </div>
    </div>
  );
}
