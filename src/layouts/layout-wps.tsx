'use client';

import React from 'react';
import { selectedWorkspaceIdAtom } from '@/hooks/atoms/workspace.atom';
import { useSetAtom } from 'jotai';
import { useParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import AppLeftbar from '@/layouts/app-leftbar';
import AppRightbar from '@/layouts/app-rightbar';

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { SearchButton } from '@/features/query/ui/search-button';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

function WpsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ workspaceId: string }>();
  const pathname = usePathname();
  const router = useRouter();

  if (!params) throw new Error('Params is undefined');
  if (!pathname) throw new Error('Pathname is undefined');
  if (!router) throw new Error('Router is undefined');
  const { workspaceId } = params;

  if (!workspaceId) throw new Error('workspaceId is required');

  const setSelectedWorkspaceId = useSetAtom(selectedWorkspaceIdAtom);

  React.useEffect(() => {
    if (workspaceId) setSelectedWorkspaceId(workspaceId);
  }, [workspaceId, setSelectedWorkspaceId]);

  const toggleInsightAI = () => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('rightbar') === 'agent') {
      searchParams.delete('rightbar');
      router.replace(`${pathname}?${searchParams.toString()}`);
    } else {
      searchParams.set('rightbar', 'agent');
      router.replace(`${pathname}?${searchParams.toString()}`);
    }
  };

  return (
    <SidebarProvider>
      <AppLeftbar />
      <SidebarInset className='h-dvh grid grid-rows-[auto_1fr] overflow-hidden'>
        <header className='w-full flex h-16 shrink-0 items-center gap-2'>
          <div className='w-full flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
            <SearchButton variant='outline' />
            <Button size='sm' variant='outline' className='ml-auto' onClick={toggleInsightAI}>
              <Sparkles />
              <span>InsightAI</span>
            </Button>
          </div>
        </header>

        <main className='flex-1 p-4 pt-0 overflow-auto'>{children}</main>
      </SidebarInset>
      <AppRightbar />
    </SidebarProvider>
  );
}

export default dynamic(() => Promise.resolve(WpsLayout), {
  ssr: false,
  loading: () => {
    return <div className='h-dvh w-full animate-pulse bg-gray-200' />;
  },
});
