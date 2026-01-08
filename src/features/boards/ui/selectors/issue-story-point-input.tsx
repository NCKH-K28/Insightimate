import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBoardIssueQueryOptions, updateBoardIssueMutationOptions } from '../../api/actions';
import { Sparkles } from 'lucide-react';

type StoryPointInputProps = {
  params: { boardId: string; issueId: string; projectId: string };
};

type InsightEstimateProps = {
  value?: number | null;
  params: { boardId: string; issueId: string; projectId: string };
  onSuggest?: (value: number | null) => void;
};
const InsightEstimate = (_props: InsightEstimateProps) => {
  return (
    <Button size='sm' className='h-7'>
      <Sparkles className='size-3' />
      <span className='text-xs'>Insight</span>
    </Button>
  );
};

export const IssueStoryPointInput = ({ params }: StoryPointInputProps) => {
  const { data: storyPoints } = useSuspenseQuery({
    ...getBoardIssueQueryOptions(params),
    select: (data) => data?.storyPoints,
  });

  const updateIssue = useMutation(updateBoardIssueMutationOptions(params));

  const handleChange = (value: number | null) => {
    if (value === storyPoints) return;

    toast.promise(updateIssue.mutateAsync({ storyPoints: value }), {
      loading: 'Updating story points...',
      success: 'Story points updated successfully',
      error: 'Failed to update story points',
    });
  };

  const [localValue, setLocalValue] = useState<string>(storyPoints?.toString() ?? '');
  const [isFocused, setIsFocused] = useState(false);

  const presetValues = [1, 2, 3, 5, 8, 13];

  const handlePresetClick = (preset: number) => {
    setLocalValue(preset.toString());
    handleChange(preset);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = localValue === '' ? null : Number(localValue);
    handleChange(numValue);
  };

  return (
    <div className='space-y-2'>
      <div className='relative'>
        <Input
          type='number'
          placeholder='Enter estimate'
          min={0}
          step={1}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          disabled={updateIssue.isPending}
          className={cn(
            'pr-12 transition-all duration-200',
            isFocused && 'ring-2 ring-ring ring-offset-1',
          )}
          aria-label='Story point estimate'
        />
        {localValue && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2'>
            <Badge variant='secondary' className='text-xs font-mono'>
              {localValue} SP
            </Badge>
          </div>
        )}
      </div>

      {/* Quick select presets */}
      <div className='flex flex-wrap gap-1'>
        {presetValues.map((preset) => (
          <Button
            key={preset}
            type='button'
            variant={localValue === preset.toString() ? 'default' : 'outline'}
            size='sm'
            className={cn(
              'h-7 w-7 p-0 text-xs font-mono',
              localValue === preset.toString() && 'ring-2 ring-ring ring-offset-1',
            )}
            onClick={() => handlePresetClick(preset)}
          >
            {preset}
          </Button>
        ))}
        <InsightEstimate params={params} value={storyPoints} />
      </div>
    </div>
  );
};
