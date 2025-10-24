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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AIFilesInput from '../inputs/ai-files-input';
import { MuilSelectors } from '@/features/agents/ui/selectors/muil-selectors';
import { queryOptions, useMutation } from '@tanstack/react-query';
import { searchProjectsQueryOptions } from '@/features/projects/api/actions';

type AddFileFormProps = { params: { agentId: string; workspaceId: string } };

type AddSourceButtonProps = { params: { agentId: string; workspaceId: string } };
export const AddSourceButton = (props: AddSourceButtonProps) => {
  const addProject = useMutation({});

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Add Source</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add a new source</DialogTitle>
          <DialogDescription>
            Provide the necessary details to add a new source to your workspace.
          </DialogDescription>
          <div className='grid gap-4 py-4'>
            <AIFilesInput />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='muil-selectors'>Select Projects</Label>
            <MuilSelectors
              onChange={(selected) => {}}
              inputProps={{ placeholder: 'Search sources...' }}
              className='w-full h-32 border'
              searchQueryOptions={(q) => {
                const filter = { q, workspaceId: props.params.workspaceId };
                return queryOptions({
                  ...searchProjectsQueryOptions({ filter }),
                  select: ({ data }) => {
                    return data.map((project) => ({ value: project.id, label: project.name }));
                  },
                });
              }}
            />
          </div>
          <div className={'flex w-full justify-end border-t'}>
            <Button className='mt-4'>Add Source</Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
