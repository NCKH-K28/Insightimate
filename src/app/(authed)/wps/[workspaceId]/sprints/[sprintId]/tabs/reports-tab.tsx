import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart as LineChartIcon,
  BarChart3,
  CalendarDays,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Activity,
  Bug,
  Download,
  Info,
  CheckCircle,
  XCircle,
  FileText,
  Target,
  Layers,
  Clock,
  Zap,
  Lightbulb,
  ExternalLink,
  MinusCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

// ============ Types ============

export type SprintStatus = 'upcoming' | 'active' | 'completed';

export type SprintGoalOutcome = 'achieved' | 'partiallyAchieved' | 'notAchieved';

export type UnitMode = 'storyPoints' | 'issueCount';
export type GranularityMode = 'daily' | 'weekday';

export interface BurndownPoint {
  date: string;
  dayLabel: string;
  remainingPoints: number;
  idealRemainingPoints?: number;
  isToday?: boolean;
}

export interface ScopeChangeEvent {
  id: string;
  date: string;
  type: 'added' | 'removed';
  issueKey: string;
  issueTitle: string;
  storyPointsDelta?: number;
  reason?: string;
}

export interface BurnupPoint {
  date: string;
  dayLabel: string;
  completedPoints: number;
  totalScopePoints: number;
}

export interface ThroughputPoint {
  date: string;
  dayLabel: string;
  completed: number;
}

export interface CycleTimeBucket {
  bucketLabel: string;
  count: number;
}

export interface BugTrendPoint {
  date: string;
  dayLabel: string;
  created: number;
  resolved: number;
}

export type IssueStatus = 'open' | 'inProgress' | 'resolved' | 'closed';
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BugSummaryItem {
  id: string;
  key: string;
  title: string;
  severity: BugSeverity;
  daysOpen: number;
  status: IssueStatus;
}

export interface CarryoverIssue {
  id: string;
  key: string;
  title: string;
  statusAtEnd: 'todo' | 'inProgress' | 'inReview' | 'done';
  storyPoints?: number;
  reasonCategory?: 'underestimated' | 'blocked' | 'deprioritized' | 'other';
}

export interface SprintBurndownMetrics {
  burndownPoints: BurndownPoint[];
  status?: 'onTrack' | 'behind' | 'ahead';
  remainingAtEnd?: number;
  daysWithoutProgress?: number;
  completionPercentage?: number;
  keyTakeaways?: string[];
  quickSummary?: string;
}

export interface SprintScopeMetrics {
  initialScopePoints: number;
  finalScopePoints: number;
  pointsAdded: number;
  pointsRemoved: number;
  burnupPoints: BurnupPoint[];
  scopeChangeEvents: ScopeChangeEvent[];
}

export interface SprintFlowMetrics {
  throughput: ThroughputPoint[];
  averageCycleTimeDays?: number;
  medianCycleTimeDays?: number;
  p85CycleTimeDays?: number;
  cycleTimeBuckets: CycleTimeBucket[];
}

export interface SprintQualityMetrics {
  bugTrend: BugTrendPoint[];
  bugSummary: BugSummaryItem[];
  totalBugsCreated: number;
  totalBugsResolved: number;
  netBugChange: number;
  bugWorkRatio?: number;
}

export interface SprintOutcomeSummary {
  goalOutcome: SprintGoalOutcome;
  goalDescription?: string;
  narrativeSummary?: string;
  keyLearnings?: string[];
  actionItems?: string[];
  carryoverIssues: CarryoverIssue[];
  carryoverPoints?: number;
  carryoverIssueCount?: number;
}

export interface SprintComparisonSummary {
  currentVelocityPoints?: number;
  previousVelocityPoints?: number;
  velocityDeltaPoints?: number;
  velocityTrend?: 'up' | 'down' | 'flat';
  comparisonSprintName?: string;
  availableSprints?: string[];
}

export interface SprintReportsTabProps {
  sprintName: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;

  unitMode?: UnitMode;
  granularityMode?: GranularityMode;

