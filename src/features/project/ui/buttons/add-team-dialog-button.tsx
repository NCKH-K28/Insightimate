import {
  listProjectMembersQueryOptions,
  listProjectRolesQueryOptions,
} from '@/features/project/api/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { TeamsSelector } from '../../../teams/ui/selectors/teams-selector';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProjectActorAddInput, ZProjectActorAddInput } from '@/contracts/project';
import { Loader2 } from 'lucide-react';

export const ProjectRoleSelector = (props: {
  className?: string;
  params: { projectId: string };
  defaultRole?: { id: string; name: string };
  onSelect?: (role: { id: string; name: string } | null) => void;
}) => {
  const [selectRole, setSelectRole] = React.useState<{ id: string; name: string } | null>(
    props.defaultRole || null,
  );

  const { projectId: projId } = props.params;
  const { data: roles } = useQuery(listProjectRolesQueryOptions({ projId }));

  const handleValueChange = (value: string) => {
    const role = roles?.find((r) => r.id === value) || null;
    setSelectRole(role);
    props.onSelect?.(role);
  };

  return (
    <Select
      value={selectRole?.id}
      onValueChange={handleValueChange}
      disabled={!roles || roles.length === 0}
    >
      <SelectTrigger className={props.className}>
        <SelectValue placeholder='Select a role' />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {roles?.map((role) => (
            <SelectItem key={role.id} value={role.id}>
              {role.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
type AddTeamDialogButtonProps = {
  projectId: string;
  onAdd?: (data: ProjectActorAddInput) => void | Promise<void>;
};
export const AddTeamDialogButton = (props: AddTeamDialogButtonProps) => {
  const [open, setOpen] = React.useState(false);
  const { projectId } = props;

  const { data: actors } = useQuery(listProjectMembersQueryOptions({ projId: projectId }));
  const teams = actors?.filter((actor) => actor.type === 'TEAM') || [];

  const form = useForm({
    resolver: zodResolver(ZProjectActorAddInput),
    mode: 'onChange',
    defaultValues: {
      actorId: '',
      actorType: 'TEAM' as const,
      roleId: '',
      projectId,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await props.onAdd?.(data);
    form.reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm'>Add Team</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add Team to Project</DialogTitle>
              <DialogDescription>Select a team to add to this project.</DialogDescription>
            </DialogHeader>
            <div className='flex space-x-4 my-4'>
              <FormField
                name='actorId'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Team</FormLabel>
                    <FormControl>
                      <TeamsSelector
                        className='w-full'
                        excludeTeamIds={teams.map((t) => t.id)}
                        onSelect={(team) => {
                          field.onChange(team?.id || '');
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name='roleId'
                control={form.control}
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <ProjectRoleSelector
                        className='w-full'
                        params={{ projectId }}
                        onSelect={(role) => {
                          field.onChange(role?.id || '');
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type='button'>Close</Button>
              </DialogClose>

              <Button
                type='submit'
                disabled={form.formState.isValid === false || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {form.formState.isSubmitting ? 'Adding...' : 'Add Team'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
