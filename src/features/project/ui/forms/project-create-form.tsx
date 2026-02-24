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
import { createProjectMutationOptions } from '@/features/project/api/actions';
import { z } from 'zod';
import { getErrorMsg } from '@/lib/api/helper';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DEFAULT_PRIORITIES,
  DEFAULT_STATUSES,
  DEFAULT_TYPES,
} from '@/features/project/contants/default-project';
import { getDefaultRoles } from '@/features/project/contants/default-roles';

const ZCreateFormData = ZProjectCreateInput;
type CreateFormData = z.infer<typeof ZCreateFormData>;

import { ProjectTypeMap } from './project-type-map';
import { ProjectStatusEditor } from './project-status-editor';

type Lead = { id: string; name: string; avatar?: string };
type ProjectCreateFormProps = {
  onSuccess?: (data: { id: string }) => void;
  onValueChange?: (data: Partial<CreateFormData>) => void;
  values: { leadId: string; orgId: string };
  defaultValue?: Partial<ProjectCreateInput>;
  leadOptions?: Lead[] | Promise<Lead[]>;
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
      orgId: values.orgId,
      leadId: values.leadId,
      name: '',
      key: '',
      description: '',
      type: 'SOFTWARE',
      avatar: '/icons/project/1000.svg',
      roles: getDefaultRoles(),
      types: DEFAULT_TYPES.map((t) => ({
        name: t.name,
        color: t.color,
        hierarchy: t.hierarchy,
        iconURL: t.iconURL ?? null,
        description: null,
        sequence: t.sequence,
      })),
      statuses: DEFAULT_STATUSES.map((s) => ({
        name: s.name,
        color: s.color,
        category: s.category,
        iconURL: null,
        description: null,
        sequence: s.sequence,
      })),
      priorities: DEFAULT_PRIORITIES.map((p) => ({
        name: p.name,
        color: p.color,
        iconURL: p.iconURL ?? null,
        description: null,
        sequence: p.sequence,
      })),
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
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <Tabs defaultValue='info' className='w-full'>
          <TabsList className='w-full grid grid-cols-4'>
            <TabsTrigger value='info'>Info</TabsTrigger>
            <TabsTrigger value='type'>Type Map</TabsTrigger>
            <TabsTrigger value='status'>Status</TabsTrigger>
            <TabsTrigger value='permission'>Security</TabsTrigger>
          </TabsList>
          <TabsContent value='info' className='mt-4'>
            <ProjectInfo form={form} />
          </TabsContent>
          <TabsContent value='type' className='mt-4'>
            <ProjectTypeMap form={form} />
          </TabsContent>
          <TabsContent value='status' className='mt-4'>
            <ProjectStatusEditor form={form} />
          </TabsContent>
          <TabsContent value='permission' className='mt-4'>
            <ProjectPermission form={form} />
          </TabsContent>
        </Tabs>

        <div className={cn('flex items-center justify-end gap-3 pt-4', 'border-t')}>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {(form.formState.isSubmitting && <Loader2 className='animate-spin' />) || <Plus />}
            {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
