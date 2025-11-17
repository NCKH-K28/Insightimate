'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FolderKanban, ChevronDown, ExternalLink } from 'lucide-react';
import React from 'react';

export type ProjectCardProps = {
  id: string;
  workspaceId?: string | undefined;
  name: string;
  type: string;
  avatar?: string | null;
  color: string;
  openItems: number;
  doneItems: number;
  boards: number;
};

export default function ProjectCard({
  id,
  workspaceId,
  name,
  type,
  avatar,
  color,
  openItems,
  doneItems,
  boards,
}: ProjectCardProps) {
  const href = workspaceId ? `/wps/${workspaceId}/projects/${id}` : `/projects/${id}`;
  const router = useRouter();

  return (
    <div
      role='button'
      tabIndex={0}
      className='block'
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push(href);
      }}
    >
      <Card
  className="
    relative overflow-hidden isolate group border-muted/60 transition-transform duration-200 ease-out p-2
    hover:-translate-y-0.5 hover:shadow-md

    before:content-[''] before:absolute before:left-0 before:right-0 before:bottom-0
    before:h-0 before:bg-black/85 before:pointer-events-none before:transition-[height] before:duration-300
    group-hover:before:h-12 before:-z-10

    after:content-[''] after:absolute after:top-0 after:right-0
    after:w-0 after:h-full after:bg-black/70 after:pointer-events-none after:transition-[width] after:duration-300
    group-hover:after:w-12 after:-z-10
  "
>
        <div className={`absolute left-0 top-0 h-full w-1 ${color}`} />

        <CardHeader className='pb-0.5'>
          <div className='flex items-center gap-1.5'>
            <Avatar className='h-5 w-5 shadow-sm'>
              {avatar ? (
                <AvatarImage src={avatar} alt={name} />
              ) : (
                <AvatarFallback className='text-[10px]'>
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className='min-w-0'>
              <h3 className='text-sm font-medium leading-tight truncate'>{name}</h3>
              <p className='text-[11px] text-muted-foreground truncate'>{type}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-0.5'>
          <div>
            <p className='text-[11px] font-medium text-muted-foreground'>Quick links</p>
            <div className='mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1'>
              <QuickLink label='My open work items' count={openItems} />
              <QuickLink label='Done work items' count={doneItems} />
            </div>
          </div>
        </CardContent>

        <CardFooter className='flex items-center justify-between pt-0'>
          <div className='text-[11px] text-muted-foreground flex items-center gap-1'>
            <FolderKanban className='h-3 w-3' />
            <Link
              href={`${href}?tab=board`}
              onClick={(e: any) => {
                e.stopPropagation();
              }}
              className='text-[11px] underline-offset-2 hover:underline'
            >
              {boards} board{boards !== 1 ? 's' : ''}
            </Link>
            <ChevronDown className='h-3 w-3' />
          </div>
          <Button variant='ghost' size='sm' className='h-6 px-2 text-xs'>
            Open <ExternalLink className='ml-1 h-3 w-3' />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function QuickLink({ label, count }: { label: string; count?: number }) {
  return (
    <button className='flex items-center justify-between rounded-xl border bg-card px-3 py-2 text-left text-sm hover:bg-accent/40'>
      <span className='truncate'>{label}</span>
      <Badge variant='secondary' className='ml-2'>
        {count ?? 0}
      </Badge>
    </button>
  );
}
