'use client';

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from '@/features/activity/ui/activity-feed';
import { TooltipProvider } from '@/components/ui/tooltip';
import { authClient } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';
import { listOrgsQueryOptions } from '@/features/organization/api/actions';

/**
 * ActivityStream — replaces the previous mock-data component.
 * Fetches the user's first org and renders a real ActivityFeed
 * filtered to the current user's actions.
 */
export function ActivityStream() {
  const { data: session } = authClient.useSession();
  const actorId = session?.user?.id;

  const { data: orgs } = useQuery({
    ...listOrgsQueryOptions(),
    enabled: !!actorId,
  });

  // Pick the first org the user belongs to
  const orgId = (orgs as any)?.[0]?.id as string | undefined;

  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between pb-4'>
        <CardTitle className='text-base font-semibold'>Activity stream</CardTitle>
        <Button variant='ghost' size='icon' className='h-8 w-8'>
          <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
        </Button>
      </CardHeader>
      <CardContent className='p-0'>
        {orgId && actorId ? (
          <TooltipProvider delayDuration={300}>
            <ActivityFeed
              params={{ orgId, actorId, limit: 10 }}
              showProject
            />
          </TooltipProvider>
        ) : (
          <p className='text-sm text-muted-foreground text-center py-8 px-4'>
            {actorId ? 'Loading organizations…' : 'Sign in to view activity.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
