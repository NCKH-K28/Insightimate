'use client';

import { ProjectItem } from '@/contracts/project';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProjectHeaderV3Props = {
  project: ProjectItem;
  orgSlug: string;
};

export function ProjectHeaderV3({ project, orgSlug }: ProjectHeaderV3Props) {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0' asChild>
          <Link href={`/o/${orgSlug}/projs`}>
            <ArrowLeft className='h-4 w-4' />
          </Link>
        </Button>

        <Avatar className='rounded-lg h-10 w-10'>
          <AvatarImage src={project.avatar ?? undefined} alt={project.name} />
          <AvatarFallback>
            {project.name ? project.name.charAt(0).toUpperCase() : 'P'}
          </AvatarFallback>
        </Avatar>

        <div className='flex flex-col items-start min-w-0 flex-1'>
          <h1 className='text-xl font-semibold truncate w-full'>{project.name}</h1>
          <p
            className={cn(
              'text-sm text-muted-foreground truncate w-full max-w-lg overflow-hidden',
              {
                italic: !project.description,
              },
            )}
          >
            {project.description || 'No description'}
          </p>
        </div>

        <div className='ml-auto flex items-center gap-2'>
          <span className='text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded hidden sm:inline-block'>
            {project.key}
          </span>
          <Button variant='ghost' size='icon' className='h-8 w-8 text-muted-foreground' asChild>
            <Link href={`/o/${orgSlug}/projs/${project.id}/settings`} title="Project Settings">
              <Settings className='h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
      <Separator />
    </div>
  );
}
