import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MenuAction = {
  id: string;
  label: string;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  icon?: LucideIcon;
};

type ActionsMenuProps = {
  actions: MenuAction[];
};

export function ActionsMenu({ actions }: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
          <MoreHorizontal className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end'>
        {actions.map(({ id, label, onClick, shortcut, disabled, destructive, icon: Icon }) => (
          <DropdownMenuItem
            key={id}
            onClick={onClick}
            disabled={disabled}
            className={destructive ? 'text-destructive' : ''}
          >
            <div className='flex w-full items-center'>
              {Icon && <Icon className='mr-2 h-4 w-4' aria-hidden='true' />}
              <span className='flex-1'>{label}</span>
              {shortcut && <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
