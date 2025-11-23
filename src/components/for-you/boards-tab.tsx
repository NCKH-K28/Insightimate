'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { fetchProjectsQueryOptions } from '@/features/projects/api/actions';
import EmptyState from './empty-state';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import TabLoading from './tab-loading';

const SAMPLE_BOARDS = [
  { id: 'b1', key: 'PRJ-1', projectName: 'Project Alpha' },
  { id: 'b2', key: 'PRJ-2', projectName: 'Project Beta' },
  { id: 'b3', key: 'PRJ-3', projectName: 'Project Gamma' },
];

export default function BoardsTab({ workspaceId }: { workspaceId?: string }) {
  if (!workspaceId) {
    return (
      <div>
        <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>BOARDS</h3>
        <div className='mt-2'>
          <EmptyState label='Select a workspace to view boards' />
        </div>
      </div>
    );
  }

  const { data: projectsData, isPending: isLoading } = useQuery(
    { ...fetchProjectsQueryOptions({ filter: { workspaceId } }), enabled: !!workspaceId },
  );

  const projects = projectsData ?? SAMPLE_BOARDS;
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const router = useRouter();

  function toggleFavorite(id: string) {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div>
      <h3 className='text-xs font-semibold text-muted-foreground tracking-wide'>BOARDS</h3>
      <div className='mt-2'>
        {isLoading ? (
          <TabLoading />
        ) : projects.length === 0 ? (
          <EmptyState label='No boards found' />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-20' >
                  <Star className='h-4 w-4 text-muted-foreground' />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {projects.map((proj: any) => (
                <TableRow
                  key={proj.id}
                  className='cursor-pointer hover:bg-accent/5'
                  onClick={() => router.push(`/wps/${workspaceId}/projects/${proj.id}?tab=board`)}
                >
                  <TableCell>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(proj.id);
                      }}
                      className='p-1 rounded hover:bg-accent/5'
                      aria-label={`Toggle favorite ${proj.projectName}`}
                    >
                      <Star
                        className={
                          favorites[proj.id]
                            ? 'h-4 w-4 fill-current text-yellow-400'
                            : 'h-4 w-4 text-muted-foreground'
                        }
                      />
                    </button>
                  </TableCell>
                  <TableCell>{`${proj.key} Board`}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar className='w-6 h-6'>
                        {proj.avatar ? (
                          <AvatarImage src={proj.avatar} alt={proj.projectName ?? proj.key} />
                        ) : (
                          <AvatarFallback>{(proj.projectName || proj.key || '')[0]}</AvatarFallback>
                        )}
                      </Avatar>
                      <span>{`${proj.name}`}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
