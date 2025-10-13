import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ZTeamCreateInput } from '@/contracts/teams';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { createTeamMutationOptions } from '../../api/actionts';
import { toast } from 'sonner';

const ZFormData = ZTeamCreateInput;
type FormData = z.infer<typeof ZFormData>;

type CreateTeamFormProps = {
  params: { workspaceId: string };
  onSubmit?: (data: FormData) => void | Promise<void>;
};

export const CreateTeamForm = ({ params, onSubmit }: CreateTeamFormProps) => {
  const createTeam = useMutation(createTeamMutationOptions());

  const form = useForm<FormData>({
    resolver: zodResolver(ZFormData),
    defaultValues: {
      name: '',
      description: '',
      avatar: undefined,
      workspaceId: params.workspaceId,
      members: [],
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    if (onSubmit) onSubmit(data);
    return toast.promise(createTeam.mutateAsync(data), {
      loading: 'Creating team...',
      success: 'Team created successfully!',
      error: (err) => `Error creating team: ${err.message}`,
    }).unwrap()
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Team Name <span className='text-red-500'>*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder='Enter team name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Description</FormLabel>
              <FormControl>
                <Input placeholder='Enter team description' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Add Team Members</FormLabel>
          <FormControl>
            {/* <AddTeamMemberInput
              params={params}
              onSelect={(users) =>
                form.setValue(
                  'members',
                  users.map((u) => ({ userId: u.id })),
                  { shouldValidate: true },
                )
              }
            /> */}
          </FormControl>
          <FormMessage />
        </FormItem>
        <DialogFooter>
          <Button
            type='submit'
            className='cursor-pointer'
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting ? <LoaderCircle className='animate-spin' /> : null}
            {form.formState.isSubmitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
