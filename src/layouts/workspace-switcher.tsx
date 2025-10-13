'use client';

import * as React from 'react';
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { redirect, useParams } from 'next/navigation';
import {
  getWorkspaceQueryOptions,
  listWorkspacesQueryOptions,
} from '@/features/workspaces/api/actions';

function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const params = useParams<{ workspaceId: string }>();

  const { data: workspace } = useSuspenseQuery(getWorkspaceQueryOptions(params));
  const fetchWorkspaces = useQuery({ ...listWorkspacesQueryOptions(), enabled: false });

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              onMouseEnter={() => {
                if (!fetchWorkspaces.data && !fetchWorkspaces.isFetching) {
                  fetchWorkspaces.refetch();
                }
              }}
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <GalleryVerticalEnd className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium'>{workspace.name}</span>
                <span className='truncate text-xs'>{'Enterprise'}</span>
              </div>
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Workspaces
            </DropdownMenuLabel>
            {fetchWorkspaces.isFetching && !fetchWorkspaces.data ? (
              <div className='p-2 text-sm text-muted-foreground'>Loading...</div>
            ) : null}

            {fetchWorkspaces.data?.map((workspace, index) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => {
                  redirect(`/wps/${workspace.id}`);
                }}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-md border'>
                  <GalleryVerticalEnd className='size-3.5 shrink-0' />
                </div>
                {workspace.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2' onClick={() => redirect('/wps')}>
              <div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
                <Plus className='size-4' />
              </div>
              <div className='text-muted-foreground font-medium'>Add workspace</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default WorkspaceSwitcher;
