'use client';

import React, { useEffect } from 'react';
import { selectedWorkspaceIdAtom } from '@/hooks/atoms/workspace.atom';
import { useSetAtom } from 'jotai';
import { redirect, useParams, usePathname } from 'next/navigation';

import AppSidebar from '@/layouts/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import dynamic from 'next/dynamic';

function WpsLayout({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  if (!workspaceId) throw new Error('workspaceId is required');

  const setSelectedWorkspaceId = useSetAtom(selectedWorkspaceIdAtom);

  React.useEffect(() => {
    if (workspaceId) setSelectedWorkspaceId(workspaceId);
  }, [workspaceId, setSelectedWorkspaceId]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className='h-dvh grid grid-rows-[auto_1fr] overflow-hidden'>
        <header className='flex h-16 shrink-0 items-center gap-2'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <BreadcrumbLink href='#'>Building Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className='flex-1 p-4 pt-0 overflow-hidden'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default dynamic(() => Promise.resolve(WpsLayout), {
  ssr: false,
  loading: () => {
    return <div className='h-dvh w-full animate-pulse bg-gray-200' />;
  },
});
