'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ProjectPermission } from './project-permission';
import { ProjectInfo } from './project-info';
import { ProjectCreateInput, ZProjectCreateInput } from '@/contracts/projects';
import { createProjectMutationOptions } from '@/features/projects/api/actions';
import get from 'lodash/get';
import { z } from 'zod';

const ZCreateFormData = ZProjectCreateInput;
type CreateFormData = z.infer<typeof ZCreateFormData>;

type ProjectCreateFormProps = {
  onSuccess?: (data: { id: string }) => void;
  onValueChange?: (data: Partial<CreateFormData>) => void;
  value: { workspaceId: string; leadId: string };
  defaultValue?: Partial<ProjectCreateInput>;
};
export function ProjectCreateForm(props: ProjectCreateFormProps) {
  const router = useRouter();
  const createProject = useMutation(createProjectMutationOptions());

  const form = useForm<CreateFormData>({
    resolver: zodResolver(ZCreateFormData),
    mode: 'onChange',
    defaultValues: {
      leadId: props.value.leadId,
      workspaceId: props.value.workspaceId,
      name: '',
      key: '',
      description: '',
      type: 'SOFTWARE',
      avatar: '/icons/project/1000.svg',
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
            //FIXME: cần chuẩn hóa lỗi từ backend
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

  // const watchedValues = useWatch<CreateFormData>({ control: form.control });
  // useEffect(() => {
  //   if (props.onValueChange)
  //     props.onValueChange({
  //       name: watchedValues.name,
  //       key: watchedValues.key,
  //       description: watchedValues.description,
  //       type: watchedValues.type,
  //       avatar: watchedValues.avatar,
  //     });
  // }, [watchedValues, props]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn('container mx-auto max-w-2xl', 'space-y-6')}>
        <ProjectInfo form={form} />

        <ProjectPermission form={form} />

        <div
          className={cn(
            'flex items-center justify-end gap-2 py-2',
            'sticky bottom-0 bg-white dark:bg-gray-800',
          )}
        >
          <Button hidden type='button' variant='outline'>
            Cancel
          </Button>
          <Button type='submit' disabled={form.formState.isSubmitting || !form.formState.isValid}>
            {(form.formState.isSubmitting && <Loader2 className='animate-spin' />) || <Plus />}
            {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
