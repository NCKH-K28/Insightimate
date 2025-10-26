import { EllipsisVertical, LogOut, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type SourceActionsProps = { agentId: string; id: string };
export const SourceActions = (props: SourceActionsProps) => {
  const queryClient = useQueryClient();
  const analyzeSource = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/v2/agents/${props.agentId}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: props.id }),
      });
      if (!response.ok) throw new Error('Failed to analyze source');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-analyses', props.agentId] });
    },
  });

  const deleteSource = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/v2/agents/${props.agentId}/sources/${props.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete source');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-sources', props.agentId] });
    },
  });

  const handleAnalyze = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (analyzeSource.isPending) return;
    toast.promise(analyzeSource.mutateAsync(), {
      loading: 'Analyzing source...',
      success: 'Source scheduled for analysis!',
      error: 'Failed to analyze source.',
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteSource.isPending) return;
    toast.promise(deleteSource.mutateAsync(), {
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
