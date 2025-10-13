import { DeleteIcon, EllipsisVertical, LogOut, MailIcon, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { deleteWorkspaceMemberMutationOptions } from '../../api/actions';
import { toast } from 'sonner';
import { LeaveWorkspaceBtn } from '../buttons/leave-workspace-btn';

type MemberActionsProps = {
  params: { workspaceId: string; memberId: string };
  onDelete?: () => void;
  onLeave?: () => void;
  disables?: { delete?: boolean; leave?: boolean };
  hiddens?: { delete?: boolean; leave?: boolean };
};
export const MemberActions = (props: MemberActionsProps) => {
  const showLength = Object.values(props.hiddens || {}).filter((v) => !v).length;

  const deleteMember = useMutation(deleteWorkspaceMemberMutationOptions(props.params));
  const leaveMember = useMutation(deleteWorkspaceMemberMutationOptions(props.params));

  const handleDeleteMember = async () => {
    await toast
      .promise(deleteMember.mutateAsync({}), {
        loading: 'Deleting member...',
        success: 'Member deleted successfully!',
        error: (err) => `Error deleting member: ${err.message}`,
      })
      .unwrap();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={showLength === 0}>
        <Button variant='outline' size='icon'>
          <EllipsisVertical className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <LeaveWorkspaceBtn
            params={{ workspaceId: props.params.workspaceId }}
            renderLabel={() => {
              return (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (props.onLeave) props.onLeave();
                    else leaveMember.mutate({});
                  }}
                  disabled={props.hiddens?.leave}
                  hidden={props.hiddens?.leave}
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Leave</span>
                </DropdownMenuItem>
              );
            }}
          />

          <DropdownMenuItem
            onClick={() => {
              if (props.onDelete) props.onDelete();
              else handleDeleteMember();
            }}
            disabled={props.disables?.delete}
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
