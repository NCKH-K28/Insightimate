import { Form } from '@/components/ui/form';
import { ProjectInfo } from './project-info';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { ZProjectUpdateInput } from '@/contracts/project';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { updateProjectMutationOptions } from '../../api/actions';

const ZProjectFormData = ZProjectUpdateInput;
type ProjectFormData = z.infer<typeof ZProjectFormData>;

type UpdateProjectFormProps = {
  params: { projectId: string };
  defaultValues?: Partial<ProjectFormData>;
  onSuccess?: () => void;
};
export const UpdateProjectForm = (props: UpdateProjectFormProps) => {
  const updateProject = useMutation(updateProjectMutationOptions({ projId: props.params.projectId }));

  const getDirtyValues = () => {
    const dirtyFields = form.formState.dirtyFields;
    const values = form.getValues();
    return Object.fromEntries(
      Object.entries(values).filter(([key]) => dirtyFields[key as keyof typeof dirtyFields]),
    ) as Partial<ProjectFormData>;
  };

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(ZProjectFormData),
    mode: 'onChange',
    defaultValues: { name: '', description: '', avatar: null, ...props.defaultValues },
  });

  const handleSubmit = form.handleSubmit(async () => {
    const data = getDirtyValues();
    if (Object.keys(data).length === 0) return;
    await updateProject.mutateAsync(data);
    props.onSuccess?.();
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn('container mx-auto max-w-2xl', 'space-y-6')}>
        <ProjectInfo
          form={form}
          disableds={{
            key: true,
          }}
        />

        <div className='flex items-center justify-end gap-2'>
          <Button hidden type='button' variant='outline'>
            Cancel
          </Button>
          <Button
            type='submit'
            className='w-full sm:w-auto'
            disabled={
              form.formState.isSubmitting || !form.formState.isDirty || !form.formState.isValid
            }
          >
            {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
