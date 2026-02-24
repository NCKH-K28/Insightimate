'use client';

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import type { TeamMember } from '@/features/organization/server/dashboard.service';

// ==================== Component ====================

type YourTeamProps = {
  members: TeamMember[];
};

export const YourTeam: React.FC<YourTeamProps> = ({ members }) => {
  if (members.length === 0) return null;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold'>Your Team</CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='space-y-4'>
          {members.map((member) => (
            <div key={member.id} className='flex items-center gap-3'>
              <Avatar className='size-9'>
                <AvatarImage src={member.avatar ?? undefined} alt={member.name} />
                <AvatarFallback className='text-xs font-medium bg-primary/10 text-primary'>
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium truncate'>{member.name}</p>
                <p className='text-xs text-muted-foreground'>{member.role}</p>
              </div>

              {/* Online status dot (static) */}
              <div className='size-2.5 rounded-full bg-emerald-500 shrink-0' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
