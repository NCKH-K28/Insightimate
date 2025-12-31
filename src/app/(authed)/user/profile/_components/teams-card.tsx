import React from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { teams } from '@/lib/data';

export function TeamsCard() {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Teams</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {teams.map((team) => (
            <div key={team.id} className='flex items-center gap-3'>
              <div className='h-9 w-9 rounded bg-muted/50 flex items-center justify-center'>
                <span className='text-muted-foreground font-medium text-sm'>
                  {team.name.substring(1, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className='text-sm font-medium leading-none'>{team.name}</p>
                <p className='text-xs text-muted-foreground mt-1'>{team.members} members</p>
              </div>
            </div>
          ))}
        </div>
        <div className='mt-6 flex justify-center'>
          <Button variant='ghost' size='sm' className='text-muted-foreground text-xs'>
            View all teams
            <ChevronRight className='ml-1 h-3 w-3' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
