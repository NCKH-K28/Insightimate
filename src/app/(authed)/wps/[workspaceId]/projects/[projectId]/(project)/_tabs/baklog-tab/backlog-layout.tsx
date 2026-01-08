import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrumBoard } from '@/features/boards/ui/components';
import { DataTableToolbar } from '@/components/table';
import { EpicsPanel } from '@/features/boards/ui/containers/scrum';

type BacklogLayoutProps = {
  table: any;
  tableConfig: any;
  rows: any[];
  params: { workspaceId: string; projectId: string; boardId: string };
};

const BacklogLayout = ({ table, tableConfig, rows, params }: BacklogLayoutProps) => {
  const [isEpicsPanelVisible, setIsEpicsPanelVisible] = useState(true);

  return (
    <div className={cn('w-full h-full flex flex-col bg-background')}>
      {/* Header Toolbar */}
      <header className='shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60'>
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
              <ScrumBoard rows={rows} className='h-full' />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
};

export default BacklogLayout;
