'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ProjectListView = 'table' | 'grid';

interface ProjectListViewToggleProps {
  view: ProjectListView;
  onViewChange: (view: ProjectListView) => void;
}

export function ProjectListViewToggle({ view, onViewChange }: ProjectListViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 p-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 rounded-md',
              view === 'grid' && 'bg-background shadow-sm text-foreground',
              view !== 'grid' && 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onViewChange('grid')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Grid view</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 rounded-md',
              view === 'table' && 'bg-background shadow-sm text-foreground',
              view !== 'table' && 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onViewChange('table')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Table view</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
