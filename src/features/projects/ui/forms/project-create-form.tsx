'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { ProjectPermission } from './project-permission';
import { ProjectInfo } from './project-info';
import { ProjectCreateInput, ZProjectCreateInput } from '@/contracts/projects';
import { createProjectMutationOptions } from '@/features/projects/api/actions';
import { getMeQueryOptions } from '@/features/authn/api/actions'; // FIXME: move to a more appropriate place
import { get } from 'lodash';

// const ZProjectCreateForm = ZProjectCreateInput.omit({ workspaceId: true });
// type ProjectCreateFormData = z.infer<typeof ZProjectCreateForm>;

type ProjectCreateFormProps = { workspaceId: string };
export function ProjectCreateForm(props: ProjectCreateFormProps) {
  const { data: me } = useSuspenseQuery(getMeQueryOptions());

  const { workspaceId } = props;
  const router = useRouter();
  const createProject = useMutation(createProjectMutationOptions());

  const form = useForm<ProjectCreateInput>({
    resolver: zodResolver(ZProjectCreateInput),
    mode: 'onChange',
    defaultValues: {
      leadId: me?.id || '',
      name: '',
      key: '',
      description: '',
      type: 'SOFTWARE',
      avatar: '/icons/project/1000.svg',
      workspaceId,
      roles: [],
    },
  });

  const handleSubmit = form.handleSubmit(
    async (data) => {
      await toast
        .promise(createProject.mutateAsync(data), {
          loading: 'Creating project...',
          success: 'Project created successfully!',
          error: (err) => {
            const msg = get(err, 'response.data.error', `Error creating project: ${err.message}`);
            return msg;
          },
        })
        .unwrap()
        .then((data) => {
          router.push(`/wps/${data.workspaceId}/projects/${data.id}`);
          form.reset();
        });
    },
    (error) => {
      console.error('Form validation errors:', error);
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn('container mx-auto max-w-2xl', 'space-y-6')}>
        <ProjectInfo form={form} />

        <ProjectPermission form={form} />

        <div className='flex items-center justify-end gap-2'>
          <Button hidden type='button' variant='outline'>
            Cancel
          </Button>
          <Button
            type='submit'
            className='w-full sm:w-auto'
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
