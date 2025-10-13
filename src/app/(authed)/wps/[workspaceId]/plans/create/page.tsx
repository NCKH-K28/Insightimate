'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import '@xyflow/react/dist/style.css';
import { useForm } from 'react-hook-form';

export default function PlanningPage() {
  const from = useForm<{ name: string; sources: string[] }>({
    defaultValues: { name: '', sources: [] },
    mode: 'onChange',
  });

  return (
    <section>
      <h1>Create a new plan</h1>
      <Form {...from}>
        <form className='w-80 space-y-2' onSubmit={from.handleSubmit((data) => console.log(data))}>
          <FormField
            control={from.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Plan Name <span className='text-red-500'>*</span>
                </FormLabel>
                <FormControl>
                  <Input placeholder='Enter plan name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={from.control}
            name='sources'
            render={({ field }) => (
              <div>
                <FormItem>
                  <FormLabel>
                    Data Sources <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='Enter data sources' {...field} />
                  </FormControl>
                  <FormMessage />

                  {/*  */}
                  <div>+ Add Source</div>
                </FormItem>
              </div>
            )}
          />

          <Button type='submit'>Create</Button>
        </form>
      </Form>
    </section>
  );
}
