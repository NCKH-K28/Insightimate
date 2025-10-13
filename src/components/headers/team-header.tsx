import { UsersIcon } from 'lucide-react';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { deleteTeamMutationOptions, getTeamQueryOptions } from '@/features/teams/api/actionts';
import { Suspense, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TeamActions } from '@/features/teams/ui/components/team-actions';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

type TeamHeaderProps = { params: { workspaceId: string; teamId: string } };
const TeamHeader = ({ params: { teamId } }: TeamHeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const deleteTeam = useMutation(deleteTeamMutationOptions(teamId));
  const { data: team } = useQuery(getTeamQueryOptions(teamId));

  const teamsPath = useMemo(() => {
    const segments = pathname.split('/');
    const teamIndex = segments.findIndex((segment) => segment === 'teams');
    if (teamIndex === -1) return '/';
    return segments.slice(0, teamIndex + 1).join('/');
  }, [pathname]);

  const onDelete = () => {
    if (deleteTeam.isPending) return;
    toast
      .promise(deleteTeam.mutateAsync(), {
        loading: 'Deleting team...',
        success: 'Team deleted',
        error: 'Failed to delete team',
      })
      .unwrap()
      .then(() => router.push(teamsPath));
  };

  return (
    <div className='flex items-center justify-between border-b pb-2 gap-4'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <UsersIcon className='h-6 w-6 text-muted-foreground' />
          <h1 className='text-2xl font-semibold'>{team?.name || 'Team'}</h1>
        </div>
        <div
          hidden={!team?.description}
          className={cn(
            'text-sm text-muted-foreground',
            'max-w-[300px] md:max-w-[600px] lg:max-w-[800px]',
            'truncate',
          )}
        >
          {team?.description}
        </div>
      </div>
      <div>
        <TeamActions onDelete={onDelete} />
      </div>
    </div>
  );
};

const Wrapper = (Component: React.ComponentType<TeamHeaderProps>) => (props: TeamHeaderProps) => {
  return (
    <Suspense fallback={<div className='h-10 w-full rounded-md bg-muted' />}>
      <Component {...props} />
    </Suspense>
  );
};

export default Wrapper(TeamHeader);
