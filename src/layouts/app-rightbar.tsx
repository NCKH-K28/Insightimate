import * as React from 'react';
import { XIcon } from 'lucide-react';

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenuButton } from '@/components/ui/sidebar';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { InsightChatForm } from '@/features/agents/ui/forms/insight-chat-form';

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
  if (!params) throw new Error('workspaceId is required');
  if (!searchParams) throw new Error('searchParams is undefined');
  if (!pathname) throw new Error('pathname is undefined');
  if (!router) throw new Error('router is undefined');

  const rightbar = React.useMemo(() => {
    const param = searchParams.get(searchParamKey);
    if (param === 'issue' || param === 'agent') return param;

    return null;
    // return 'agent';
  }, [searchParams]);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(searchParamKey);
    const search = params.toString();
    const href = search ? `${pathname}?${params.toString()}` : pathname;
    router.replace(href);
  };

  if (!rightbar) return null;
  return (
    <Sidebar
      collapsible='none'
      className='sticky top-0 hidden h-svh border-l lg:flex w-80'
      {...props}
    >
      <SidebarHeader className='w-full flex flex-row items-center justify-between gap-2'>
        <span className='text-lg font-medium'>
          {rightbar === 'issue' ? 'Issue Details' : 'Agent Details'}
        </span>

        <SidebarMenuButton onClick={handleClose} className='w-auto'>
          <XIcon />
        </SidebarMenuButton>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <InsightChatForm />
      </SidebarContent>
    </Sidebar>
  );
}

export default AppRightbar;
