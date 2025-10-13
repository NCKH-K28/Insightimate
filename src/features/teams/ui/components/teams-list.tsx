'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { listTeamsQueryOptions } from '@/features/teams/api/actionts';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type TeamListProps = { params: { workspaceId: string } };
export const TeamsList = ({ params }: TeamListProps) => {
  const pathname = usePathname();

  const teamBasePath = useMemo(() => {
    const basePath = pathname.replace(/\/teams(\/.*)?$/, '');
    if (!basePath || basePath === '/' || basePath === '') throw new Error('Invalid path');
    return basePath + '/teams';
  }, [pathname]);

  const { data: teams } = useSuspenseQuery(listTeamsQueryOptions(params));

  if (teams.length === 0) {
    return <p className='text-gray-600'>No teams found. Create a team to get started.</p>;
  }

  return (
    <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
      {teams.map((team) => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle className='text-lg font-medium w-full overflow-hidden'>
              <Button asChild variant='outline' size='sm' className='w-full'>
                <Link href={`${teamBasePath}/${team.id}`}>
                  <p className='truncate'>{team.name}</p>
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-gray-600 mb-2 truncate'>{team.description}</p>
            <p className='text-xs text-gray-500 mb-4'>Members: {team._count.members}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