  comparison?: SprintComparisonSummary;

  burndown: SprintBurndownMetrics;
  flow: SprintFlowMetrics;
  scope: SprintScopeMetrics;
  quality: SprintQualityMetrics;
  outcome: SprintOutcomeSummary;

  onUnitModeChange?: (mode: UnitMode) => void;
  onGranularityModeChange?: (mode: GranularityMode) => void;
  onComparisonSprintChange?: (sprintName: string) => void;

  onOpenFlowDetails?: () => void;
  onOpenBugsDetails?: () => void;

  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

// ============ Constants ============

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  tertiary: '#8b5cf6',
  danger: '#ef4444',
  warning: '#f59e0b',
  muted: '#94a3b8',
  ideal: '#94a3b8',
  actual: '#3b82f6',
  scope: '#8b5cf6',
  completed: '#10b981',
  created: '#ef4444',
  resolved: '#10b981',
};

// ============ Helper Functions ============

const formatDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate));
};

const formatShortDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
  }).format(new Date(isoDate));
};

// ============ Sub-Components ============

const SprintStatusBadge: React.FC<{ status: SprintStatus }> = ({ status }) => {
  const config: Record<SprintStatus, { label: string; className: string }> = {
    upcoming: { label: 'Upcoming', className: 'border-blue-500 text-blue-600 bg-blue-50' },
    active: { label: 'Active', className: 'bg-green-500 text-white' },
    completed: { label: 'Completed', className: 'bg-gray-500 text-white' },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
};

const BurndownStatusBadge: React.FC<{ status?: 'onTrack' | 'behind' | 'ahead' }> = ({ status }) => {
  if (!status) return null;
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    onTrack: {
      label: 'On Track',
      className: 'bg-blue-100 text-blue-700',
      icon: <Activity className='h-3 w-3' />,
    },
    behind: {
      label: 'Behind',
      className: 'bg-red-100 text-red-700',
      icon: <TrendingUp className='h-3 w-3' />,
    },
    ahead: {
      label: 'Ahead',
      className: 'bg-green-100 text-green-700',
      icon: <TrendingDown className='h-3 w-3' />,
    },
  };
  const { label, className, icon } = config[status];
  return (
    <Badge className={`flex items-center gap-1 ${className}`}>
      {icon}
      {label}
    </Badge>
  );
};

