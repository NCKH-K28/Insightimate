import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

import { InputGroupButton } from '@/components/ui/input-group';
import { IconApps, IconBook, IconCircleDashedPlus, IconPlus, IconWorld } from '@tabler/icons-react';
import React from 'react';

export const AllSourcesDropdown = () => {
  const [scopeMenuOpen, setScopeMenuOpen] = React.useState(false);

  return (
    <DropdownMenu open={scopeMenuOpen} onOpenChange={setScopeMenuOpen}>
      <DropdownMenuTrigger asChild>
        <InputGroupButton size='sm' className='rounded-full'>
          <IconWorld className='size-3' />
          <span className='text-xs'>All Sources</span>
        </InputGroupButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side='top' align='start' className='[--radius:1.2rem]'>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <label htmlFor='web-search'>
              <IconWorld /> Web Search <Switch id='web-search' className='ml-auto' defaultChecked />
            </label>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <label htmlFor='apps'>
              <IconApps /> Apps and Integrations
              <Switch id='apps' className='ml-auto' defaultChecked />
            </label>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconCircleDashedPlus /> All Sources I can access
          </DropdownMenuItem>
          <DropdownMenuItem>
            <IconBook /> Help Center
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconPlus /> Connect Apps
          </DropdownMenuItem>
          <DropdownMenuLabel className='text-muted-foreground text-xs'>
            We&apos;ll only search in the sources selected here.
          </DropdownMenuLabel>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
