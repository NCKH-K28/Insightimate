'use client';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ProjectIconSelect } from './project-icon-selecte';
// import { useForm } from 'react-hook-form';
// import { ProjectCreateInput } from '@/contracts/projects';

function genKeyFromName(name: string): string {
  if (name.length === 0) return '';

  let parts = name.split(' ');
  if (parts.length === 1) parts = name.split(/(?=[A-Z])/);
  if (parts.length === 1) parts = name.split('-');
  if (parts.length === 1) parts = name.split('_');
  if (parts.length === 1) parts = name.split('.');

  const key = parts
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, Math.min(5, parts.length));
  return key;
}

type ProjectInfoProps = {
  form: any; // FIXME: useForm<ProjectCreateInput>;
  disableds?: { name?: boolean; key?: boolean; description?: boolean; avatar?: boolean };
};

export const ProjectInfo = (props: ProjectInfoProps) => {
  const { form } = props;
  return (
    <div className={cn('grid grid-cols-1 gap-2', 'place-items-stretch')}>
      <FormField
        control={form.control}
        name='avatar'
        disabled={props?.disableds?.avatar}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <ProjectIconSelect
                disabled={field.disabled}
                value={field.value}
                onValueChange={(val) => {
                  field.onChange(val, { shouldTouch: true, shouldValidate: true });
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
          'place-items-stretch items-start',
        )}
      >
        <FormField
          disabled={props?.disableds?.name}
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm sm:text-base'>
                Project Name <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder='Enter project name'
                  className='h-10 sm:h-11'
                  {...field}
                  onBlur={() => {
                    field.onBlur();

                    // ====
                    const pName = field.value;
                    if (pName === '') return;
                    // const key = form.getValues('key');
                    // if (key && key !== '') return;

                    const pKey = genKeyFromName(pName);
                    form.setValue('key', pKey, { shouldTouch: true, shouldValidate: true });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          disabled={props?.disableds?.key}
          name='key'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm sm:text-base'>
                Project Key <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='Key' className='h-10 sm:h-11' maxLength={10} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        disabled={props?.disableds?.description}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-sm sm:text-base'>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Enter project description'
                className='max-h-24 resize-none'
                {...field}
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
