import React from 'react';
import { ProfileHeader } from './_components/profile-header';
import { ProfileSidebar } from './_components/profile-sidebar';
import { ActivityStream } from './_components/activity-stream';
import { ConnectionsCard } from './_components/connections-card';
import { TeamsCard } from './_components/teams-card';
import { ProjectsTable } from './_components/projects-table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function Page() {
  return (
    <div className='container mx-auto flex flex-col gap-2 py-2'>
      <ProfileHeader />

      {/* Tabs Navigation */}
      <Tabs defaultValue='profile' className='w-full rounded-none'>
        <TabsList className='rounded-none bg-transparent h-12 p-0 space-x-6 w-full justify-start overflow-x-auto'>
          <TabsTrigger
            value='profile'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-2 font-medium'
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value='teams'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground'
          >
            Teams
          </TabsTrigger>
          <TabsTrigger
            value='projects'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground gap-2'
          >
            Projects
            <Badge variant='secondary' className='h-5 px-1.5 rounded-full text-[10px]'>
              3
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value='connections'
            className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground'
          >
            Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value='profile'
          className='space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300'
        >
          {/* Main Grid: Left Details + Right Activity */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-1'>
              <ProfileSidebar />
            </div>
            <div className='lg:col-span-2'>
              <ActivityStream />
            </div>
          </div>

          {/* Secondary Grid: Connections + Teams */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <ConnectionsCard />
            <TeamsCard />
          </div>

          {/* Bottom Row: Projects */}
          <div className='w-full'>
            <ProjectsTable />
          </div>
        </TabsContent>

        {/* Placeholders for other tabs */}
        <TabsContent value='teams'>
          <div className='p-8 text-center text-muted-foreground border border-dashed rounded-lg'>
            Teams Content Placeholder
          </div>
        </TabsContent>
        <TabsContent value='projects'>
          <div className='p-8 text-center text-muted-foreground border border-dashed rounded-lg'>
            Projects Content Placeholder
          </div>
        </TabsContent>
        <TabsContent value='connections'>
          <div className='p-8 text-center text-muted-foreground border border-dashed rounded-lg'>
            Connections Content Placeholder
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
