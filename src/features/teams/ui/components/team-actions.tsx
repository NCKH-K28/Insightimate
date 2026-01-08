import { EllipsisVertical, LogOut, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type TeamActionsProps = {
  onDelete?: () => void;
  onLeave?: () => void;
  disables?: { delete?: boolean; leave?: boolean };
  hiddens?: { delete?: boolean; leave?: boolean };
};
export const TeamActions = (props: TeamActionsProps) => {
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
          <DropdownMenuItem
            hidden={props?.hiddens?.leave}
            disabled={props?.disables?.leave}
            onClick={props?.onLeave}
          >
            <LogOut className='mr-2 h-4 w-4' />
            <span>Leave Team</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={props?.disables?.delete}
            hidden={props?.hiddens?.delete}
            onClick={props?.onDelete}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            <span>Delete Team</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
