'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { listTeamsQueryOptions } from '@/features/teams/api/actionts';
import { useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, ArrowRight, Plus, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, UserPlus, Settings, LogOut, Trash2 } from 'lucide-react';
import { CreateTeamBtn } from '../buttons/create-team-btn';

export type TeamListProps = { params: { workspaceId: string } };

type VisibleMembersProps = { members: Array<{ id: string; name: string; avatar?: string | null }> };
export const VisibleMembers = ({ members }: VisibleMembersProps) => {
  const maxVisible = 5;
  const visibleMembers = members.slice(0, maxVisible);
  const extraCount = members.length - maxVisible;

  return (
    <div className='flex -space-x-2'>
      {visibleMembers.map((member) => (
        <Avatar
          key={member.id}
          className='h-7 w-7 rounded-full border-2 border-background ring-2 ring-background transition-transform hover:scale-110 hover:z-10'
          title={member.name}
        >
          <AvatarImage src={member.avatar ?? undefined} alt={member.name} />
          <AvatarFallback className='text-xs font-medium bg-gradient-to-br from-primary/20 to-primary/10'>
            {member.name[0]}
          </AvatarFallback>
        </Avatar>
      ))}
      {extraCount > 0 && (
        <div className='h-7 w-7 flex items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted/80 text-xs font-semibold text-muted-foreground ring-2 ring-background'>
          +{extraCount}
        </div>
      )}
    </div>
  );
};

type TeamActionsProps = { teamId: string; teamBasePath: string };
export const TeamActions = ({ teamId, teamBasePath }: TeamActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/10'
          onClick={(e) => e.preventDefault()}
        >
          <MoreVertical className='h-4 w-4' />
          <span className='sr-only'>Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href={`${teamBasePath}/${teamId}/edit`}>
            <Edit className='h-4 w-4 mr-2' />
            Edit Team
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href={`${teamBasePath}/${teamId}/members/invite`}>
            <UserPlus className='h-4 w-4 mr-2' />
            Invite Members
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='cursor-pointer'>
          <Link href={`${teamBasePath}/${teamId}/settings`}>
            <Settings className='h-4 w-4 mr-2' />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-amber-600 cursor-pointer focus:text-amber-600 focus:bg-amber-50'>
          <LogOut className='h-4 w-4 mr-2' />
          Leave Team
        </DropdownMenuItem>
        <DropdownMenuItem className='text-destructive cursor-pointer focus:text-destructive focus: bg-destructive/10'>
          <Trash2 className='h-4 w-4 mr-2' />
          Delete Team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const EmptyState = () => {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('EmptyState must be used within a route with workspaceId param');

  return (
    <div className='flex flex-col items-center justify-center py-20 px-4'>
      <div className='relative'>
        <div className='rounded-full bg-linear-to-br from-primary/20 to-primary/5 p-6 mb-6'>
          <Users className='h-10 w-10 text-primary' />
        </div>
        <div className='absolute -top-1 -right-1 rounded-full bg-primary/10 p-2'>
          <Sparkles className='h-4 w-4 text-primary' />
        </div>
      </div>
      <h3 className='text-xl font-semibold mb-2'>No teams yet</h3>
      <p className='text-muted-foreground text-center mb-8 max-w-md leading-relaxed'>
        Teams help you organize members and collaborate effectively. Create your first team to get
        started on your journey.
      </p>
      <CreateTeamBtn
        params={params}
        renderLabel={() => (
          <Button
            asChild
            size='lg'
            className='gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all'
          >
            <Link href='#'>
              <Plus className='h-4 w-4' />
              Create Your First Team
            </Link>
          </Button>
        )}
      />
    </div>
  );
};

export const TeamsList = ({ params }: TeamListProps) => {
  const pathname = usePathname();
  if (!pathname) throw new Error('pathname is undefined');

  const teamBasePath = useMemo(() => {
    const basePath = pathname.replace(/\/teams(\/.*)?$/, '');
    if (!basePath || basePath === '/' || basePath === '') throw new Error('Invalid path');
    return basePath + '/teams';
  }, [pathname]);

  const { data: teams } = useSuspenseQuery(listTeamsQueryOptions(params.workspaceId));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (teams.length === 0) return <EmptyState />;
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
      {teams.map((team) => (
        <Link key={team.id} href={`${teamBasePath}/${team.id}`} className='group block'>
          <Card className='h-full transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 overflow-hidden'>
            <CardHeader className='flex items-start justify-between gap-3'>
              <div className='flex items-start gap-3 flex-1 min-w-0'>
                <Avatar className='h-12 w-12 rounded-xl shadow-sm'>
                  <AvatarImage src={team.avatar ?? undefined} alt={team.name} />
                  <AvatarFallback className='rounded-xl bg-linear-to-br from-primary/20 to-primary/5 text-primary font-semibold'>
                    {getInitials(team.name)}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                  <CardTitle className='text-base font-semibold truncate group-hover:text-primary transition-colors duration-200'>
                    {team.name}
                  </CardTitle>
                  {team.members && (
                    <Badge
                      variant='secondary'
                      className='mt-1. 5 text-xs font-medium bg-secondary/50 hover:bg-secondary/70'
                    >
                      <Users className='h-3 w-3 mr-1' />
                      {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                    </Badge>
                  )}
                </div>
              </div>
              <TeamActions teamId={team.id} teamBasePath={teamBasePath} />
            </CardHeader>

            <CardContent>
              {team.description ? (
                <p className='text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed'>
                  {team.description}
                </p>
              ) : (
                <p className='text-sm text-muted-foreground/50 italic mb-4'>No description</p>
              )}

              {/* Members preview */}
              {team.members && team.members.length > 0 && (
                <div className='mb-4'>
                  <VisibleMembers members={team.members.map(({ user }) => user)} />
                </div>
              )}

              <div className='flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50'>
                <span className='flex items-center gap-1.5'>
                  <Calendar className='h-3.5 w-3.5' />
                  {formatDate(team.createdAt)}
                </span>
                <span className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 text-primary font-medium translate-x-2 group-hover:translate-x-0'>
                  View team
                  <ArrowRight className='h-3.5 w-3.5' />
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
