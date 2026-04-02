import { useMutation, useQuery } from '@tanstack/react-query';

import {
  getBoardIssueQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { toast } from 'sonner';
import { getProjectQueryOptions } from '@/features/project/api/actions';
import { fieldToOption, IssueFieldSelectors } from './issue-field-selectors';
import { Skeleton } from '@/components/ui/skeleton';

type IssueResolutionSelectorProps = {
  params: { boardId: string; issueId: string; projectId: string };
  disabled?: boolean;
};

export const IssueResolutionSelector = ({ params, disabled }: IssueResolutionSelectorProps) => {
  const { data: value, isPending } = useQuery({
    ...getBoardIssueQueryOptions({ boardId: params.boardId, issueId: params.issueId }),
    select: (res) => res.resolution,
  });

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const noneOption = { value: null, label: 'None' };

  const handleUpdate = (data: { resolutionId?: string }) => {
    return toast.promise(updateIssue.mutateAsync(data), {
      loading: 'Updating resolution...',
      success: 'Resolution updated',
      error: (err) => `Error updating resolution: ${err.message}`,
    });
  };

  if (isPending) return <Skeleton className='h-8 w-full rounded-md' />;

  return (
    <IssueFieldSelectors
      value={value ? fieldToOption(value) : noneOption}
      disabled={disabled || updateIssue.isPending}
      onChange={(option) => {
        handleUpdate({ resolutionId: option.value ?? undefined });
      }}
      placeholder='Select resolution...'
      variant='ghost'
      extends={[noneOption]}
      fetchQueryOptions={() => ({
        ...getProjectQueryOptions(params),
        select: (res) => res.resolutions,
      })}
    />
  );
};
