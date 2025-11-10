 

'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  FolderKanban,
  Calendar,
  BarChart3,
  Settings,
  Star,
  HomeIcon,
  Users2Icon,
  BotIcon,
  SearchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { useQuery } from '@tanstack/react-query';
import WorkspaceSwitcher from './workspace-switcher';
import NavUser from './nav-user';
import { SearchButton } from '@/features/query/ui/search-button';

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Params is undefined');
  const { workspaceId } = params;

  const fetchRecentPlans = useQuery({
    queryKey: ['plans', 'recent', workspaceId],
    queryFn: async () => {
      return [] as any[];
    },
  });

  const recentPlans = fetchRecentPlans.data;

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <SearchButton
                variant='ghost'
                className='flex justify-start'
                size='sm'
                renderTrigger={(props) => (
                  <Button variant='ghost' {...props}>
                    <SearchIcon />
                    <span>Search</span>
                  </Button>
                )}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/foryou`}>
                <HomeIcon />
                <span>For You</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/agents`}>
                <BotIcon />
                <span>Agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/settings`}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/teams`}>
                <Users2Icon />
                <span>Teams</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className='opacity-50 pointer-events-none'>
            <SidebarMenuButton asChild disabled={true}>
              <Link href={`/wps/${workspaceId}/reports`}>
                <BarChart3 />
                <span>Reports</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className='opacity-50 pointer-events-none'>
            <SidebarMenuButton asChild disabled={true}>
              <Link href={`/wps/${workspaceId}/starred`}>
                <Star />
                <span>Starred</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label='Recent'
          items={[
            {
              title: 'Projects',
              url: `/wps/${workspaceId}/projects`,
              icon: FolderKanban,
            },
            {
              title: 'Plans',
              url: `/wps/${workspaceId}/plans`,
              icon: Calendar,
              disabled: true,
              items: recentPlans?.map((plan) => ({
                title: plan.title,
                url: `/wps/${workspaceId}/plans/${plan.id}`,
              })),
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
