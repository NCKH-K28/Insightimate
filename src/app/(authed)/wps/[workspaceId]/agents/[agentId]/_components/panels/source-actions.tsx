import { EllipsisVertical, LogOut, MoreHorizontal, Trash2, UsersIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type SourceActionsProps = { id: string };
export const SourceActions = (props: SourceActionsProps) => {
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
          <DropdownMenuItem>
            <UsersIcon className='mr-2 h-4 w-4' />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MoreHorizontal className='mr-2 h-4 w-4' />
            <span>Edit Source</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Trash2 className='mr-2 h-4 w-4' />
            <span>Delete Source</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
