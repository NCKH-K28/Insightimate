/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { ProjectImport } from '@/contracts/projects';

export default function QuickSetupTab() {
  const form = useFormContext<ProjectImport>();

  return (
    <div className='flex flex-col gap-4'>
      <Image
        src={'https://placehold.co/100x100'}
        alt='Project Avatar'
        width={100}
        height={100}
        className='rounded-md'
        unoptimized
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 items-start'>
        <FormField
          control={form.control}
          name='project.name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder='My Project' {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='project.key'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Key</FormLabel>
              <FormControl>
                <Input placeholder='KEY' {...field} />
              </FormControl>
              <FormDescription>
                A unique identifier for your project, used in issue tracking.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='project.description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Description</FormLabel>
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
            <FormDescription>
              This description will help others understand the purpose of your project.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
