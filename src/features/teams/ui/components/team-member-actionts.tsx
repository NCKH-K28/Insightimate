import { EllipsisVertical, LogOut, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { removeTeamMembershipMutationOptions } from '../../api/actionts';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

type TeamMemberActionsProps = {
  params: { teamId: string; memberId: string };
  onDelete?: () => void;
  onLeave?: () => void;
  disables?: { delete?: boolean; leave?: boolean };
  hiddens?: { delete?: boolean; leave?: boolean };
};
export const TeamMemberActions = (props: TeamMemberActionsProps) => {
  // log pamra
  console.log('TeamMemberActions props:', props);
  const routerParams = useParams<{ workspaceId: string }>();
  const orgId = routerParams?.workspaceId || '';
  const deleteMember = useMutation(removeTeamMembershipMutationOptions({ orgId, ...props.params }));

  const handleDelete = async () => {
    await toast
      .promise(deleteMember.mutateAsync(), {
        loading: 'Removing member...',
        success: 'Member removed',
        error: 'Failed to remove member',
      })
      .unwrap()
      .then(() => {
        props.onDelete?.();
      });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <EllipsisVertical className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={props.onLeave}>
            <LogOut className='mr-2 h-4 w-4' />
            <span>Leave</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            disabled={props.disables?.delete ?? deleteMember.isPending}
            hidden={props.hiddens?.delete}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
