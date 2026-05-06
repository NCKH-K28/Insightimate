import { UsersRoundIcon } from 'lucide-react';
import { CreateTeamBtn } from '../buttons/create-team-btn';

type TeamsHeaderProps = { params: { orgId: string } };
export const TeamsHeader = ({ params }: TeamsHeaderProps) => {
  return (
    <div className='flex items-end justify-between'>
      <div className='flex flex-col space-y-1'>
        <h1 className='flex items-center space-x-2 text-3xl font-bold'>
          <UsersRoundIcon className='h-6 w-6 text-gray-600' />
          <span className='text-2xl font-semibold'>Teams</span>
        </h1>
        <p className='text-sm text-muted-foreground'>
          Manage your teams and collaborate with your workspace members.
        </p>
      </div>

      <CreateTeamBtn params={params} />
    </div>
  );
};
