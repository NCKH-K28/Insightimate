'use client';

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  getProjectQueryOptions,
  deleteProjectMutationOptions,
} from '@/features/project/api/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParamsRequired } from '@/hooks/next-navigation';

import { GeneralSettings } from '@/features/project/ui/components/general-settings';
import { MemberSettings } from '@/features/project/ui/components/member-settings';
import { PermissionSettings } from '@/features/project/ui/components/permission-settings';
import { StatusSettings } from '@/features/project/ui/components/status-settings';
import { WorkTypeSettings } from '@/features/project/ui/components/worktype-settings';
import { FeaturesSettings } from '@/features/project/ui/components/features-settings';
import { AutomationsSettings } from '@/features/project/ui/components/automations-settings';

export default function ProjectSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { orgSlug, projId } = useParamsRequired<{ orgSlug: string; projId: string }>();

  const { data: project } = useSuspenseQuery(getProjectQueryOptions({ projId }));

  // Mutation for deleting the project
  const deleteProject = useMutation({
    ...deleteProjectMutationOptions({ projId }),
    onSuccess: () => {
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/o/${orgSlug}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to delete project');
    },
  });

  return (
    <div className='container mx-auto max-w-6xl space-y-8 p-4 py-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight mb-2'>Project Settings</h1>
        <p className='text-muted-foreground'>
          Manage configuration, actors, fields, and permissions for project <strong>{project?.name}</strong>.
        </p>
      </div>

      <Tabs defaultValue='general' className='flex flex-col'>
        <TabsList className='justify-start h-auto p-0 bg-transparent border-b w-full rounded-none overflow-x-auto min-h-[3rem]'>
          <TabsTrigger
            value='general'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2'
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value='members'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2'
          >
            Members
          </TabsTrigger>
          <TabsTrigger
            value='permissions'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2'
          >
            Permissions
          </TabsTrigger>
          <TabsTrigger
            value='statuses'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2'
          >
            Statuses
          </TabsTrigger>
          <TabsTrigger
            value='worktypes'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2'
          >
            Work Types
          </TabsTrigger>
          <TabsTrigger
            value='features'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2'
          >
            Features
          </TabsTrigger>
          <TabsTrigger
            value='automations'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2'
          >
            Automations
          </TabsTrigger>
        </TabsList>

        <div className='mt-6 outline-hidden'>
          <TabsContent value='general' className='space-y-8'>
            <GeneralSettings projectId={projId} />

            {/* Danger Zone */}
            <Card className='border-destructive/20 shadow-none'>
              <CardHeader>
                <CardTitle className='text-xl text-destructive'>Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions. Proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div className='space-y-1 pr-6'>
                    <h4 className='font-medium text-sm'>Delete Project</h4>
                    <p className='text-sm text-muted-foreground'>
                      Permanently delete this project, including all its issues, boards, and sprints.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant='destructive' className='shrink-0'>
                        Delete Project
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the project{' '}
                          <span className='font-semibold text-foreground'>{project?.name}</span> and
                          remove all associated data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          onClick={(e) => {
                            e.preventDefault();
                            deleteProject.mutate(undefined as any);
                          }}
                          disabled={deleteProject.isPending}
                        >
                          {deleteProject.isPending ? 'Deleting...' : 'Yes, delete project'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='members'>
            <MemberSettings projectId={projId} />
          </TabsContent>

          <TabsContent value='permissions'>
            <PermissionSettings projectId={projId} />
          </TabsContent>

          <TabsContent value='statuses'>
            <StatusSettings projectId={projId} />
          </TabsContent>

          <TabsContent value='worktypes'>
            <WorkTypeSettings projectId={projId} />
          </TabsContent>

          <TabsContent value='features'>
            <FeaturesSettings projectId={projId} />
          </TabsContent>

          <TabsContent value='automations'>
            <AutomationsSettings projectId={projId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
