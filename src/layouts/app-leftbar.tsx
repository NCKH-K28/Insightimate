'use client';

import React from 'react';
import Link from 'next/link';
import { redirect, useParams } from 'next/navigation';
import {
  FolderKanban,
  Calendar,
  BarChart3,
  Settings,
  Star,
  HomeIcon,
  Users2Icon,
  BotIcon,
} from 'lucide-react';
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
import NavUser from './nav-user';
import { OrgItem } from '@/contracts/organization/organization.query';
import OrgSwitcher from './org-switcher';
import { Separator } from '@/components/ui/separator';
import { listOrgsQueryOptions } from '@/features/organization/api/actions';

type AppLeftbarProps = React.ComponentProps<typeof Sidebar> & { org: OrgItem };
const AppLeftbar: React.FC<AppLeftbarProps> = (props) => {
  const params = useParams<{ orgSlug: string }>();
  if (!params) throw new Error('Params is undefined');
  const { orgSlug } = params;

  const fetchOrgs = useQuery({
    ...listOrgsQueryOptions(),
    initialData: [],
    enabled: false,
  });

  const fetchRecentPlans = useQuery({
    queryKey: ['plans', 'recent', orgSlug],
    queryFn: async () => {
      return [] as any[];
    },
  });

  const recentPlans = fetchRecentPlans.data;

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <OrgSwitcher
          org={props.org}
          onSelect={(org) => redirect(`/o/${org.slug}`)}
          onAddOrg={() => redirect('/orgs')}
          fetchOrgs={async () => {
            const { data: orgs } = await fetchOrgs.refetch();
            return orgs ?? [];
          }}
        />

        <Separator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}`}>
                <HomeIcon />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/agents`}>
                <BotIcon />
                <span>Agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/settings`}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/teams`}>
                <Users2Icon />
                <span>Teams</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className='opacity-50 pointer-events-none'>
            <SidebarMenuButton disabled={true}>
              <BarChart3 />
              <span>Reports</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/starred`}>
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
              url: `/o/${orgSlug}/projs`,
              icon: FolderKanban,
            },
            {
              title: 'Plans',
              url: `/o/${orgSlug}/plans`,
              icon: Calendar,
              disabled: true,
              items: recentPlans?.map((plan) => ({
                title: plan.title,
                url: `/o/${orgSlug}/plans/${plan.id}`,
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
};

export default AppLeftbar;
