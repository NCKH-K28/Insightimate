import { EllipsisVertical, LogOut, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createAgentAnalysisMutationOptions,
  deleteSourceMutationOptions,
} from '@/features/agents/api/actions';

type SourceActionsProps = { agentId: string; id: string };
export const SourceActions = (props: SourceActionsProps) => {
  const analyzeSource = useMutation(createAgentAnalysisMutationOptions({ agentId: props.agentId }));

  const deleteSource = useMutation(
    deleteSourceMutationOptions({ agentId: props.agentId, sourceId: props.id }),
  );

  const handleAnalyze = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (analyzeSource.isPending) return;
    toast.promise(analyzeSource.mutateAsync({ dataSourceId: props.id, type: 'ESTIMATION' }), {
      loading: 'Analyzing source...',
      success: 'Source scheduled for analysis!',
      error: 'Failed to analyze source.',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteSource.isPending) return;
    toast.promise(deleteSource.mutateAsync({ sourceId: props.id }), {
      loading: 'Deleting source...',
      success: 'Source deleted successfully!',
      error: 'Failed to delete source.',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <EllipsisVertical className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleAnalyze}>
            <LogOut className='mr-2 h-4 w-4' />
            <span>Analyze</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <Trash2 className='mr-2 h-4 w-4' />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
