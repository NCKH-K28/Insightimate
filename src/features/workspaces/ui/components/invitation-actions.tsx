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
import {
  resendInviteMutationOptions,
  revokeInviteMutationOptions,
} from '@/features/authz/api/actions';
import { toast } from 'sonner';

type InvitationActionsProps = {
  params: { workspaceId: string; invitationId: string };
  invitation: { id: string };
};
export const InvitationActions = ({ params, invitation }: InvitationActionsProps) => {
  const revokeInvitation = useMutation(revokeInviteMutationOptions(params));
  const resendInvitation = useMutation(resendInviteMutationOptions(params));

  const handleResend = () => {
    toast.promise(resendInvitation.mutateAsync(), {
      loading: 'Resending invitation...',
      success: 'Invitation resent!',
      error: 'Error resending invitation',
    });
  };

  const handleRevoke = () => {
    toast.promise(revokeInvitation.mutateAsync(), {
      loading: 'Revoking invitation...',
      success: 'Invitation revoked!',
      error: 'Error revoking invitation',
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
          <DropdownMenuGroup>
            <DropdownMenuLabel className='text-xs font-normal text-muted-foreground'>
              Invitation
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={handleResend} disabled={resendInvitation.isPending}>
              <MailIcon className='mr-2 h-4 w-4' />
              <span>Resend</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleRevoke} disabled={revokeInvitation.isPending}>
              <DeleteIcon className='mr-2 h-4 w-4' />
              <span>Revoke</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
