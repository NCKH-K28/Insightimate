import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZBoardIssueCreateInput } from '@/contracts/boards/boards.input';
import { mutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import z from 'zod';
import React, { useMemo } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { boardApi } from '@/features/boards/api/http';
import { CreateIssueForm } from '../forms/create-issue-form';
import { IssueType } from '../selectors/issue-type-selectors';

type FormData = z.infer<typeof ZBoardIssueCreateInput>;

type CreateIssueButtonProps = {
  params: { projectId: string; boardId: string; sprintId?: string };
  btnLabel?: string;
  btnClassName?: string;
  renderBtnLabel?: (open: () => void) => React.ReactNode;

  typeRequired?: boolean;
  typeFilterFn?: (type: IssueType, types: IssueType[]) => boolean;
  typeFetched?: (types: IssueType[], setValue: (value: string | null) => void) => void;
};
export const CreateIssueButton = ({
  params,
  btnLabel,
  btnClassName,
  renderBtnLabel,
  typeRequired,
  typeFilterFn,
  typeFetched,
}: CreateIssueButtonProps) => {
  const [open, setOpen] = React.useState(false);

  const queryClient = useQueryClient();
  const createMutationOptions = mutationOptions({
    mutationFn: (data: FormData) => boardApi.issues.create(params, { ...data, ...params }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', params.boardId, 'issues'] });
    },
  });

  const createIssue = useMutation(createMutationOptions);

  const LabelElm = useMemo(() => {
    if (renderBtnLabel) return renderBtnLabel(() => setOpen(true));
    else
      return (
        <Button variant='outline' size='sm' className='ml-2'>
          <PlusIcon className='h-4 w-4' />
          <span className='ml-1.5'>{btnLabel ? btnLabel : 'Create Issue'}</span>
        </Button>
      );
  }, [btnLabel, renderBtnLabel]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={btnClassName}>
        {LabelElm}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='space-y-3'>
          <DialogTitle className='text-2xl font-bold'>Create New Issue</DialogTitle>
          <DialogDescription className='text-base'>
            Fill in the details below to create a new issue for your project.
          </DialogDescription>
        </DialogHeader>
        <CreateIssueForm
          params={params}
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            const fetching = toast.promise(createIssue.mutateAsync(data), {
              loading: 'Creating issue...',
              success: 'Issue created successfully!',
              error: (e) => `Error creating issue: ${e.message || e}`,
            });
            await fetching.unwrap();
          }}
          typeRequired={typeRequired}
          typeFilterFn={typeFilterFn}
          typeFetched={typeFetched}
        />
      </DialogContent>
    </Dialog>
  );
};
