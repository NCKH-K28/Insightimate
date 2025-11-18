'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { Suspense } from 'react';
import {
  addTeamMembershipMutationOptions,
  getTeamQueryOptions,
} from '@/features/teams/api/actionts';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZTeamMemberAddInput } from '@/contracts/teams';
import { get } from 'lodash';
import { TeamMemberActions } from './team-member-actionts';
import { UserInvite } from '@/features/users/ui/user-invite';

type TeamShareProps = { teamId: string };
export function TeamShare({ teamId }: TeamShareProps) {
  const { data: team } = useSuspenseQuery(getTeamQueryOptions(teamId));

  const addMember = useMutation(addTeamMembershipMutationOptions(teamId));

  const memberships: any[] = team.members || [];

  const form = useForm({
    resolver: zodResolver(ZTeamMemberAddInput),
    defaultValues: { users: [] },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await toast
      .promise(addMember.mutateAsync(data), {
        loading: 'Adding members...',
        success: 'Members added',
        error: (err) => get(err, 'response.data.error', 'Something went wrong'),
      })
      .unwrap()
      .then(() => form.reset());
  });

  return (
    <Suspense fallback={<div className='h-52 bg-gray-200 rounded animate-pulse' />}>
      <Card className='shadow-none'>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage access to your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-2'>
            <div className='flex flex-row justify-end w-full gap-2'>
              <UserInvite
                disabled={addMember.isPending}
                dialogDescription='Add users to your team, user must be part of the workspace'
                onInviteClick={({ users }) => {
                  form.setValue(
                    'users',
                    users.map((m) => ({ userId: m.id })),
                    { shouldDirty: true, shouldTouch: true, shouldValidate: true },
                  );
                  handleSubmit();
                }}
                params={{ resourceType: 'TEAM', resourceId: teamId }}
                renderTrigger={() => <Button size='sm'>Add User</Button>}
              />
            </div>
          </div>
          <Separator className='my-4' />
          <div className='flex flex-col gap-4'>
            <div className='text-sm font-medium'>People with access</div>
            <div className='grid gap-6'>
              {memberships.map(({ id: memberId, user }) => (
                <div key={user.email} className='flex items-center justify-between gap-4'>
                  <div className='flex items-center gap-4'>
                    <Avatar>
                      <AvatarImage src={user.avatar} alt='Image' />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='text-sm leading-none font-medium'>{user.name}</p>
                      <p className='text-muted-foreground text-sm'>{user.email}</p>
                    </div>
                  </div>
                  <TeamMemberActions params={{ teamId, memberId }} />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Suspense>
  );
}
