'use client';

import { useMemo, Suspense, useEffect } from 'react';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  MoreHorizontal,
  Share2,
  Star,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { getBoardIssueQueryOptions } from '@/features/boards/api/actions';
import { viewItem } from '@/features/foryou/api/actions';

import { cn } from '@/lib/utils';
import IssueMainPanel, {
  EditableSummary,
} from '@/features/boards/ui/containers/issue-detail/issue-main-panel';
import IssueSidePanel from '@/features/boards/ui/containers/issue-detail/issue-side-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useState } from 'react';

// ============ Loading Skeleton ============

const MainPanelSkeleton = () => (
  <div className='p-6 space-y-6 animate-pulse'>
    {/* Header skeleton */}
    <div className='flex items-center gap-3'>
      <Skeleton className='h-6 w-20 rounded-full' />
      <Skeleton className='h-4 w-4 rounded' />
    </div>

    {/* Title skeleton */}
    <Skeleton className='h-9 w-4/5' />

    {/* Separator */}
    <Skeleton className='h-px w-full' />

    {/* Description section */}
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-4 w-4 rounded' />
        <Skeleton className='h-4 w-24' />
      </div>
      <Skeleton className='h-48 w-full rounded-xl' />
    </div>

    {/* Sub-issues section */}
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-4 w-4 rounded' />
        <Skeleton className='h-4 w-20' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-14 w-full rounded-lg' />
        <Skeleton className='h-14 w-full rounded-lg' />
      </div>
    </div>

    {/* Activity section */}
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-4 w-4 rounded' />
        <Skeleton className='h-4 w-16' />
      </div>
      <Skeleton className='h-36 w-full rounded-xl' />
    </div>
  </div>
);

const SidePanelSkeleton = () => (
  <div className='p-6 space-y-6 animate-pulse'>
    {/* Status section */}
    <div className='space-y-3'>
      <Skeleton className='h-4 w-16' />
      <Skeleton className='h-10 w-full rounded-lg' />
    </div>

    {/* Details section */}
    <div className='space-y-4'>
      <Skeleton className='h-4 w-14' />

      {[...Array(5)].map((_, i) => (
        <div key={i} className='flex items-center justify-between'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-6 w-28 rounded-md' />
        </div>
      ))}
    </div>

    {/* Dates section */}
    <div className='space-y-3 pt-4'>
      <Skeleton className='h-px w-full' />
      <div className='flex items-center justify-between'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-3 w-24' />
      </div>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-3 w-24' />
      </div>
    </div>
  </div>
);

const PageSkeleton = () => (
  <div className='flex flex-col h-full w-full bg-background'>
    {/* Header skeleton */}
    <div className='flex items-center justify-between px-6 py-3 border-b border-border'>
      <div className='flex items-center gap-4'>
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-4 w-48' />
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>
    </div>

    {/* Content skeleton */}
    <div className='flex flex-1 overflow-hidden'>
      <div className='flex-1 overflow-auto border-r border-border'>
        <MainPanelSkeleton />
      </div>
      <div className='w-80 overflow-auto bg-muted/30'>
        <SidePanelSkeleton />
      </div>
    </div>
  </div>
);

// ============ Header Component ============

interface IssueHeaderProps {
  isStarred?: boolean;
  onToggleStar?: () => void;
  isSidePanelCollapsed?: boolean;
  onToggleSidePanel?: () => void;
  params: { boardId: string; projectId: string; issueId: string };
}

