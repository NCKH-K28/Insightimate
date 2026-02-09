import * as React from 'react';
import { XIcon, Maximize2Icon, Minimize2Icon } from 'lucide-react';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenuButton } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
// import ChatBot from '@/features/agents/ui/insight-chat-v2'; FIXME: lỗi worksacpe
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  usePathnameRequired,
  useRouterRequired,
  useSearchParamsRequired,
} from '@/hooks/next-navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';

const searchParamKey = 'rightbar';
function AppRightbar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParamsRequired();
  const pathname = usePathnameRequired();
  const router = useRouterRequired();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const rightbar = React.useMemo(() => {
    const param = searchParams.get(searchParamKey);
    if (param === 'issue' || param === 'agent') return param;
    return null;
  }, [searchParams]);

  const isAgentOpen = rightbar === 'agent';
  // const agentBarMode: 'dialog' | 'sidebar' = 'dialog';

  const handleClose = () => {
    setIsExpanded(false);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete(searchParamKey);
    const search = newParams.toString();
    const href = search ? `${pathname}?${newParams.toString()}` : pathname;
    router.replace(href);
  };

  const handleExpand = () => setIsExpanded(true);
  const handleCollapse = () => setIsExpanded(false);

  const chatbotElm = React.useMemo(() => <></>, []);

  return (
    <>
      <Dialog open={isExpanded} onOpenChange={(open) => !open && handleCollapse()}>
        <DialogContent
          showCloseButton={false}
          className='max-w-4xl h-[85vh] flex flex-col p-0 gap-0'
        >
          <DialogHeader className='px-4 py-3 border-b shrink-0'>
            <div className='flex items-center justify-between'>
              <DialogTitle className='text-lg font-semibold'>Insight Chat</DialogTitle>
              <div className='flex items-center gap-1'>
                <Button variant='ghost' size='icon' onClick={handleCollapse} title='Minimize'>
                  <Minimize2Icon className='size-4' />
                </Button>
                <Button variant='ghost' size='icon' onClick={handleClose} title='Close'>
                  <XIcon className='size-4' />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className='flex-1 overflow-hidden'>{chatbotElm}</div>
        </DialogContent>
      </Dialog>

      <Sidebar
        hidden={!isAgentOpen || isExpanded}
        collapsible='none'
        className={cn('sticky top-0 h-svh border-l lg:flex w-80 transition-all duration-200')}
        {...props}
      >
        <Tabs value={rightbar ?? 'agent'} className='size-full'>
          <TabsContent value='agent'>
            <SidebarHeader className='w-full flex flex-row items-center justify-between gap-2'>
              <span className='text-lg font-medium'>Insight Chat</span>

              <div className='flex items-center gap-1'>
                <Button variant='ghost' size='icon' onClick={handleExpand} title='Expand'>
                  <Maximize2Icon className='size-4' />
                </Button>
                <Button variant='ghost' size='icon' onClick={handleClose} title='Close'>
                  <XIcon className='size-4' />
                </Button>
              </div>
            </SidebarHeader>
            <Separator />
            <SidebarContent>{chatbotElm}</SidebarContent>
          </TabsContent>

          <TabsContent value='issue'>
            <SidebarHeader className='w-full flex flex-row items-center justify-between gap-2'>
              <span className='text-lg font-medium'>Issue Details</span>
              <SidebarMenuButton onClick={handleClose} className='w-auto' title='Close'>
                <XIcon className='size-4' />
              </SidebarMenuButton>
            </SidebarHeader>
            <Separator />
            <SidebarContent>{/* Issue details content would go here */}</SidebarContent>
          </TabsContent>
        </Tabs>
      </Sidebar>
    </>
  );
}

export default AppRightbar;
