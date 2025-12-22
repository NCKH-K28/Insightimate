import * as React from 'react';
import { XIcon, Maximize2Icon, Minimize2Icon } from 'lucide-react';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenuButton } from '@/components/ui/sidebar';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import ChatBot from '@/features/agents/ui/insight-chat-v2';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const searchParamKey = 'rightbar';

function AppRightbar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams<{
    workspaceId: string;
    projectId?: string;
    agentId?: string;
    issueId?: string;
  }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!params) throw new Error('workspaceId is required');
  if (!searchParams) throw new Error('searchParams is undefined');
  if (!pathname) throw new Error('pathname is undefined');
  if (!router) throw new Error('router is undefined');

  const rightbar = React.useMemo(() => {
    const param = searchParams.get(searchParamKey);
    if (param === 'issue' || param === 'agent') return param;
    return null;
  }, [searchParams]);

  const isAgentOpen = rightbar === 'agent';

  const handleClose = () => {
    setIsExpanded(false);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete(searchParamKey);
    const search = newParams.toString();
    const href = search ? `${pathname}?${newParams.toString()}` : pathname;
    router.replace(href);
  };

  const handleExpand = () => {
    console.log('[AppRightbar] Expanding dialog');
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    console.log('[AppRightbar] Collapsing dialog');
    setIsExpanded(false);
  };

  // Issue details rightbar (not ChatBot)
  if (rightbar === 'issue') {
    return (
      <Sidebar
        collapsible='none'
        className='sticky top-0 hidden h-svh border-l lg:flex w-80'
        {...props}
      >
        <SidebarHeader className='w-full flex flex-row items-center justify-between gap-2'>
          <span className='text-lg font-medium'>Issue Details</span>
          <SidebarMenuButton onClick={handleClose} className='w-auto' title='Close'>
            <XIcon className='size-4' />
          </SidebarMenuButton>
        </SidebarHeader>
        <Separator />
        <SidebarContent>{/* Issue details content would go here */}</SidebarContent>
      </Sidebar>
    );
  }

  // Agent/Chat rightbar - with expand capability
  return (
    <>
      {/* Expanded Dialog Mode */}
      <Dialog open={isExpanded && isAgentOpen} onOpenChange={(open) => !open && handleCollapse()}>
        <DialogContent
          showCloseButton={false}
          className='max-w-4xl h-[85vh] flex flex-col p-0 gap-0'
        >
          <DialogHeader className='px-4 py-3 border-b shrink-0'>
            <div className='flex items-center justify-between'>
              <DialogTitle className='text-lg font-semibold'>Insight Chat</DialogTitle>
              <div className='flex items-center gap-1'>
                <button
                  onClick={handleCollapse}
                  className='p-2 hover:bg-muted rounded-md transition-colors'
                  title='Minimize'
                >
                  <Minimize2Icon className='size-4' />
                </button>
                <button
                  onClick={handleClose}
                  className='p-2 hover:bg-muted rounded-md transition-colors'
                  title='Close'
                >
                  <XIcon className='size-4' />
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className='flex-1 overflow-hidden'>
            <ChatBot />
          </div>
        </DialogContent>
      </Dialog>

      {/* Normal Sidebar Mode */}
      <Sidebar
        collapsible='none'
        className={cn(
          'sticky top-0 h-svh border-l lg:flex w-80 transition-all duration-200',
          (!isAgentOpen || isExpanded) && 'hidden',
        )}
        {...props}
      >
        <SidebarHeader className='w-full flex flex-row items-center justify-between gap-2'>
          <span className='text-lg font-medium'>Insight Chat</span>

          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={handleExpand}
              className='p-2 hover:bg-muted rounded-md transition-colors'
              title='Expand'
            >
              <Maximize2Icon className='size-4' />
            </button>
            <button
              type='button'
              onClick={handleClose}
              className='p-2 hover:bg-muted rounded-md transition-colors'
              title='Close'
            >
              <XIcon className='size-4' />
            </button>
          </div>
        </SidebarHeader>
        <Separator />
        <SidebarContent>
          <ChatBot />
        </SidebarContent>
      </Sidebar>
    </>
  );
}

export default AppRightbar;
