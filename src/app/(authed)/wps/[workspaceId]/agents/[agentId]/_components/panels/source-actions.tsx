import { EllipsisVertical, LogOut, MoreHorizontal, Trash2, UsersIcon } from 'lucide-react';
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

type SourceActionsProps = { id: string };
export const SourceActions = (props: SourceActionsProps) => {
  const analyzeSource = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/v2/ai/agents/${props.id}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: props.id }),
      });
      if (!response.ok) throw new Error('Failed to analyze source');
      return response.json();
    },
  });

  const handleAnalyze = () => {
    if (analyzeSource.isPending) return;
    toast.promise(analyzeSource.mutateAsync(), {
      loading: 'Analyzing source...',
      success: 'Source analyzed successfully!',
      error: 'Failed to analyze source.',
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
            <span>Analyze Source</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MoreHorizontal className='mr-2 h-4 w-4' />
            <span>Edit Source</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Trash2 className='mr-2 h-4 w-4' />
            <span>Delete Source</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
