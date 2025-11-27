import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeft, Maximize2, Minimize2, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrumBoard } from '@/features/boards/ui/components';
import EpicsPanel from '@/features/boards/ui/components/scrum-epic-panel';
import { DataTableToolbar } from '@/components/table';

type BoardLayoutProps = {
  table: any;
  tableConfig: any;
  rows: any[];
  params: { workspaceId: string; projectId: string; boardId: string };
};

const BoardLayout = ({ table, tableConfig, rows, params }: BoardLayoutProps) => {
  const [isEpicsPanelVisible, setIsEpicsPanelVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className={cn(
        // 'w-full h-[calc(100vh-4rem)] flex flex-col bg-background',
        // isFullscreen && 'h-screen',
        'w-full h-full flex flex-col bg-background',
      )}
    >
      {/* Header Toolbar */}
      <header className='flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='flex items-center justify-between px-4 py-2'>
          {/* Left Section - Panel Toggle & Title */}
          <div className='flex items-center gap-3'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => setIsEpicsPanelVisible(!isEpicsPanelVisible)}
                  >
                    {isEpicsPanelVisible ? (
                      <PanelLeftClose className='h-4 w-4' />
                    ) : (
                      <PanelLeft className='h-4 w-4' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side='bottom'>
                  {isEpicsPanelVisible ? 'Hide Epics Panel' : 'Show Epics Panel'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation='vertical' className='h-6' />

            <h1 className='text-lg font-semibold'>Sprint Board</h1>
          </div>

          {/* Center Section - Data Table Toolbar */}
          <div className='flex-1 max-w-3xl mx-4'>
            <DataTableToolbar table={table} config={tableConfig} />
          </div>

          {/* Right Section - View Controls */}
          <div className='flex items-center gap-2'>
            {/* View Mode Toggle */}
            <div className='flex items-center rounded-lg border bg-muted p-1'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                      size='icon'
                      className='h-7 w-7'
                      onClick={() => setViewMode('board')}
                    >
                      <LayoutGrid className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Board View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size='icon'
                      className='h-7 w-7'
                      onClick={() => setViewMode('list')}
                    >
                      <List className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Separator orientation='vertical' className='h-6' />

            {/* Fullscreen Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8'
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? (
                      <Minimize2 className='h-4 w-4' />
                    ) : (
                      <Maximize2 className='h-4 w-4' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 overflow-hidden'>
        <ResizablePanelGroup direction='horizontal' className='h-full'>
          {/* Epics Panel */}
          {isEpicsPanelVisible && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className='bg-muted/30'>
                <EpicsPanel className='h-full' params={params} />
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className='bg-border hover:bg-primary/20 transition-colors'
              />
            </>
          )}

          {/* Scrum Board */}
          <ResizablePanel defaultSize={isEpicsPanelVisible ? 80 : 100}>
            <div className='h-full overflow-auto p-4'>
              {viewMode === 'board' ? (
                <ScrumBoard rows={rows} className='h-full' />
              ) : (
                <div className='h-full'>
                  {/* List view placeholder */}
                  <div className='rounded-lg border bg-card'>
                    <table className='w-full'>{/* Add your table implementation here */}</table>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default BoardLayout;
