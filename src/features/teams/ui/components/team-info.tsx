import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { getTeamQueryOptions, updateTeamMutationOptions } from '@/features/teams/api/actionts';
import { TeamUpdateInput, ZTeamUpdateInput } from '@/contracts/teams';
import { Textarea } from '@/components/ui/textarea';

export const TeamInfo = (props: { teamId: string }) => {
  const { data: team } = useQuery(getTeamQueryOptions(props.teamId));
  const updateTeam = useMutation(updateTeamMutationOptions(props.teamId));

  const form = useForm<TeamUpdateInput>({
    resolver: zodResolver(ZTeamUpdateInput),
    mode: 'onChange',
    values: {
      id: team?.id || '',
      name: team?.name || '',
      description: team?.description || '',
    },
  });

  const handleSubmit = form.handleSubmit(async (data: TeamUpdateInput) => {
    await toast
      .promise(updateTeam.mutateAsync(data), {
        success: 'Team updated successfully',
        error: (err) => err?.message || 'Something went wrong',
      })
      .unwrap();

    form.reset(data);
  });

  return (
    <Card className='shadow-none'>
      <CardHeader>
        <CardTitle>Team Info</CardTitle>
        <CardDescription>Manage your team information</CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <CardContent className='grid gap-6'>
            <FormField
              name='name'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name='description'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Description' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className='flex justify-end'>
            <Button
              type='submit'
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
              className='cursor-pointer'
            >
              {form.formState.isSubmitting ? <LoaderCircle className='animate-spin' /> : null}
              {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

const TeamInfoWrapper = (props: { teamId: string }) => {
  return (
    <Suspense fallback={<div className='h-52 bg-gray-200 rounded animate-pulse' />}>
      <TeamInfo teamId={props.teamId} />
    </Suspense>
  );
};

export default TeamInfoWrapper;
