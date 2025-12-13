import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  Flag,
  CalendarDays,
  AlertTriangle,
  Users,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  Circle,
  Bug,
  Target,
  BarChart3,
  Clock,
  Minus,
  Layers,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { Sprint } from '@/contracts/sprints/sprint';

// ============ Types ============

export type SprintStatus = 'FUTURE' | 'ACTIVE' | 'CLOSED';

export type IssueStatus = 'todo' | 'inProgress' | 'inReview' | 'done';

export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface SprintIssue {
  id: string;
  key: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  storyPoints?: number;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  isHighlight?: boolean;
  dueDate?: string;
}

export interface SprintMember {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  availability?: 'full' | 'partial' | 'off';
  timeOffDays?: number;
}

export interface SprintBlockerOrRisk {
  id: string;
  title: string;
  description?: string;
  ownerName?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface SprintDecision {
  id: string;
  description: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface BurndownPoint {
  dayLabel: string;
  remainingPoints: number;
}

export interface SprintSummaryMetrics {
  totalStoryPoints: number;
  completedStoryPoints: number;
  totalIssues: number;
  issuesAddedAfterStart: number;
  newBugs: number;
  resolvedBugs: number;
  burndownTrend: BurndownPoint[];
  burndownStatus?: 'onTrack' | 'behind' | 'ahead';
}

export interface SprintSummaryTabProps {
  sprint: Sprint;

  sprintName: string;
  projectName?: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  sprintGoal?: string;
  teamName?: string;

  metrics: SprintSummaryMetrics;

  inProgressIssues: SprintIssue[];
  doneHighlightIssues: SprintIssue[];

  blockers: SprintBlockerOrRisk[];
  risks: SprintBlockerOrRisk[];
  decisions: SprintDecision[];

  teamMembers: SprintMember[];
  plannedStoryPoints?: number;
  committedStoryPoints?: number;

  upcomingIssues?: SprintIssue[];

  onViewBoard?: () => void;
  onViewReport?: () => void;
}

// ============ Helper Functions ============

const formatDate = (isoDate: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(isoDate));
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============ Sub-Components ============

const StatusBadge: React.FC<{ status: SprintStatus }> = ({ status }) => {
  const config: Record<
    SprintStatus,
    { label: string; variant: 'default' | 'secondary' | 'outline'; className: string }
  > = {
    FUTURE: {
      label: 'Upcoming',
      variant: 'outline',
      className: 'border-blue-500 text-blue-600 bg-blue-50',
    },
    ACTIVE: {
      label: 'Active',
      variant: 'default',
      className: 'bg-green-500 text-white hover:bg-green-600',
    },
    CLOSED: {
      label: 'Completed',
      variant: 'secondary',
      className: 'bg-gray-500 text-white',
    },
  };

  const { label, className } = config[status];

  return <Badge className={className}>{label}</Badge>;
};

const PriorityBadge: React.FC<{ priority: IssuePriority }> = ({ priority }) => {
  const config: Record<IssuePriority, { label: string; className: string }> = {
    critical: { label: 'P0', className: 'bg-red-600 text-white' },
    high: { label: 'P1', className: 'bg-orange-500 text-white' },
    medium: { label: 'P2', className: 'bg-yellow-500 text-white' },
    low: { label: 'P3', className: 'bg-gray-400 text-white' },
  };

  const { label, className } = config[priority];

  return (
    <Badge variant='secondary' className={`text-xs px-1. 5 py-0.5 ${className}`}>
      {label}
    </Badge>
  );
};

const IssueStatusBadge: React.FC<{ status: IssueStatus }> = ({ status }) => {
  const config: Record<IssueStatus, { label: string; className: string }> = {
    todo: { label: 'To Do', className: 'bg-gray-100 text-gray-700' },
    inProgress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
    inReview: { label: 'In Review', className: 'bg-purple-100 text-purple-700' },
    done: { label: 'Done', className: 'bg-green-100 text-green-700' },
  };

  const { label, className } = config[status];

  return (
    <Badge variant='outline' className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
};

const SeverityBadge: React.FC<{ severity: 'low' | 'medium' | 'high' }> = ({ severity }) => {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-gray-100 text-gray-600' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
    high: { label: 'High', className: 'bg-red-100 text-red-700' },
  };

  const { label, className } = config[severity];

  return (
    <Badge variant='outline' className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
};

const AvailabilityBadge: React.FC<{
  availability: 'full' | 'partial' | 'off';
}> = ({ availability }) => {
  const config: Record<string, { label: string; className: string }> = {
    full: { label: 'Full', className: 'bg-green-100 text-green-700' },
    partial: { label: 'Partial', className: 'bg-yellow-100 text-yellow-700' },
    off: { label: 'Off', className: 'bg-gray-100 text-gray-500' },
  };

  const { label, className } = config[availability];

  return (
    <Badge variant='outline' className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
};

const AssigneeAvatar: React.FC<{
  assignee?: { name: string; avatarUrl?: string };
  size?: 'sm' | 'md';
}> = ({ assignee, size = 'sm' }) => {
  if (!assignee) return null;

  const sizeClass = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar className={sizeClass}>
            {assignee.avatarUrl && <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />}
            <AvatarFallback className='text-xs'>{getInitials(assignee.name)}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>
          <p>{assignee.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MiniSparkline: React.FC<{ data: BurndownPoint[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.remainingPoints), 1);
  const height = 40;

  return (
    <div className='flex items-end gap-0.5 h-10'>
      {data.map((point, index) => {
        const barHeight = (point.remainingPoints / maxValue) * height;
        return (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className='bg-blue-400 hover:bg-blue-500 rounded-t-sm transition-colors cursor-pointer min-w-[4px] flex-1'
                  style={{ height: `${Math.max(barHeight, 2)}px` }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {point.dayLabel}: {point.remainingPoints} pts
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
};

const IssueItem: React.FC<{
  issue: SprintIssue;
  showStatus?: boolean;
  showCheckIcon?: boolean;
}> = ({ issue, showStatus = true, showCheckIcon = false }) => {
  return (
    <div className='flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors'>
      {showCheckIcon && <CheckCircle className='h-4 w-4 text-green-500 flex-shrink-0' />}
      {showStatus && !showCheckIcon && <IssueStatusBadge status={issue.status} />}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2'>
          <span className='text-xs text-muted-foreground font-mono'>{issue.key}</span>
          <span className='text-sm truncate'>{issue.title}</span>
        </div>
        {issue.dueDate && (
          <div className='flex items-center gap-1 mt-0.5 text-xs text-muted-foreground'>
            <Clock className='h-3 w-3' />
            <span>{formatDate(issue.dueDate)}</span>
          </div>
        )}
      </div>
      <div className='flex items-center gap-2 flex-shrink-0'>
        <PriorityBadge priority={issue.priority} />
        {issue.storyPoints !== undefined && (
          <Badge variant='outline' className='text-xs'>
            {issue.storyPoints} SP
          </Badge>
        )}
        <AssigneeAvatar assignee={issue.assignee} />
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className='flex items-center justify-center py-6 text-muted-foreground text-sm'>
    {message}
  </div>
);

// ============ Main Component ============

const SprintSummaryTab: React.FC<SprintSummaryTabProps> = ({
  sprint,
  teamName,
  metrics,
  inProgressIssues,
  doneHighlightIssues,
  blockers,
  risks,
  decisions,
  teamMembers,
  plannedStoryPoints,
  committedStoryPoints,
  upcomingIssues,
  onViewBoard,
  onViewReport,
}) => {
  const progressPercentage =
    metrics.totalStoryPoints > 0
      ? Math.round((metrics.completedStoryPoints / metrics.totalStoryPoints) * 100)
      : 0;

  const capacityPercentage =
    plannedStoryPoints && plannedStoryPoints > 0 && committedStoryPoints
      ? Math.round((committedStoryPoints / plannedStoryPoints) * 100)
      : 0;

  const getBurndownStatusIcon = () => {
    switch (metrics.burndownStatus) {
      case 'ahead':
        return <TrendingDown className='h-4 w-4 text-green-500' />;
      case 'behind':
        return <TrendingUp className='h-4 w-4 text-red-500' />;
      default:
        return <Minus className='h-4 w-4 text-blue-500' />;
    }
  };

  const getBurndownStatusText = () => {
    switch (metrics.burndownStatus) {
      case 'ahead':
        return 'Ahead of schedule';
      case 'behind':
        return 'Behind schedule';
      default:
        return 'On track';
    }
  };

  const getBurndownStatusClass = () => {
    switch (metrics.burndownStatus) {
      case 'ahead':
        return 'text-green-600';
      case 'behind':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* 1. Header: Sprint Information */}

      {/* 2. Key Metrics Row */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Progress Card */}
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardDescription className='flex items-center gap-1. 5'>
                <Target className='h-4 w-4' />
                Progress
              </CardDescription>
              <span className='text-2xl font-bold'>{progressPercentage}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className='h-2' />
            <p className='text-sm text-muted-foreground mt-2'>
              {metrics.completedStoryPoints} / {metrics.totalStoryPoints} SP done
            </p>
          </CardContent>
        </Card>

        {/* Scope Card */}
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardDescription className='flex items-center gap-1.5'>
                <Layers className='h-4 w-4' />
                Scope
              </CardDescription>
              <span className='text-2xl font-bold'>{metrics.totalIssues}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>Total issues</p>
            {metrics.issuesAddedAfterStart > 0 && (
              <p className='text-sm text-amber-600 mt-1'>
                +{metrics.issuesAddedAfterStart} added after start
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quality Card */}
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardDescription className='flex items-center gap-1.5'>
                <Bug className='h-4 w-4' />
                Quality
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <div>
                <span className='text-2xl font-bold text-red-500'>{metrics.newBugs}</span>
                <p className='text-xs text-muted-foreground'>New bugs</p>
              </div>
              <Separator orientation='vertical' className='h-10' />
              <div>
                <span className='text-2xl font-bold text-green-500'>{metrics.resolvedBugs}</span>
                <p className='text-xs text-muted-foreground'>Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Burndown Card */}
        <Card
          className={`hover:shadow-md transition-shadow ${onViewReport ? 'cursor-pointer' : ''}`}
          onClick={onViewReport}
        >
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardDescription className='flex items-center gap-1. 5'>
                <BarChart3 className='h-4 w-4' />
                Burndown
              </CardDescription>
              {getBurndownStatusIcon()}
            </div>
          </CardHeader>
          <CardContent>
            <MiniSparkline data={metrics.burndownTrend} />
            <p className={`text-sm mt-2 font-medium ${getBurndownStatusClass()}`}>
              {getBurndownStatusText()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Work in Progress & Done Highlights */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* In Progress Card */}
        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Circle className='h-4 w-4 text-blue-500' />
              In Progress
              <Badge variant='secondary' className='ml-auto'>
                {inProgressIssues.length}
              </Badge>
            </CardTitle>
            <CardDescription>High priority work in progress</CardDescription>
          </CardHeader>
          <CardContent>
            {inProgressIssues.length > 0 ? (
              <ScrollArea className='max-h-64'>
                <div className='space-y-1'>
                  {inProgressIssues.map((issue) => (
                    <IssueItem key={issue.id} issue={issue} showStatus />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState message='No work in progress' />
            )}
          </CardContent>
        </Card>

        <Card className='hover:shadow-md transition-shadow'>
          <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              Done (Highlights)
              <Badge variant='secondary' className='ml-auto'>
                {doneHighlightIssues.length}
              </Badge>
            </CardTitle>
            <CardDescription>Key completed work this sprint</CardDescription>
          </CardHeader>
          <CardContent>
            {doneHighlightIssues.length > 0 ? (
              <ScrollArea className='max-h-64'>
                <div className='space-y-1'>
                  {doneHighlightIssues.map((issue) => (
                    <IssueItem key={issue.id} issue={issue} showStatus={false} showCheckIcon />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState message='No highlights yet' />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className='hover:shadow-md transition-shadow'>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Team & Capacity
          </CardTitle>
          <CardDescription>Team members and sprint capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Team Members */}
            <div>
              <h4 className='font-semibold text-sm mb-3'>Team Members</h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className='flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors'
                  >
                    <Avatar className='h-10 w-10'>
                      {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={member.name} />}
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>{member.name}</p>
                      {member.role && (
                        <p className='text-xs text-muted-foreground'>{member.role}</p>
                      )}
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                      {member.availability && (
                        <AvailabilityBadge availability={member.availability} />
                      )}
                      {member.timeOffDays !== undefined && member.timeOffDays > 0 && (
                        <span className='text-xs text-muted-foreground'>
                          {member.timeOffDays}d off
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capacity Summary */}
            <div>
              <h4 className='font-semibold text-sm mb-3'>Capacity Summary</h4>
              {plannedStoryPoints !== undefined && (
                <div className='space-y-4'>
                  <div>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-muted-foreground'>Committed vs Planned</span>
                      <span className='text-sm font-medium'>
                        {committedStoryPoints ?? 0} / {plannedStoryPoints} SP
                      </span>
                    </div>
                    <Progress
                      value={Math.min(capacityPercentage, 100)}
                      className={`h-3 ${capacityPercentage > 100 ? 'bg-red-200' : ''}`}
                    />
                    <p className='text-xs text-muted-foreground mt-1'>
                      {capacityPercentage}% capacity committed
                      {capacityPercentage > 100 && (
                        <span className='text-red-500 ml-1'>(Over capacity!)</span>
                      )}
                    </p>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='text-center p-3 bg-muted/30 rounded-lg'>
                      <p className='text-2xl font-bold'>{plannedStoryPoints}</p>
                      <p className='text-xs text-muted-foreground'>Planned SP</p>
                    </div>
                    <div className='text-center p-3 bg-muted/30 rounded-lg'>
                      <p className='text-2xl font-bold'>{committedStoryPoints ?? 0}</p>
                      <p className='text-xs text-muted-foreground'>Committed SP</p>
                    </div>
                  </div>
                </div>
              )}
              {plannedStoryPoints === undefined && (
                <p className='text-sm text-muted-foreground italic'>No capacity data available</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SprintSummaryTab;
