import React, { useMemo } from 'react';
import { Card, CardHeader, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Target,
  Layers,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SprintItem, SprintSummary } from '@/contracts/boards/boards.query';
import { BreakdownCard } from '../components/summary/breakdown-card';
import { cn } from '@/lib/utils';

// ============ Types ============
type SprintSummaryTabProps = { sprint: SprintItem };
type MetricMode = 'counts' | 'points';

// ============ Helper Functions ============
const formatNumber = (n: number) => new Intl.NumberFormat().format(Math.round(n));

const getDaysRemaining = (endDate: string | Date) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getSprintHealthStatus = (progressPct: number, timeElapsedPct: number, scopeCreep: number) => {
  const velocity = progressPct / Math.max(timeElapsedPct, 1);

  if (velocity >= 0.9 && scopeCreep < 10) {
    return { status: 'healthy', label: 'On Track', color: 'text-green-600', bg: 'bg-green-50' };
  } else if (velocity >= 0.7 && scopeCreep < 20) {
    return { status: 'warning', label: 'At Risk', color: 'text-amber-600', bg: 'bg-amber-50' };
  } else {
    return { status: 'critical', label: 'Behind', color: 'text-red-600', bg: 'bg-red-50' };
  }
};

// ============ Sub Components ============

// Loading Skeleton
const SummarySkeleton = () => (
  <div className='flex flex-col gap-6'>
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className='pb-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-8 w-16 mt-2' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-2 w-full' />
            <Skeleton className='h-4 w-24 mt-2' />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className='grid grid-cols-1 md: grid-cols-3 gap-4'>
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className='h-[300px]' />
      ))}
    </div>
  </div>
);

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  warning?: string;
  progress?: number;
  className?: string;
}> = ({ icon, title, value, subtitle, trend, warning, progress, className }) => (
  <Card className={cn('hover:shadow-md transition-all duration-200', className)}>
    <CardHeader className='pb-2'>
      <div className='flex items-center justify-between'>
        <CardDescription className='flex items-center gap-1.5 text-muted-foreground'>
          {icon}
          {title}
        </CardDescription>
        {trend && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant='secondary'
                  className={cn(
                    'text-xs',
                    trend.value >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
                  )}
                >
                  {trend.value >= 0 ? (
                    <TrendingUp className='h-3 w-3 mr-1' />
                  ) : (
                    <TrendingDown className='h-3 w-3 mr-1' />
                  )}
                  {Math.abs(trend.value)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{trend.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className='text-3xl font-bold tracking-tight mt-1'>{value}</div>
    </CardHeader>
    <CardContent className='space-y-2'>
      {progress !== undefined && <Progress value={progress} className='h-2' />}
      {subtitle && <p className='text-sm text-muted-foreground'>{subtitle}</p>}
      {warning && (
        <p className='text-sm text-amber-600 flex items-center gap-1'>
          <AlertTriangle className='h-3.5 w-3.5' />
          {warning}
        </p>
      )}
    </CardContent>
  </Card>
);

// Burndown Mini Chart
const BurndownMiniChart: React.FC<{
  ideal: number[];
  actual: number[];
}> = ({ ideal, actual }) => {
  const maxValue = Math.max(...ideal, ...actual);
  const points = actual.length;

  const idealPath = ideal
    .map((v, i) => `${(i / (points - 1)) * 100},${100 - (v / maxValue) * 100}`)
    .join(' ');

  const actualPath = actual
    .map((v, i) => `${(i / (points - 1)) * 100},${100 - (v / maxValue) * 100}`)
    .join(' ');

  return (
    <div className='h-16 w-full'>
      <svg viewBox='0 0 100 100' className='w-full h-full' preserveAspectRatio='none'>
        {/* Ideal line */}
        <polyline
          fill='none'
          stroke='hsl(var(--muted-foreground))'
          strokeWidth='1'
          strokeDasharray='4 2'
          points={idealPath}
          opacity='0.5'
        />
        {/* Actual line */}
        <polyline
          fill='none'
          stroke='hsl(var(--primary))'
          strokeWidth='2'
          points={actualPath}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  );
};

// Status Distribution Mini Bar
const StatusDistribution: React.FC<{
  done: number;
  inProgress: number;
  todo: number;
}> = ({ done, inProgress, todo }) => {
  const total = done + inProgress + todo;
  if (total === 0) return null;

  const doneWidth = (done / total) * 100;
  const inProgressWidth = (inProgress / total) * 100;
  const todoWidth = (todo / total) * 100;

  return (
    <div className='space-y-2'>
      <div className='flex h-2.5 w-full rounded-full overflow-hidden bg-muted'>
        <div
          className='bg-green-500 transition-all duration-300'
          style={{ width: `${doneWidth}%` }}
        />
        <div
          className='bg-blue-500 transition-all duration-300'
          style={{ width: `${inProgressWidth}%` }}
        />
        <div
          className='bg-gray-300 transition-all duration-300'
          style={{ width: `${todoWidth}%` }}
        />
      </div>
      <div className='flex justify-between text-xs text-muted-foreground'>
        <span className='flex items-center gap-1'>
          <Circle className='h-2 w-2 fill-green-500 text-green-500' />
          Done {done}
        </span>
        <span className='flex items-center gap-1'>
          <Circle className='h-2 w-2 fill-blue-500 text-blue-500' />
          In Progress {inProgress}
        </span>
        <span className='flex items-center gap-1'>
          <Circle className='h-2 w-2 fill-gray-300 text-gray-300' />
          Todo {todo}
        </span>
      </div>
    </div>
  );
};

// ============ Main Component ============
const SprintSummaryTab: React.FC<SprintSummaryTabProps> = ({ sprint }) => {
  const [metricMode, setMetricMode] = React.useState<MetricMode>('points');

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sprintSummary', sprint.id],
    queryFn: async () => {
      const res = await fetch(`/api/v2/sprints/${sprint.id}/summary`);
      if (!res.ok) throw new Error('Failed to fetch sprint summary');
      return res.json() as Promise<SprintSummary>;
    },
  });

  const sMetrics = summary?.metrics;

  // Calculate derived metrics
  const metrics = useMemo(() => {
    if (!sMetrics) return null;

    const totalPoints = sMetrics.points?.total || 0;
    const donePoints = sMetrics.points?.done || 0;
    const totalIssues = sMetrics.counts?.total || 0;
    const doneIssues = sMetrics.counts?.done || 0;

    const progressPoints = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
    const progressIssues = totalIssues > 0 ? Math.round((doneIssues / totalIssues) * 100) : 0;

    const daysRemaining = sprint.endAt ? getDaysRemaining(sprint.endAt) : 0;
    const totalDays =
      sprint.endAt && sprint.startAt
        ? Math.ceil(
            (new Date(sprint.endAt).getTime() - new Date(sprint.startAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;
    const timeElapsedPct = Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100);

    const scopeCreep = sMetrics.scope?.addedAfterStart || 0;
    const scopeCreepPct = totalIssues > 0 ? (scopeCreep / totalIssues) * 100 : 0;

    return {
      totalPoints,
      donePoints,
      totalIssues,
      doneIssues,
      progressPoints,
      progressIssues,
      daysRemaining,
      totalDays,
      timeElapsedPct,
      scopeCreep,
      scopeCreepPct,
      velocity: donePoints / Math.max(1, totalDays - daysRemaining),
      health: getSprintHealthStatus(progressPoints, timeElapsedPct, scopeCreepPct),
    };
  }, [sMetrics, sprint]);

  // Loading state
  if (isLoading) {
    return <SummarySkeleton />;
  }

  // Error state
  if (error || !metrics) {
    return (
      <Card className='p-6'>
        <div className='flex flex-col items-center justify-center text-center py-8'>
          <AlertTriangle className='h-12 w-12 text-amber-500 mb-4' />
          <h3 className='text-lg font-semibold'>Unable to load sprint summary</h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Quick Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Progress Card */}
        <StatCard
          icon={<Target className='h-4 w-4' />}
          title='Progress'
          value={`${metrics.progressPoints}%`}
          subtitle={`${formatNumber(metrics.donePoints)} / ${formatNumber(metrics.totalPoints)} SP completed`}
          progress={metrics.progressPoints}
          trend={
            metrics.progressPoints >= metrics.timeElapsedPct
              ? {
                  value: Math.round(metrics.progressPoints - metrics.timeElapsedPct),
                  label: 'Ahead of schedule',
                }
              : {
                  value: -Math.round(metrics.timeElapsedPct - metrics.progressPoints),
                  label: 'Behind schedule',
                }
          }
        />

        {/* Scope Card */}
        <StatCard
          icon={<Layers className='h-4 w-4' />}
          title='Scope'
          value={`${metrics.doneIssues}/${metrics.totalIssues}`}
          subtitle='Issues completed'
          progress={metrics.progressIssues}
          warning={
            metrics.scopeCreep > 0
              ? `+${metrics.scopeCreep} added after start (${metrics.scopeCreepPct.toFixed(0)}%)`
              : undefined
          }
        />

        {/* Velocity Card */}
        <StatCard
          icon={<TrendingUp className='h-4 w-4' />}
          title='Velocity'
          value={metrics.velocity.toFixed(1)}
          subtitle='Story points per day'
        />

        {/* Time Card */}
        <StatCard
          icon={<Clock className='h-4 w-4' />}
          title='Time'
          value={metrics.daysRemaining > 0 ? `${metrics.daysRemaining}d` : 'Ended'}
          subtitle={`${Math.round(metrics.timeElapsedPct)}% of sprint elapsed`}
          progress={metrics.timeElapsedPct}
        />
      </div>

      {/* Breakdown Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <BreakdownCard
          title='By Type'
          subtitle='Issue type distribution'
          items={summary?.metrics?.breakdowns?.type}
          totalCounts={summary?.metrics?.counts?.total}
          totalPoints={summary?.metrics?.points?.total}
          mode={metricMode}
          showModeToggle={false}
          defaultView='bar'
        />

        <BreakdownCard
          title='By Status'
          subtitle='Current workflow status'
          items={summary?.metrics?.breakdowns?.status}
          totalCounts={summary?.metrics?.counts?.total}
          totalPoints={summary?.metrics?.points?.total}
          mode={metricMode}
          showModeToggle={false}
          defaultView='pie'
        />

        <BreakdownCard
          title='By Priority'
          subtitle='Priority distribution'
          items={summary?.metrics?.breakdowns?.priority}
          totalCounts={summary?.metrics?.counts?.total}
          totalPoints={summary?.metrics?.points?.total}
          mode={metricMode}
          showModeToggle={false}
          defaultView='list'
        />
      </div>
    </div>
  );
};

export default SprintSummaryTab;
