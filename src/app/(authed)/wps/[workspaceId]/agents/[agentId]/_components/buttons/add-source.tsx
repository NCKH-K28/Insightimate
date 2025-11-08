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
import { createSourceMutationOptions } from '@/features/agents/api/actions';
import { toast } from 'sonner';
import React from 'react';

type AddFileFormProps = { params: { agentId: string; workspaceId: string } };

type AddSourceButtonProps = { params: { agentId: string; workspaceId: string } };
export const AddSourceButton = (props: AddSourceButtonProps) => {
  const [selectedP, setSelectedP] = React.useState<{ value: string; label: string }[]>([]);
  const [toastRef, setToastRef] = React.useState<ReturnType<typeof toast.promise> | null>(null);

  const addSource = useMutation(createSourceMutationOptions(props.params));

  const handleAddSource = () => {
    if (selectedP.length === 0) return;
    if (toastRef) return;
    const newSources = selectedP.map((s) => ({
      sourceType: 'PROJECT' as const,
      sourceId: s.value,
    }));
    setSelectedP([]);
    const toastId = toast.promise(
      Promise.all(newSources.map((source) => addSource.mutateAsync(source))),
      {
        loading: 'Adding sources...',
        success: 'Sources added successfully!',
        error: 'Failed to add sources.',
      },
    );
    setToastRef(toastId);
    toastId.unwrap().finally(() => setToastRef(null));
  };

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
            <AIFilesInput params={props.params} />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='muil-selectors'>Select Projects</Label>
            <MuilSelectors
              selected={selectedP}
              onChange={setSelectedP}
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
            <Button className='mt-4' onClick={handleAddSource}>
              Add Source
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
