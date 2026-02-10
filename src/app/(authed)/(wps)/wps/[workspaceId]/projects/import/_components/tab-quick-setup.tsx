'use client';

import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { ProjectImport } from '@/contracts/project';
import { ProjectIconSelect } from '@/features/project/ui/forms/project-icon-selecte';

export default function QuickSetupTab() {
  const form = useFormContext<ProjectImport>();

  return (
    <div className='flex flex-col gap-4'>
      <FormField
        control={form.control}
        name='avatar'
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <ProjectIconSelect
                disabled={field.disabled}
                value={field.value ?? undefined}
                onValueChange={(val) => field.onChange(val, { shouldDirty: true })}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 items-start'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Enter project name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='key'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input placeholder='Enter project key' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                className='max-h-24'
                placeholder='A brief description of your project'
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
