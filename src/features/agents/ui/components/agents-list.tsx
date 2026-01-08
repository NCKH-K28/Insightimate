'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Bot,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
  Upload,
  Eye,
  Activity,
  Plus,
  AlertCircle,
  Calendar,
  Zap,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { listAgentsQueryOptions } from '@/features/agents/api/actions';
import { formatDistanceToNow } from 'date-fns';

const AgentListSkeleton = () => {
  return (
    <TooltipProvider>
      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='space-y-2'>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-4 w-64' />
          </div>
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-40' />
          </div>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-6 w-3/4' />
                <Skeleton className='h-4 w-full' />
                <div className='flex gap-2 mt-2'>
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-5 w-12' />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className='h-4 w-full mb-2' />
                <Skeleton className='h-4 w-24' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

// Empty state component
const EmptyState = ({ workspaceId }: { workspaceId: string }) => (
  <div className='flex flex-col items-center justify-center py-12 text-center'>
    <div className='p-4 bg-muted/50 rounded-full mb-4'>
      <Bot className='h-12 w-12 text-muted-foreground' />
    </div>
    <h3 className='text-xl font-semibold mb-2'>No agents yet</h3>
    <p className='text-muted-foreground mb-6 max-w-md'>
      Create your first AI agent to automate tasks and workflows in your workspace.
    </p>
    <Button asChild>
      <Link href={`/wps/${workspaceId}/agents/new`}>
        <Plus className='h-4 w-4 mr-2' />
        Create Your First Agent
      </Link>
    </Button>
  </div>
);

// Error state component
const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <Alert variant='destructive'>
    <AlertCircle className='h-4 w-4' />
    <AlertDescription className='flex items-center justify-between'>
      <span>Failed to load agents. Please try again.</span>
      <Button variant='outline' size='sm' onClick={onRetry}>
        <RefreshCw className='h-4 w-4 mr-2' />
        Retry
      </Button>
    </AlertDescription>
  </Alert>
);

const AgentActions = ({ params }: { params: { agentId: string; workspaceId: string } }) => {
  const agent = { id: params.agentId };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'
        >
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href={`/wps/${params.workspaceId}/agents/${agent.id}`}>
            <Eye className='mr-2 h-4 w-4' />
            View Details
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/wps/${params.workspaceId}/agents/${agent.id}/edit`}>
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/wps/${params.workspaceId}/agents/${agent.id}/settings`}>
            <Settings className='mr-2 h-4 w-4' />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/wps/${params.workspaceId}/agents/${agent.id}/analytics`}>
            <Activity className='mr-2 h-4 w-4' />
            Analytics
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem className='text-red-600 focus:text-red-600'>
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type AgentsListProps = { params: { workspaceId: string } };

export const AgentsList = ({ params }: AgentsListProps) => {
  const { data: agents, isLoading, error, refetch } = useQuery(listAgentsQueryOptions(params));

  if (isLoading) return <AgentListSkeleton />;

  return (
    <TooltipProvider>
      <div className='max-w-7xl mx-auto p-6 space-y-6'>
        {/* Header */}
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-1'>
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
              <Bot className='h-8 w-8 text-primary' />
              AI Agents
              {agents && (
                <Badge variant='secondary' className='ml-2'>
                  {agents.length}
                </Badge>
              )}
            </h1>
            <p className='text-muted-foreground'>
              Manage and configure your intelligent automation agents
            </p>
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='outline' disabled>
              <Upload className='h-4 w-4 mr-2' />
              Import Agent
            </Button>
            <Button asChild>
              <Link href={`/wps/${params.workspaceId}/agents/new`}>
                <Plus className='h-4 w-4 mr-2' />
                Create Agent
              </Link>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && <ErrorState onRetry={() => refetch()} />}

        {/* Empty State */}
        {!error && agents && agents.length === 0 && <EmptyState workspaceId={params.workspaceId} />}

        {/* Agents Grid */}
        {!error && agents && agents.length > 0 && (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {agents.map((agent) => (
              <Card
                key={agent.id}
                className='group hover:shadow-lg transition-all duration-200 border-0 shadow-sm hover:shadow-md hover:scale-[1.02]'
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-start gap-3 flex-1 min-w-0'>
                      <div className='p-2 bg-primary/10 rounded-lg flex-shrink-0 group-hover:bg-primary/20 transition-colors'>
                        <Bot className='h-4 w-4 text-primary' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <CardTitle className='text-lg leading-tight'>
                          <Link
                            href={`/wps/${params.workspaceId}/agents/${agent.id}`}
                            className='hover:text-primary transition-colors line-clamp-1'
                          >
                            {agent.name}
                          </Link>
                        </CardTitle>

                        {/* Tags */}
                        {agent.tags && agent.tags.length > 0 && (
                          <div className='flex flex-wrap gap-1 mt-2'>
                            {agent.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant='outline' className='text-xs px-2 py-0'>
                                {tag}
                              </Badge>
                            ))}
                            {agent.tags.length > 2 && (
                              <Badge variant='outline' className='text-xs px-2 py-0'>
                                +{agent.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <AgentActions params={{ agentId: agent.id, workspaceId: params.workspaceId }} />
                  </div>

                  <CardDescription className='line-clamp-2 text-sm leading-relaxed'>
                    {agent.description || 'No description available'}
                  </CardDescription>
                </CardHeader>

                <CardContent className='pt-0'>
                  <div className='space-y-2'>
                    {/* Model Badge */}
                    {agent.model && (
                      <div className='flex items-center gap-2'>
                        <Zap className='h-3 w-3 text-muted-foreground' />
                        <Badge variant='secondary' className='text-xs'>
                          {agent.model}
                        </Badge>
                      </div>
                    )}

                    {/* Last Updated */}
                    {agent.updatedAt && (
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <Calendar className='h-3 w-3' />
                        Updated{' '}
                        {formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true })}
                      </div>
                    )}

                    {/* Owner Info */}
                    {agent.owner && (
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <div className='w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center'>
                          <span className='text-xs font-medium text-primary'>
                            {agent.owner.name?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span>by {agent.owner.name || agent.owner.email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
