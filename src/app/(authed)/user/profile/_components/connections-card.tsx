import React from 'react';
import { Check, UserPlus, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { connections } from '@/lib/data';

export function ConnectionsCard() {
  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Connections</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {connections.map((person) => (
            <div key={person.id} className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback className={`${person.avatarColor} text-xs font-semibold`}>
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className='text-sm font-medium leading-none'>{person.name}</p>
                  <p className='text-xs text-muted-foreground mt-1'>{person.role}</p>
                </div>
              </div>
              <Button
                size='icon'
                variant={person.connected ? 'default' : 'outline'}
                className={`h-8 w-8 rounded-full ${person.connected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                {person.connected ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <UserPlus className='h-4 w-4 text-muted-foreground' />
                )}
              </Button>
            </div>
          ))}
        </div>
        <div className='mt-6 flex justify-center'>
          <Button variant='ghost' size='sm' className='text-muted-foreground text-xs'>
            View all connections
            <ChevronRight className='ml-1 h-3 w-3' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
