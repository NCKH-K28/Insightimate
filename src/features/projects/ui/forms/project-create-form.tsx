'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm, UseFormReturn } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

import { useMutation } from '@tanstack/react-query';
import { ProjectPermission } from './project-permission';
import { ProjectInfo } from './project-info';
import { ProjectCreateInput, ZProjectCreateInput } from '@/contracts/project';
import { createProjectMutationOptions } from '@/features/projects/api/actions';
import { z } from 'zod';
import { getErrorMsg } from '@/lib/api/helper';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ZCreateFormData = ZProjectCreateInput;
type CreateFormData = z.infer<typeof ZCreateFormData>;

const ProjectTypes = (props: { form: UseFormReturn<CreateFormData> }) => {
  const { fields, append, remove } = useFieldArray({ control: props.form.control, name: 'types' });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Input {...props.form.register(`types.${index}.name`)} />
          <Button type='button' onClick={() => remove(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        type='button'
        onClick={() => {
          append({ name: '', description: '', hierarchy: 1, sequence: fields.length });
        }}
      >
        Add Type
      </Button>
    </div>
  );
};

const ProjectStatus = (props: { form: UseFormReturn<CreateFormData> }) => {
  const { fields, append, remove } = useFieldArray({
    control: props.form.control,
    name: 'statuses',
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <Input {...props.form.register(`statuses.${index}.name`)} />
          <Button type='button' onClick={() => remove(index)}>
            Remove
          </Button>
        </div>
      ))}
      <Button
        type='button'
        onClick={() => {
          append({ name: '', description: '', category: 'TODO', sequence: fields.length });
        }}
      >
        Add Status
      </Button>
    </div>
  );
};

type Lead = { id: string; name: string; avatar?: string };
type ProjectCreateFormProps = {
  onSuccess?: (data: { id: string }) => void;
  onValueChange?: (data: Partial<CreateFormData>) => void;
  values: { leadId: string };
  defaultValue?: Partial<ProjectCreateInput>;
  leadOptions: Lead[] | Promise<Lead[]>;
};
export function ProjectCreateForm({
  onSuccess,
  onValueChange,
  values,
  defaultValue,
}: ProjectCreateFormProps) {
  const createProject = useMutation(createProjectMutationOptions());

  const form = useForm<CreateFormData>({
    resolver: zodResolver(ZCreateFormData),
    mode: 'onChange',
    defaultValues: {
      leadId: values.leadId,
      name: '',
      key: '',
      description: '',
      type: 'SOFTWARE',
      avatar: '/icons/project/1000.svg',
      roles: [],
    },
  });

  const handleSubmit = form.handleSubmit(
    (data) => {
      return toast
        .promise(createProject.mutateAsync(data, { onSuccess }), {
          success: 'Project created successfully!',
          error: (err) => {
            const msg = getErrorMsg(err, 'Failed to create project');
            return msg;
          },
        })
        .unwrap();
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
        <Tabs defaultValue='info' className='w-full'>
          <TabsList>
            <TabsTrigger value='info'>Info</TabsTrigger>
            <TabsTrigger value='type'>Type</TabsTrigger>
            <TabsTrigger value='field'>Field</TabsTrigger>
            <TabsTrigger value='permission'>Permission</TabsTrigger>
          </TabsList>
          <TabsContent value='info'>
            <ProjectInfo form={form} />
          </TabsContent>
          <TabsContent value='type'>
            <ProjectTypes form={form} />
          </TabsContent>
          <TabsContent value='field'>
            <ProjectField form={form} />
          </TabsContent>
          <TabsContent value='permission'>
            <ProjectPermission form={form} />
          </TabsContent>
        </Tabs>

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
