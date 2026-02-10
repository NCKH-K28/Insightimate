'use client';

import dynamic from 'next/dynamic';
import { PropsWithChildren } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';

import { useParamsRequired } from '@/hooks/next-navigation';
import axiosInstance from '@/lib/api/_client';
import { OrgItem } from '@/contracts/organization/organization.query';

import AppLeftbar from '@/layouts/app-leftbar';
import AppRightbar from '@/layouts/app-rightbar';
import AppBreadcrumbs from './app-breadcrumbs';

import { Button } from '@/components/ui/button';
import { SearchButton } from '@/features/query/ui/search-button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getOrgQueryOptions } from '@/features/organization/api/actions';

/* -------------------------------- Skeleton -------------------------------- */

const LayoutSkeleton: React.FC = () => (
  <SidebarProvider>
    {/* Leftbar skeleton */}
    <div className='hidden md:flex h-dvh w-[280px] shrink-0 border-r bg-background'>
      <div className='w-full p-4 space-y-4'>
        {/* Org header */}
        <div className='flex items-center gap-3'>
          <Skeleton className='h-10 w-10 rounded-md' />
          <div className='flex-1 space-y-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>

        <Skeleton className='h-9 w-full rounded-md' />

        {/* Nav items */}
        <div className='space-y-2 pt-2'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 px-2 py-2'>
              <Skeleton className='h-4 w-4 rounded' />
              <Skeleton className='h-4 w-44' />
            </div>
          ))}
        </div>

        {/* Bottom area */}
        <div className='mt-auto pt-6 space-y-2'>
          <Skeleton className='h-10 w-full rounded-md' />
          <Skeleton className='h-10 w-full rounded-md' />
        </div>
      </div>
    </div>

    {/* Main */}
    <SidebarInset className='h-dvh grid grid-rows-[auto_1fr] overflow-hidden'>
      {/* Header skeleton */}
      <header className='w-full flex h-16 shrink-0 items-center gap-2'>
        <div className='w-full flex items-center gap-2 px-4'>
          <Skeleton className='h-8 w-8 rounded-md' />
          <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />

          <div className='flex flex-1 items-center min-w-0 gap-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-16' />
            <Skeleton className='h-4 w-20' />
          </div>

          <div className='ml-auto flex items-center gap-2'>
            <Skeleton className='h-9 w-36 rounded-md' />
            <Skeleton className='h-9 w-28 rounded-md' />
          </div>
        </div>
      </header>

      {/* Content skeleton */}
      <main className='flex-1 p-4 pt-0 overflow-auto'>
        <div className='space-y-4'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-[55%]' />
          <Skeleton className='h-4 w-[45%]' />

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-28 w-full rounded-xl' />
            ))}
          </div>

          <div className='pt-2 space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className='h-12 w-full rounded-xl' />
            ))}
          </div>
        </div>
      </main>
    </SidebarInset>

    {/* Rightbar skeleton */}
    <div className='hidden lg:flex h-dvh w-[320px] shrink-0 border-l bg-background'>
      <div className='w-full p-4 space-y-4'>
        <Skeleton className='h-6 w-40' />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-20 w-full rounded-xl' />
        ))}
        <Skeleton className='h-6 w-32 pt-4' />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-12 w-full rounded-xl' />
        ))}
      </div>
    </div>
  </SidebarProvider>
);

/* --------------------------------- Layout --------------------------------- */

type OrgLayoutProps = PropsWithChildren;

const OrgLayout: React.FC<OrgLayoutProps> = ({ children }) => {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();

  const fetchOrg = useSuspenseQuery(getOrgQueryOptions({ id: orgSlug, by: 'slug' }));

  if (fetchOrg.isError) throw fetchOrg.error;

  const org = fetchOrg.data;

  return (
    <SidebarProvider>
      <AppLeftbar org={org} />

      <SidebarInset className='h-dvh grid grid-rows-[auto_1fr] overflow-hidden'>
        <header className='w-full flex h-16 shrink-0 items-center gap-2'>
          <div className='w-full flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />

            <div className='flex flex-1 items-center min-w-0'>
              <AppBreadcrumbs />
            </div>

            <div className='ml-auto flex items-center gap-2'>
              <SearchButton variant='outline' />
              <Button size='sm' variant='outline'>
                <Sparkles />
                <span>InsightAI</span>
              </Button>
            </div>
          </div>
        </header>

        <main className='flex-1 p-4 pt-0 overflow-auto'>{children}</main>
      </SidebarInset>

      <AppRightbar />
    </SidebarProvider>
  );
};

export default dynamic(() => Promise.resolve(OrgLayout), {
  ssr: false,
  loading: () => <LayoutSkeleton />,
});
