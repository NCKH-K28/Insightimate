'use client';

import { redirect, useParams } from 'next/navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getWorkspaceQueryOptions } from '@/features/workspaces/api/actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { WorkspaceHeader } from '@/features/workspaces/ui/components/workspace-header';
import { WorkspaceInfo } from '@/features/workspaces/ui/components/workspace-info';
import { MembersList } from '@/features/workspaces/ui/components/members-list';
import { InvitationsList } from '@/features/workspaces/ui/components/invitations-list';

export default function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const { data: workspace, isError } = useSuspenseQuery(getWorkspaceQueryOptions({ workspaceId }));

  if (!workspaceId || !workspace) return redirect('/wps');
  if (isError) return redirect('/wps');

  return (
    <div className='container mx-auto flex flex-col gap-4' id='settings-page'>
      <WorkspaceHeader params={{ workspaceId }} />
      <WorkspaceInfo workspaceId={workspaceId} />
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage workspace members and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationsList workspaceId={workspaceId} permissions={workspace.permissions} />
          <MembersList workspaceId={workspaceId} permissions={workspace.permissions} />
        </CardContent>
      </Card>
    </div>
  );
}
