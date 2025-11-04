'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PanelRightIcon,
  BarChart3Icon,
  Loader2Icon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  PlayIcon,
  XCircleIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  TrendingUpIcon,
  TrashIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

type AnalyticsData = {
  id: string;
  sourceId: string;
  runStatus: 'READY' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  source?: { value: string; label: string };
  createdAt?: string;
  completedAt?: string;
  progress?: number;
  insights?: number;
  errors?: string[];
};

type StudioPanelProps = { params: { agentId: string } };

const StatusIcon = ({ runStatus }: { runStatus: AnalyticsData['runStatus'] }) => {
  const iconProps = { size: 16 };

  switch (runStatus) {
    case 'READY':
      return <CheckCircle2Icon {...iconProps} className='text-green-500' />;
    case 'PENDING':
      return <ClockIcon {...iconProps} className='text-yellow-500' />;
    case 'PROCESSING':
      return <PlayIcon {...iconProps} className='text-blue-500 animate-pulse' />;
    case 'COMPLETED':
      return <CheckCircle2Icon {...iconProps} className='text-green-500' />;
    case 'FAILED':
      return <XCircleIcon {...iconProps} className='text-red-500' />;
    default:
      return null;
  }
};

const StatusBadge = ({ runStatus }: { runStatus: AnalyticsData['runStatus'] }) => {
  const variants = {
    READY: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

  const labels = {
    READY: 'Ready',
    PROCESSING: 'In Progress',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
  };

  return (
    <Badge
      variant='secondary'
      className={cn('text-xs px-2 py-0.5 font-medium', variants[runStatus])}
    >
      <StatusIcon runStatus={runStatus} />
      <span className='ml-1'>{labels[runStatus]}</span>
    </Badge>
  );
};

const AnalyticsCard = ({
  item,
  workspaceId,
  agentId,
  onDelete,
  isDeleting,
}: {
  item: AnalyticsData;
  workspaceId: string;
  agentId: string;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) => {
  const reportUrl = `/wps/${workspaceId}/agents/${agentId}/report/${item.id}`;
  const isActionable = item.runStatus === 'COMPLETED';
  const canDelete = item.runStatus !== 'PROCESSING'; // Không cho phép xóa khi đang xử lý

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        item.runStatus === 'FAILED' && 'border-red-200 dark:border-red-800',
        item.runStatus === 'COMPLETED' && 'border-green-200 dark:border-green-800',
        isDeleting && 'opacity-50',
      )}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-sm font-medium truncate'>
              {item.source?.label || `Analysis ${item.id.slice(0, 8)}`}
            </CardTitle>
            <CardDescription className='text-xs mt-1'>
              {item.source?.value || `Source ID: ${item.sourceId}`}
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            <StatusBadge runStatus={item.runStatus} />
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 w-6 p-0 text-muted-foreground hover:text-red-500'
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2Icon size={12} className='animate-spin' />
                    ) : (
                      <TrashIcon size={12} />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this analysis? This action cannot be undone.
                      <br />
                      <br />
                      <strong>Analysis:</strong>{' '}
                      {item.source?.label || `Analysis ${item.id.slice(0, 8)}`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(item.id)}
                      className='bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800'
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        {/* Progress Bar for Processing */}
        {item.runStatus === 'PROCESSING' && (
          <div className='mb-3'>
            <div className='flex justify-between items-center mb-1'>
              <span className='text-xs text-muted-foreground'>Progress</span>
              <span className='text-xs text-muted-foreground'>{item.progress || 0}%</span>
            </div>
            <Progress value={item.progress || 0} className='h-1.5' />
          </div>
        )}

        {/* Insights Count for Completed */}
        {item.runStatus === 'COMPLETED' && item.insights !== undefined && (
          <div className='flex items-center gap-2 mb-3 text-xs text-muted-foreground'>
            <TrendingUpIcon size={12} />
            <span>{item.insights} insights generated</span>
          </div>
        )}

        {/* Error Messages for Failed */}
        {item.runStatus === 'FAILED' && item.errors && item.errors.length > 0 && (
          <div className='mb-3'>
            <div className='flex items-center gap-1 mb-1'>
              <AlertCircleIcon size={12} className='text-red-500' />
              <span className='text-xs text-red-600 dark:text-red-400 font-medium'>Error</span>
            </div>
            <p className='text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded'>
              {item.errors[0]}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className='flex justify-between items-center text-xs text-muted-foreground mb-3'>
          <span>
            Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
          </span>
          {item.completedAt && (
            <span>Completed: {new Date(item.completedAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant={isActionable ? 'default' : 'outline'}
            disabled={!isActionable || isDeleting}
            asChild={isActionable && !isDeleting}
            className='flex-1'
          >
            {isActionable && !isDeleting ? (
              <Link href={reportUrl} className='flex items-center gap-1'>
                <BarChart3Icon size={14} />
                <span>View Report</span>
                <ExternalLinkIcon size={12} />
              </Link>
            ) : (
              <span className='flex items-center gap-1'>
                <BarChart3Icon size={14} />
                <span>View Report</span>
              </span>
            )}
          </Button>

          {item.runStatus === 'FAILED' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size='sm' variant='outline' className='px-2' disabled={isDeleting}>
                    <RefreshCwIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Retry analysis</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const StudioStats = ({ analyticsData }: { analyticsData: AnalyticsData[] }) => {
  const stats = {
    total: analyticsData.length,
    completed: analyticsData.filter((item) => item.runStatus === 'COMPLETED').length,
    processing: analyticsData.filter((item) => item.runStatus === 'PROCESSING').length,
    failed: analyticsData.filter((item) => item.runStatus === 'FAILED').length,
  };

  return (
    <div className='grid grid-cols-2 gap-2 mb-4'>
      <div className='bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3'>
        <div className='text-lg font-semibold text-gray-900 dark:text-gray-100'>{stats.total}</div>
        <div className='text-xs text-muted-foreground'>Total Analyses</div>
      </div>
      <div className='bg-green-50 dark:bg-green-900/20 rounded-lg p-3'>
        <div className='text-lg font-semibold text-green-700 dark:text-green-400'>
          {stats.completed}
        </div>
        <div className='text-xs text-muted-foreground'>Completed</div>
      </div>
      <div className='bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3'>
        <div className='text-lg font-semibold text-blue-700 dark:text-blue-400'>
          {stats.processing}
        </div>
        <div className='text-xs text-muted-foreground'>Processing</div>
      </div>
      <div className='bg-red-50 dark:bg-red-900/20 rounded-lg p-3'>
        <div className='text-lg font-semibold text-red-700 dark:text-red-400'>{stats.failed}</div>
        <div className='text-xs text-muted-foreground'>Failed</div>
      </div>
    </div>
  );
};

export const StudioPanel = ({}: StudioPanelProps) => {
  const params = useParams<{ workspaceId: string; agentId: string }>();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics', 'studio-panel', params.agentId],
    queryFn: async () => {
      const res = await fetch(`/api/v2/agents/${params.agentId}/analysis`);
      if (!res.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const { data } = await res.json();
      return data as AnalyticsData[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Mutation để xóa analysis
  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const res = await fetch(`/api/v2/agents/${params.agentId}/analysis/${analysisId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete analysis');
      }
      return analysisId;
    },
    onMutate: async (analysisId) => {
      // Optimistic update
      setDeletingIds((prev) => new Set(prev).add(analysisId));

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['analytics', 'studio-panel', params.agentId],
      });

      // Snapshot the previous value
      const previousAnalytics = queryClient.getQueryData<AnalyticsData[]>([
        'analytics',
        'studio-panel',
        params.agentId,
      ]);

      // Optimistically remove the item
      if (previousAnalytics) {
        queryClient.setQueryData<AnalyticsData[]>(
          ['analytics', 'studio-panel', params.agentId],
          previousAnalytics.filter((item) => item.id !== analysisId),
        );
      }

      return { previousAnalytics };
    },
    onError: (error, analysisId, context) => {
      // Rollback on error
      if (context?.previousAnalytics) {
        queryClient.setQueryData(
          ['analytics', 'studio-panel', params.agentId],
          context.previousAnalytics,
        );
      }

      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(analysisId);
        return newSet;
      });

      toast.error('Failed to delete analysis');
    },
    onSuccess: (analysisId) => {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(analysisId);
        return newSet;
      });

      toast.success('Analysis deleted successfully');
    },
    onSettled: () => {
      // Always refetch to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: ['analytics', 'studio-panel', params.agentId],
      });
    },
  });

  const handleDelete = (analysisId: string) => {
    deleteAnalysisMutation.mutate(analysisId);
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col',
        'transition-all duration-300 ease-in-out',
        'border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-900',
        isCollapsed ? 'w-12' : 'w-80',
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-3',
          'px-4 py-3',
          'border-b border-gray-200 dark:border-gray-700',
          'bg-gray-50 dark:bg-gray-800/50',
          isCollapsed && 'px-2',
        )}
      >
        {!isCollapsed && (
          <>
            <div className='rounded-md bg-blue-100 dark:bg-blue-900/20 p-1.5'>
              <BarChart3Icon size={16} className='text-blue-600 dark:text-blue-400' />
            </div>
            <h2 className='text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1'>
              Studio Analytics
            </h2>
          </>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='h-8 w-8'
              >
                <PanelRightIcon
                  size={16}
                  className={cn('transition-transform duration-200', isCollapsed && 'rotate-180')}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCollapsed ? 'Expand panel' : 'Collapse panel'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className='flex-1 flex flex-col p-4 overflow-hidden'>
          {/* Refresh Button */}
          <div className='flex justify-between items-center mb-4'>
            <div className='flex items-center gap-2'>
              <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Recent Analyses
              </h3>
              {analyticsData && analyticsData.some((item) => item.runStatus === 'PROCESSING') && (
                <div className='w-2 h-2 bg-blue-500 rounded-full animate-pulse' />
              )}
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => refetch()}
              disabled={isLoading}
              className='h-8 px-2'
            >
              <RefreshCwIcon size={14} className={cn(isLoading && 'animate-spin')} />
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className='flex items-center justify-center py-8'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Loader2Icon size={16} className='animate-spin' />
                Loading analytics...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className='flex flex-col items-center justify-center py-8'>
              <AlertCircleIcon size={24} className='text-red-500 mb-2' />
              <p className='text-sm text-red-600 dark:text-red-400 text-center mb-3'>
                Failed to load analytics data
              </p>
              <Button size='sm' onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!analyticsData || analyticsData.length === 0) && (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <div className='rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-3'>
                <BarChart3Icon size={24} className='text-gray-400' />
              </div>
              <p className='text-sm text-muted-foreground mb-1'>No analyses yet</p>
              <p className='text-xs text-muted-foreground'>
                Add sources to start generating insights
              </p>
            </div>
          )}

          {/* Analytics Data */}
          {analyticsData && analyticsData.length > 0 && (
            <>
              {/* Stats Overview */}
              <StudioStats analyticsData={analyticsData} />

              {/* Analytics Cards */}
              <div className='flex-1 overflow-y-auto'>
                <div className='space-y-3'>
                  {analyticsData.map((item) => (
                    <AnalyticsCard
                      key={item.id}
                      item={item}
                      workspaceId={params.workspaceId}
                      agentId={params.agentId}
                      onDelete={handleDelete}
                      isDeleting={deletingIds.has(item.id)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
