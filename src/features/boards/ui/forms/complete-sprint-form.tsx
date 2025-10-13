import { useMutation, useQuery } from '@tanstack/react-query';
import {
  completeBoardSprintMutationOptions,
  getBoardQueryOptions,
  getBoardSprintIssuesQueryOptions,
} from '../../api/actions';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, CheckCircle2, CircleDashed, Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { get } from 'lodash';
import { IssueFieldSelectors } from '../selectors/issue-field-selectors';

type MoveOption = { label: string; value: string | null };
type CompleteSprintFormProps = {
  params: { boardId: string; sprintId: string };
  onComplete?: (moveToOption: string | null) => void;
  onCancel?: () => void;
};

export const CompleteSprintForm = (props: CompleteSprintFormProps) => {
  const [selectedOption, setSelectedOption] = React.useState<MoveOption | null>({
    label: 'New Sprint',
    value: 'to:new_sprint',
  });

  const completeSprint = useMutation(completeBoardSprintMutationOptions(props.params));

  // Fetch sprint details
  const { data: sprint, isLoading: isLoadingSprint } = useQuery(
    getBoardSprintIssuesQueryOptions(props.params),
  );

  // Fetch available sprints (active and future only)
  const { data: sprints } = useQuery({
    ...getBoardQueryOptions(props.params.boardId),
    select: (res) => res.sprints as { id: string; name: string }[], // FIXME: fetch only id and name
  });

  // Build sprint options for selector
  const sprintOptions = useMemo(() => {
    return sprints?.map((sprint) => ({
      label: sprint.name,
      value: `to:${sprint.id}`,
    }));
  }, [sprints]);

  // Build all move options
  const moveOptions = useMemo(() => {
    const options: MoveOption[] = [
      { label: 'Delete Issues', value: 'delete' },
      { label: 'Backlog', value: 'to:backlog' },
      { label: 'New Sprint', value: 'to:new_sprint' },
    ];
    if (sprintOptions) {
      options.push(...sprintOptions);
    }
    return options;
  }, [sprintOptions]);

  const handleComplete = async () => {
    if (!selectedOption) return;
    await completeSprint.mutateAsync({
      ...props.params,
      effect: selectedOption.value,
    });
    props.onComplete?.(selectedOption.value);
  };

  const metrics = useMemo(() => {
    const aggregations = get(sprint, '_aggregations.issues', {});
    const completed = get(aggregations, '_counts.completed', 0);
    const incompleted = get(aggregations, '_counts.incompleted', 0);
    const total = get(aggregations, '_counts.total', 0);

    const completedStoryPoints = get(aggregations, '_sums.storyPoints.completed', 0);
    const incompletedStoryPoints = get(aggregations, '_sums.storyPoints.incompleted', 0);

    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      incompleted,
      completionRate,
      completedStoryPoints,
      incompletedStoryPoints,
    };
  }, [sprint]);

  return (
    <div className='space-y-6'>
      {/* Sprint Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{sprint?.name}</CardTitle>
          <CardDescription>Review sprint completion before finalizing</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Progress Stats */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <CheckCircle2 className='h-4 w-4 text-green-600' />
                <span>Completed Issues</span>
              </div>
              <p className='text-2xl font-bold'>{metrics.completed}</p>
              <p className='text-xs text-muted-foreground'>
                {metrics.completedStoryPoints} story points
              </p>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <CircleDashed className='h-4 w-4 text-orange-600' />
                <span>Incomplete Issues</span>
              </div>
              <p className='text-2xl font-bold'>{metrics.incompleted}</p>
              <p className='text-xs text-muted-foreground'>
                {metrics.incompletedStoryPoints} story points
              </p>
            </div>
          </div>

          {/* Completion Rate */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Completion Rate</span>
              <span className='font-medium'>{metrics.completionRate}%</span>
            </div>
            <div className='h-2 w-full overflow-hidden rounded-full bg-secondary'>
              <div
                className={cn(
                  'h-full transition-all',
                  metrics.completionRate >= 80 ? 'bg-green-600' : 'bg-orange-600',
                )}
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incomplete Issues Action */}
      {metrics.incompleted > 0 && (
        <div className='space-y-3'>
          <Alert>
            <InfoIcon className='h-4 w-4' />
            <AlertDescription>
              You have {metrics.incompleted} incomplete issue(s). Choose where to move them:
            </AlertDescription>
          </Alert>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Move incomplete issues to</label>
            <IssueFieldSelectors
              extends={moveOptions}
              value={selectedOption}
              onChange={setSelectedOption}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex justify-end gap-3'>
        <Button
          type='button'
          variant='outline'
          onClick={props.onCancel}
          disabled={completeSprint.isPending}
        >
          Cancel
        </Button>
        <Button type='button' onClick={handleComplete} disabled={completeSprint.isPending}>
          {completeSprint.isPending && <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />}
          {completeSprint.isPending ? 'Completing...' : 'Complete Sprint'}
        </Button>
      </div>
    </div>
  );
};
