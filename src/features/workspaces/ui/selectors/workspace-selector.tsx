'use client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { useMemo } from 'react';
import { listWorkspacesQueryOptions } from '@/features/workspaces/api/actions';
import { getMeQueryOptions } from '@/features/authn/api/actions'; // FIXME: move to a more appropriate place

export const WorkspaceSelector = () => {
  const { data: me } = useSuspenseQuery(getMeQueryOptions());
  const { data: workspaces } = useSuspenseQuery(listWorkspacesQueryOptions());

  const handleSelectWorkspace = (workspaceId: string) => {
    return redirect('/wps/' + workspaceId);
  };

  const items = useMemo(
    () =>
      workspaces?.map((ws) => ({
        value: ws.id,
        label: (
          <p className={cn('text-sm', ws.ownerId === me?.id ? 'font-semibold' : 'font-normal')}>
            {ws.name + (ws.ownerId === me?.id ? ' (Owner)' : ' (Member)')}
          </p>
        ),
      })),
    [workspaces, me],
  );

  return (
    <Command>
      <CommandInput placeholder='Select a workspace...' />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading='Workspaces' className='space-y-1'>
          {items?.map(({ value, label }, idx) => (
            <CommandItem
              key={value + idx}
              onSelect={() => handleSelectWorkspace(value)}
              onClick={() => handleSelectWorkspace(value)}
              className={cn('hover:bg-transparent')}
            >
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};

export default WorkspaceSelector;
