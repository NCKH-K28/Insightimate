import { EllipsisVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type BoardIssueActionsProps = {
  onDelete?: () => void;
  disables?: { delete?: boolean };
  hiddens?: { delete?: boolean };
  disabled?: boolean;
  className?: string;
};
export const BoardIssueActions = (props: BoardIssueActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={props.disabled} className={props.className}>
        <Button variant='outline' size='icon'>
          <EllipsisVertical />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={props?.disables?.delete}
            hidden={props?.hiddens?.delete}
            onClick={props?.onDelete}
          >
            <Trash2 className='mr-2' />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
