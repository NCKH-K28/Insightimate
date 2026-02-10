import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MuilSelectors } from '@/features/agents/ui/selectors/muil-selectors';
import { queryOptions } from '@tanstack/react-query';
import { searchProjectsQueryOptions } from '@/features/project/api/actions';
import React from 'react';
import { ContextOption } from './contexts-bar';

type AddSourceButtonProps = {
  params: { workspaceId: string };
  sources: ContextOption[];
  onChange: (sources: ContextOption[]) => void;
  renderTrigger?: () => React.ReactNode;
};
export const AddSourceButton = (props: AddSourceButtonProps) => {
  const options = React.useMemo(() => {
    return props.sources.map((s) => ({ value: s.value, label: s.label }));
  }, [props.sources]);

  const onSelect = (selected: { value: string; label: string }[]) => {
    props.onChange(selected.map((s) => ({ type: 'project', value: s.value, label: s.label })));
  };

  const trigger = props.renderTrigger ? (
    props.renderTrigger()
  ) : (
    <Button variant='outline'>Add Source</Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add a new source</DialogTitle>
          <DialogDescription>
            Provide the necessary details to add a new source to your workspace.
          </DialogDescription>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='muil-selectors'>Select Projects</Label>
            <MuilSelectors
              selected={options}
              onChange={onSelect}
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
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
