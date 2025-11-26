'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const QuickStats: React.FC<{
  quickStats: { backlog?: number; bugs?: number; activeSprints?: number };
}> = ({ quickStats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
        <CardDescription>Snapshot overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-3'>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Backlog</span>
            <span className='font-semibold'>{quickStats.backlog ?? '—'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Bugs</span>
            <span className='font-semibold'>{quickStats.bugs ?? '—'}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-muted-foreground'>Active Sprints</span>
            <span className='font-semibold'>{quickStats.activeSprints ?? '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickStats;
