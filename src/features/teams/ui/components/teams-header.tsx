import { UsersRoundIcon } from 'lucide-react';
import { CreateTeamBtn } from '../buttons/create-team-btn';

type TeamsHeaderProps = { params: { workspaceId: string } };
export const TeamsHeader = ({ params }: TeamsHeaderProps) => {
  return (
    <div className='flex items-center justify-between mb-6'>
      <div className='flex items-center gap-2'>
        <UsersRoundIcon className='h-6 w-6 text-gray-600' />
        <h2 className='text-2xl font-semibold'>Teams</h2>
      </div>
      <CreateTeamBtn params={params} />
    </div>
  );
};