const GoalOutcomeBadge: React.FC<{ outcome: SprintGoalOutcome }> = ({ outcome }) => {
  const config: Record<
    SprintGoalOutcome,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    achieved: {
      label: 'Goal Achieved',
      className: 'bg-green-100 text-green-700',
      icon: <CheckCircle className='h-4 w-4' />,
    },
    partiallyAchieved: {
      label: 'Partially Achieved',
      className: 'bg-yellow-100 text-yellow-700',
      icon: <MinusCircle className='h-4 w-4' />,
    },
    notAchieved: {
      label: 'Not Achieved',
      className: 'bg-red-100 text-red-700',
      icon: <XCircle className='h-4 w-4' />,
    },
  };
  const { label, className, icon } = config[outcome];
  return (
    <Badge className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${className}`}>
      {icon}
      {label}
    </Badge>
  );
};

const SeverityBadge: React.FC<{ severity: BugSeverity }> = ({ severity }) => {
  const config: Record<BugSeverity, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
    high: { label: 'High', className: 'bg-orange-100 text-orange-700' },
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700' },
  };
  const { label, className } = config[severity];
  return (
    <Badge variant='outline' className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
};

const ReasonBadge: React.FC<{
  reason?: 'underestimated' | 'blocked' | 'deprioritized' | 'other';
}> = ({ reason }) => {
  if (!reason) return null;
  const config: Record<string, { label: string; className: string }> = {
    underestimated: { label: 'Underestimated', className: 'bg-purple-100 text-purple-700' },
    blocked: { label: 'Blocked', className: 'bg-red-100 text-red-700' },
    deprioritized: { label: 'Deprioritized', className: 'bg-gray-100 text-gray-600' },
    other: { label: 'Other', className: 'bg-gray-100 text-gray-600' },
  };
  const { label, className } = config[reason];
  return (
    <Badge variant='outline' className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, value, subValue, icon, className = '' }) => (
  <div className={`flex items-start gap-2 p-3 bg-muted/30 rounded-lg ${className}`}>
    {icon && <div className='text-muted-foreground mt-0.5'>{icon}</div>}
    <div>
      <p className='text-xs text-muted-foreground uppercase tracking-wide'>{label}</p>
      <p className='text-lg font-bold'>{value}</p>
      {subValue && <p className='text-xs text-muted-foreground'>{subValue}</p>}
    </div>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; description?: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className='flex items-center gap-2'>
    <div className='text-primary'>{icon}</div>
    <div>
      <h3 className='font-semibold'>{title}</h3>
      {description && <p className='text-xs text-muted-foreground'>{description}</p>}
    </div>
  </div>
);

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className='bg-white border rounded-lg shadow-lg p-3'>
      <p className='font-medium text-sm mb-2'>{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className='flex items-center gap-2 text-sm'>
          <div className='w-3 h-3 rounded-full' style={{ backgroundColor: entry.color }} />
          <span className='text-muted-foreground'>{entry.name}:</span>
          <span className='font-medium'>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ============ Main Component ============

const SprintReportsTab: React.FC<SprintReportsTabProps> = ({
  sprintName,
  startDate,
  endDate,
  status,
  unitMode = 'storyPoints',
  granularityMode = 'daily',
  comparison,
  burndown,
  flow,
  scope,
  quality,
  outcome,
  onUnitModeChange,
  onGranularityModeChange,
  onComparisonSprintChange,
  onOpenFlowDetails,
  onOpenBugsDetails,
  onExportCsv,
  onExportPdf,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<UnitMode>(unitMode);
  const [selectedGranularity, setSelectedGranularity] = useState<GranularityMode>(granularityMode);

  const handleUnitChange = (mode: UnitMode) => {
    setSelectedUnit(mode);
    onUnitModeChange?.(mode);
  };

  const handleGranularityChange = (mode: GranularityMode) => {
    setSelectedGranularity(mode);
    onGranularityModeChange?.(mode);
  };

  const todayIndex = burndown.burndownPoints.findIndex((p) => p.isToday);

  const totalThroughput = flow.throughput.reduce((sum, t) => sum + t.completed, 0);
  const avgThroughput =
    flow.throughput.length > 0 ? (totalThroughput / flow.throughput.length).toFixed(1) : '0';
  const peakDay = flow.throughput.reduce(
    (max, t) => (t.completed > max.completed ? t : max),
    flow.throughput[0] || { dayLabel: '-', completed: 0 },
  );

  const finalBurnup = scope.burnupPoints[scope.burnupPoints.length - 1];
  const burnupCompletionPct =
    finalBurnup && finalBurnup.totalScopePoints > 0
      ? Math.round((finalBurnup.completedPoints / finalBurnup.totalScopePoints) * 100)
      : 0;

  return (
    <div className='space-y-6'>
      {/* ============ Header & Controls ============ */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-3 flex-wrap'>
                <CardTitle className='text-xl font-bold'>{sprintName}</CardTitle>
                <SprintStatusBadge status={status} />
              </div>
              <div className='flex items-center gap-4 text-sm text-muted-foreground flex-wrap'>
                <div className='flex items-center gap-1.5'>
                  <CalendarDays className='h-4 w-4' />
                  <span>
                    {formatDate(startDate)} – {formatDate(endDate)}
                  </span>
                </div>
                {comparison && comparison.currentVelocityPoints !== undefined && (
                  <>
                    <Separator orientation='vertical' className='h-4' />
                    <div className='flex items-center gap-1.5'>
                      <Zap className='h-4 w-4' />
                      <span>
                        Velocity: {comparison.currentVelocityPoints} SP
                        {comparison.previousVelocityPoints !== undefined && (
                          <span className='text-muted-foreground'>
                            {' '}
                            (prev: {comparison.previousVelocityPoints} SP,{' '}
                            <span
                              className={
                                comparison.velocityTrend === 'up'
                                  ? 'text-green-600'
                                  : comparison.velocityTrend === 'down'
                                    ? 'text-red-600'
                                    : ''
                              }
                            >
                              {comparison.velocityDeltaPoints !== undefined &&
                                comparison.velocityDeltaPoints >= 0 &&
                                '+'}
                              {comparison.velocityDeltaPoints}
                            </span>
                            )
                          </span>
                        )}
                      </span>
                      {comparison.velocityTrend === 'up' && (
                        <TrendingUp className='h-4 w-4 text-green-500' />
                      )}
                      {comparison.velocityTrend === 'down' && (
                        <TrendingDown className='h-4 w-4 text-red-500' />
                      )}
                      {comparison.velocityTrend === 'flat' && (
                        <Activity className='h-4 w-4 text-gray-500' />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {onExportCsv && (
                <Button variant='outline' size='sm' onClick={onExportCsv}>
                  <Download className='h-4 w-4 mr-1' />
                  CSV
                </Button>
              )}
              {onExportPdf && (
                <Button variant='outline' size='sm' onClick={onExportPdf}>
                  <FileText className='h-4 w-4 mr-1' />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <Separator className='mb-4' />
          <div className='flex flex-wrap items-center gap-3'>
            {comparison?.availableSprints && comparison.availableSprints.length > 0 && (
              <Select
                value={comparison.comparisonSprintName}
                onValueChange={(value) => onComparisonSprintChange?.(value)}
              >
                <SelectTrigger className='w-[180px] h-9'>
                  <SelectValue placeholder='Compare with...' />
                </SelectTrigger>
                <SelectContent>
                  {comparison.availableSprints.map((sprint) => (
                    <SelectItem key={sprint} value={sprint}>
                      {sprint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Separator orientation='vertical' className='h-6' />
            <div className='flex items-center gap-1 bg-muted rounded-md p-1'>
              <Button
                variant={selectedUnit === 'storyPoints' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => handleUnitChange('storyPoints')}
                className='text-xs h-7'
              >
                Story Points
              </Button>
              <Button
                variant={selectedUnit === 'issueCount' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => handleUnitChange('issueCount')}
                className='text-xs h-7'
              >
                Issues
              </Button>
            </div>
            <div className='flex items-center gap-1 bg-muted rounded-md p-1'>
              <Button
                variant={selectedGranularity === 'daily' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => handleGranularityChange('daily')}
                className='text-xs h-7'
              >
                Daily
              </Button>
              <Button
                variant={selectedGranularity === 'weekday' ? 'secondary' : 'ghost'}
                size='sm'
                onClick={() => handleGranularityChange('weekday')}
                className='text-xs h-7'
              >
                Weekday
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============ Internal Tabs ============ */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-5 lg:w-auto lg:inline-flex'>
          <TabsTrigger value='overview' className='text-xs sm:text-sm'>
            Overview
          </TabsTrigger>
          <TabsTrigger value='delivery' className='text-xs sm:text-sm'>
            Delivery & Flow
          </TabsTrigger>
          <TabsTrigger value='scope' className='text-xs sm:text-sm'>
            Scope & Progress
          </TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW TAB ============ */}
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            {/* Burndown Chart Card */}
            <Card className='lg:col-span-2'>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <SectionHeader
                    icon={<LineChartIcon className='h-5 w-5' />}
                    title='Burndown'
                    description='Remaining work over time'
                  />
                  <BurndownStatusBadge status={burndown.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={burndown.burndownPoints}>
                      <CartesianGrid strokeDasharray='3 3' className='opacity-50' />
                      <XAxis dataKey='dayLabel' tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      {todayIndex >= 0 && (
                        <ReferenceLine
                          x={burndown.burndownPoints[todayIndex]?.dayLabel}
                          stroke={CHART_COLORS.warning}
                          strokeDasharray='5 5'
                          label={{
                            value: 'Today',
                            position: 'top',
                            fill: CHART_COLORS.warning,
                            fontSize: 11,
                          }}
                        />
                      )}
                      <Line
                        type='monotone'
                        dataKey='idealRemainingPoints'
                        name='Ideal'
                        stroke={CHART_COLORS.ideal}
                        strokeDasharray='5 5'
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type='monotone'
                        dataKey='remainingPoints'
                        name='Actual'
                        stroke={CHART_COLORS.actual}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Separator className='my-4' />
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <MetricCard
                    label='Completion'
                    value={`${burndown.completionPercentage ?? 0}%`}
                    icon={<Target className='h-4 w-4' />}
                  />
                  <MetricCard
                    label='Remaining'
                    value={burndown.remainingAtEnd ?? 0}
                    subValue='points'
                  />
                  <MetricCard
                    label='No Progress Days'
                    value={burndown.daysWithoutProgress ?? 0}
                    icon={<AlertTriangle className='h-4 w-4' />}
                  />
                  <MetricCard
                    label='Status'
                    value={
                      burndown.status === 'onTrack'
                        ? 'On Track'
                        : burndown.status === 'behind'
                          ? 'Behind'
                          : 'Ahead'
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Key Takeaways Card */}
            <Card>
              <CardHeader className='pb-2'>
                <SectionHeader
                  icon={<Lightbulb className='h-5 w-5' />}
                  title='Key Takeaways'
                  description='Quick insights'
                />
              </CardHeader>
              <CardContent>
                {burndown.quickSummary && (
                  <div className='p-3 bg-blue-50 rounded-lg mb-4'>
                    <p className='text-sm text-blue-800'>{burndown.quickSummary}</p>
                  </div>
                )}
                {burndown.keyTakeaways && burndown.keyTakeaways.length > 0 ? (
                  <ul className='space-y-2'>
                    {burndown.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className='flex items-start gap-2 text-sm'>
                        <Info className='h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0' />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-muted-foreground italic'>No takeaways recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ DELIVERY & FLOW TAB ============ */}
        <TabsContent value='delivery' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* Throughput Card */}
            <Card>
              <CardHeader className='pb-2'>
                <SectionHeader
                  icon={<BarChart3 className='h-5 w-5' />}
                  title='Throughput'
                  description='Work completed per day'
                />
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-3 gap-2 mb-4'>
                  <MetricCard label='Total Done' value={totalThroughput} className='p-2' />
                  <MetricCard label='Avg/Day' value={avgThroughput} className='p-2' />
                  <MetricCard
                    label='Peak'
                    value={peakDay.completed}
                    subValue={peakDay.dayLabel}
                    className='p-2'
                  />
                </div>
                <div className='h-48'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={flow.throughput}>
                      <CartesianGrid strokeDasharray='3 3' className='opacity-50' />
                      <XAxis dataKey='dayLabel' tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                      <RechartsTooltip />
                      <Bar dataKey='completed' name='Completed' fill={CHART_COLORS.secondary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Cycle Time Card */}
            <Card>
              <CardHeader className='pb-2'>
                <div className='flex items-center justify-between'>
                  <SectionHeader
                    icon={<Clock className='h-5 w-5' />}
                    title='Cycle Time'
                    description='Time from start to done'
                  />
                  {onOpenFlowDetails && (
                    <Button variant='ghost' size='sm' onClick={onOpenFlowDetails}>
                      <ExternalLink className='h-4 w-4 mr-1' />
                      Details
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-3 gap-2 mb-4'>
                  <MetricCard
                    label='Average'
                    value={flow.averageCycleTimeDays?.toFixed(1) ?? '-'}
                    subValue='days'
                    className='p-2'
                  />
                  <MetricCard
                    label='Median'
                    value={flow.medianCycleTimeDays?.toFixed(1) ?? '-'}
                    subValue='days'
                    className='p-2'
                  />
                  <MetricCard
                    label='P85'
                    value={flow.p85CycleTimeDays?.toFixed(1) ?? '-'}
                    subValue='days'
                    className='p-2'
                  />
                </div>
                <div className='h-48'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={flow.cycleTimeBuckets}>
                      <CartesianGrid strokeDasharray='3 3' className='opacity-50' />
                      <XAxis dataKey='bucketLabel' tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                      <RechartsTooltip />
                      <Bar dataKey='count' name='Issues' fill={CHART_COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ SCOPE & PROGRESS TAB ============ */}
        <TabsContent value='scope' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* Burnup Card */}
            <Card>
              <CardHeader className='pb-2'>
                <SectionHeader
                  icon={<TrendingUp className='h-5 w-5' />}
                  title='Burnup'
                  description='Completed vs total scope'
                />
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-3 gap-2 mb-4'>
                  <MetricCard
                    label='Completed'
                    value={finalBurnup?.completedPoints ?? 0}
                    subValue='points'
                    className='p-2'
                  />
                  <MetricCard
                    label='Total Scope'
                    value={finalBurnup?.totalScopePoints ?? 0}
                    subValue='points'
                    className='p-2'
                  />
                  <MetricCard
                    label='Completion'
                    value={`${burnupCompletionPct}%`}
                    className='p-2'
                  />
                </div>
                <div className='h-48'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart data={scope.burnupPoints}>
                      <CartesianGrid strokeDasharray='3 3' className='opacity-50' />
                      <XAxis dataKey='dayLabel' tick={{ fontSize: 10 }} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type='monotone'
                        dataKey='totalScopePoints'
                        name='Total Scope'
                        stroke={CHART_COLORS.scope}
                        fill={CHART_COLORS.scope}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Area
                        type='monotone'
                        dataKey='completedPoints'
                        name='Completed'
                        stroke={CHART_COLORS.completed}
                        fill={CHART_COLORS.completed}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Scope Change Card */}
            <Card>
              <CardHeader className='pb-2'>
                <SectionHeader
                  icon={<Layers className='h-5 w-5' />}
                  title='Scope Changes'
                  description='Additions & removals during sprint'
                />
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-4 gap-2 mb-4'>
                  <MetricCard
                    label='Initial'
                    value={scope.initialScopePoints}
                    className='p-2 text-center'
                  />
                  <MetricCard
                    label='Added'
                    value={`+${scope.pointsAdded}`}
                    className='p-2 text-center bg-green-50'
                  />
                  <MetricCard
                    label='Removed'
                    value={`-${scope.pointsRemoved}`}
                    className='p-2 text-center bg-red-50'
                  />
                  <MetricCard
                    label='Final'
                    value={scope.finalScopePoints}
                    className='p-2 text-center bg-blue-50'
                  />
                </div>
                <Separator className='my-3' />
                <p className='text-sm font-medium mb-2'>Change Events</p>
                <ScrollArea className='h-40'>
                  {scope.scopeChangeEvents.length > 0 ? (
                    <div className='space-y-2'>
                      {scope.scopeChangeEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-2 rounded-md border-l-2 ${
                            event.type === 'added'
                              ? 'border-green-500 bg-green-50/50'
                              : 'border-red-500 bg-red-50/50'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <Badge
                                variant='outline'
                                className={`text-xs ${
                                  event.type === 'added'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {event.type === 'added' ? '+' : '-'}
                                {event.storyPointsDelta} SP
                              </Badge>
                              <span className='text-xs font-mono text-muted-foreground'>
                                {event.issueKey}
                              </span>
                            </div>
                            <span className='text-xs text-muted-foreground'>
                              {formatShortDate(event.date)}
                            </span>
                          </div>
                          <p className='text-sm mt-1 truncate'>{event.issueTitle}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground italic text-center py-4'>
                      No scope changes
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SprintReportsTab;