const IssueHeader = ({
  params,
  isStarred = false,
  onToggleStar,
  isSidePanelCollapsed = false,
  onToggleSidePanel,
}: IssueHeaderProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className='flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10'>
      <div className='flex items-center gap-3'>
        <EditableSummary params={params} />
      </div>

      {/* Actions */}
      <div className='flex items-center gap-1'>
        <TooltipProvider delayDuration={300}>
          {/* Star/Favorite */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onToggleStar}>
                <Star
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isStarred && 'fill-yellow-400 text-yellow-400',
                  )}
                />
                <span className='sr-only'>
                  {isStarred ? 'Remove from favorites' : 'Add to favorites'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom'>
              <p>{isStarred ? 'Remove from favorites' : 'Add to favorites'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Copy link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleCopyLink}>
                {copied ? (
                  <Check className='h-4 w-4 text-green-500' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
                <span className='sr-only'>Copy link</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom'>
              <p>{copied ? 'Copied!' : 'Copy link'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Toggle side panel */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onToggleSidePanel}>
                {isSidePanelCollapsed ? (
                  <Maximize2 className='h-4 w-4' />
                ) : (
                  <Minimize2 className='h-4 w-4' />
                )}
                <span className='sr-only'>
                  {isSidePanelCollapsed ? 'Show details' : 'Hide details'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom'>
              <p>{isSidePanelCollapsed ? 'Show details' : 'Hide details'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* More actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='h-8 w-8'>
              <MoreHorizontal className='h-4 w-4' />
              <span className='sr-only'>More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className='h-4 w-4 mr-2' />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink className='h-4 w-4 mr-2' />
              Open in new tab
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className='h-4 w-4 mr-2' />
              Share issue
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className='text-destructive focus:text-destructive'>
              Delete issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

// ============ Issue Content Component ============

interface IssueContentProps {
  workspaceId: string;
  projectId: string;
  boardId: string;
  issueId: string;
}

const IssueContent = ({ workspaceId, projectId, boardId, issueId }: IssueContentProps) => {
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const issueCtx = useMemo(() => ({ boardId, issueId }), [boardId, issueId]);
  const { data: issue, isPending, isError, error } = useQuery(getBoardIssueQueryOptions(issueCtx));

  useEffect(() => {
    if (!issue?.id) return;
    viewItem(workspaceId, { type: 'ISSUE', entityId: issue.id, context: { boardId } }).catch(
      () => {},
    );
  }, [issue?.id]);

  if (isPending) return <PageSkeleton />;

  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4 p-8'>
        <div className='text-center space-y-2'>
          <h2 className='text-xl font-semibold text-foreground'>Unable to load issue</h2>
          <p className='text-muted-foreground max-w-md'>
            {error?.message || 'Something went wrong while loading this issue. Please try again.'}
          </p>
        </div>
        <Button variant='outline' onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className='flex flex-col items-center justify-center h-full gap-4 p-8'>
        <div className='text-center space-y-2'>
          <h2 className='text-xl font-semibold text-foreground'>Issue not found</h2>
          <p className='text-muted-foreground max-w-md'>
            This issue may have been deleted or you don&apos;t have permission to view it.
          </p>
        </div>
        <Button variant='outline' onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full w-full bg-background'>
      {/* Header */}
      <IssueHeader
        params={{ boardId, projectId, issueId }}
        isStarred={isStarred}
        onToggleStar={() => setIsStarred(!isStarred)}
        isSidePanelCollapsed={isSidePanelCollapsed}
        onToggleSidePanel={() => setIsSidePanelCollapsed(!isSidePanelCollapsed)}
      />

      {/* Content with resizable panels */}
      <div className='flex-1 overflow-hidden'>
        <ResizablePanelGroup direction='horizontal' className='h-full'>
          {/* Main Panel */}
          <ResizablePanel defaultSize={65} minSize={40} className='overflow-hidden'>
            <div className='h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'>
              <IssueMainPanel
                params={{ boardId, projectId, issueId, workspaceId }}
                className='animate-in fade-in slide-in-from-left-2 duration-300'
              />
            </div>
          </ResizablePanel>

          {/* Resizable Handle */}
          {!isSidePanelCollapsed && (
            <>
              <ResizableHandle
                withHandle
                className='bg-border/50 hover:bg-primary/20 transition-colors data-[resize-handle-active]:bg-primary/30'
              />

              {/* Side Panel */}
              <ResizablePanel
                defaultSize={35}
                minSize={25}
                maxSize={50}
                collapsible
                collapsedSize={0}
                className='overflow-hidden'
              >
                <div className='h-full overflow-y-auto bg-muted/30 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent'>
                  <IssueSidePanel
                    params={{ boardId, projectId, issueId }}
                    className='animate-in fade-in slide-in-from-right-2 duration-300'
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

// ============ Main Page Component ============

export default function IssuePage() {
  const params = useParams<{ workspaceId: string; projectId: string; issueId: string }>();
  if (!params) throw new Error('Params are undefined');
  if (!params?.workspaceId || !params?.projectId || !params?.issueId) {
    console.error('Missing required parameters:', params);
    throw new Error('Missing required parameters');
  }

  return (
    <Suspense fallback={<PageSkeleton />}>
      <IssuePageContent params={params} />
    </Suspense>
  );
}

// Separate component to use suspense query
type IssuePageContentProps = {
  params: { workspaceId: string; projectId: string; issueId: string };
};
function IssuePageContent({ params }: IssuePageContentProps) {
  const { data: project } = useSuspenseQuery(getProjectQueryOptions(params));

  if (!project.boardId) throw new Error('Project does not have an associated board');

  return (
    <IssueContent
      workspaceId={params.workspaceId}
      projectId={params.projectId}
      boardId={project.boardId}
      issueId={params.issueId}
    />
  );
}

IssuePage.displayName = 'IssuePage';
