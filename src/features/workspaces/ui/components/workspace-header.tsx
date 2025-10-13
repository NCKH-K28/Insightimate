import { useRouter } from 'next/navigation';
import { DeleteWorkspaceBtn } from '../buttons/delete-workspace-btn';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getWorkspaceQueryOptions } from '../../api/actions';
import { get } from 'lodash';
import { ComponentIcon } from 'lucide-react';

type WorkspaceHeaderProps = { params: { workspaceId: string } };
export const WorkspaceHeader = ({ params }: WorkspaceHeaderProps) => {
  const router = useRouter();
  const { data: workspace } = useSuspenseQuery(getWorkspaceQueryOptions(params));
  const permissions = workspace?.permissions || [];
  const canDelete = get(permissions, 'delete') === true;

  if (!workspace) return null;
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-4'>
        <ComponentIcon />
        <h1 className='text-2xl font-bold'>{workspace.name}</h1>
      </div>
      <div className='flex gap-2'>
        <DeleteWorkspaceBtn
          params={params}
          onSuccess={() => router.push('/wps')}
          disable={!canDelete}
        />
      </div>
    </div>
  );
};
