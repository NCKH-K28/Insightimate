import { createBoardSprintMutationOptions } from '@/features/boards/api/actions';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { CreateIssueButton } from '../buttons/create-issue-btn';
import { cn } from '@/lib/utils/cn';

export type RowBacklogProps = {
  id: string; // row id
  name: string; // row name
  params: { boardId: string; projectId: string };
  collapsed: boolean;
  toggle: () => void;
};
export const RowBacklog = ({ id, params, collapsed, toggle }: RowBacklogProps) => {
  const createSprint = useMutation(createBoardSprintMutationOptions(params.boardId));

  const handleCreateSprint = () => {
    toast.promise(createSprint.mutateAsync({}), {
      loading: 'Creating sprint...',
      success: 'Sprint created successfully',
      error: (e) => `Failed to create sprint: ${e.message || e}`,
    });
  };

  const items = []; // Replace with actual items logic

  return (
    <div className='w-full flex items-center justify-between'>
      <Button
        size='icon'
        type='button'
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={`row-items-${id}`}
        variant='ghost'
      >
        <ChevronRight className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-90')} />
      </Button>
      <div className='w-full text-sm font-semibold'>
        <span>Backlog</span>
        <span className='text-xs text-gray-500'>({items.length} issues)</span>
      </div>
      <div className='flex items-center gap-2'>
        <Button variant='outline' size='sm' onClick={handleCreateSprint}>
          Create Sprint
        </Button>
        <CreateIssueButton
          params={params}
          typeRequired={true}
          typeFilterFn={(t) => t.hierarchy == 1}
          typeFetched={(types, setType) => {
            const defaultType = types.find((t) => t.hierarchy === 1);
            if (defaultType) setType(defaultType.id);
          }}
        />
        <Button variant='ghost' size='sm' disabled>
          <MoreHorizontal />
        </Button>
      </div>
    </div>
  );
};
