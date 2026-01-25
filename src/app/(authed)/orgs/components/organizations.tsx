'use client';

import React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { FolderIcon, User2Icon, Users2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';
import axiosInstance from '@/lib/api/_client';
import { useRouterRequired } from '@/hooks/next-navigation';

import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { OrgItem } from '@/contracts/organizations/organization.query';
import { Role, OrgAvatar, RoleBadge, StatItem, formatRelative } from './org-shared';
import { useOrgsSuspense } from '@/hooks/org';

export const OrgListSkeleton = () => (
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
    {Array.from({ length: 3 }).map((_, idx) => (
      <Card key={idx} className='animate-pulse'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <Skeleton className='shrink-0 size-12 sm:size-14 rounded-xl' />
            <div className='min-w-0 flex-1'>
              <Skeleton className='h-5 w-3/4 mb-2 rounded' />
              <Skeleton className='h-4 w-1/2 rounded' />
            </div>
          </CardTitle>
        </CardHeader>
        <CardFooter className='flex flex-wrap items-center gap-5 border-t border-slate-200'>
          <Skeleton className='h-4 w-1/4 rounded' />
          <Skeleton className='h-4 w-1/4 rounded' />
          <Skeleton className='h-4 w-1/4 rounded' />
        </CardFooter>
      </Card>
    ))}
  </div>
);

type OrgCardProps = { org: OrgItem; href?: string };

export const OrgCard: React.FC<OrgCardProps> = ({ org, href }) => {
  const router = useRouterRequired();
  const count = org._count;
  const role = (org._me?.role as Role | undefined) ?? undefined;

  return (
    <Card
      className={cn(
        'transition-all',
        href ? 'group cursor-pointer hover:shadow-lg hover:border-primary' : '',
      )}
      onClick={() => href && router.push(href)}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
    >
      <CardHeader>
        <CardTitle className='flex items-start gap-3'>
          <OrgAvatar name={org.name} logo={org.logo} />

          <div className='min-w-0 flex-1'>
            <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2'>
              <h3
                className={cn(
                  'min-w-0 font-semibold text-slate-800 text-base sm:text-lg leading-snug line-clamp-2 sm:line-clamp-1',
                  'group-hover:text-primary',
                )}
              >
                {org.name}
              </h3>

              <RoleBadge role={role} />
            </div>

            {org.updatedAt && (
              <p className='text-xs text-slate-500'>{formatRelative(org.updatedAt, 'Updated')}</p>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {count && (
        <CardFooter className='flex flex-wrap items-center gap-5 border-t border-slate-200'>
          {typeof count.projects === 'number' && count.projects > 0 && (
            <StatItem icon={FolderIcon} value={count.projects} label='Projects' />
          )}
          {typeof count.members === 'number' && count.members > 0 && (
            <StatItem icon={User2Icon} value={count.members} label='Members' />
          )}
          {typeof count.teams === 'number' && count.teams > 0 && (
            <StatItem icon={Users2Icon} value={count.teams} label='Teams' />
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export const OrgList = () => {
  const { data: orgs } = useOrgsSuspense();

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {orgs.map((org) => (
        <OrgCard key={org.id} org={org} href={`/o/${org.slug}`} />
      ))}
    </div>
  );
};
