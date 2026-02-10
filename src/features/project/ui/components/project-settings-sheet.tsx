import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from './general-settings';
import { MemberSettings } from './member-settings';
import { PermissionSettings } from './permission-settings';
import { SettingsIcon } from 'lucide-react';
import { StatusSettings } from './status-settings';
import { WorkTypeSettings } from './worktype-settings';

type ProjectSettingsSheetProps = { params: { projectId: string } };
export function ProjectSettingsSheet(props: ProjectSettingsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='outline' size='icon' type='button'>
          <SettingsIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className='w-screen sm:max-w-none p-0' side='left'>
        <SheetHeader className='px-6 py-4 border-b'>
          <SheetTitle>Project Settings</SheetTitle>
          <SheetDescription>
            Manage your project settings, members, and permissions.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue='general' className='flex flex-col px-6'>
          <TabsList>
            <TabsTrigger value='general'>General</TabsTrigger>
            <TabsTrigger value='members'>Members</TabsTrigger>
            <TabsTrigger value='permissions'>Permissions</TabsTrigger>
            <TabsTrigger value='statuses'>Statuses</TabsTrigger>
            <TabsTrigger value='worktypes'>Work Types</TabsTrigger>
          </TabsList>

          <div className='flex-1 overflow-y-auto mt-2'>
            <TabsContent value='general'>
              <GeneralSettings projectId={props.params.projectId} />
            </TabsContent>
            <TabsContent value='members'>
              <MemberSettings projectId={props.params.projectId} />
            </TabsContent>
            <TabsContent value='permissions'>
              <PermissionSettings projectId={props.params.projectId} />
            </TabsContent>
            <TabsContent value='statuses'>
              <StatusSettings projectId={props.params.projectId} />
            </TabsContent>
            <TabsContent value='worktypes'>
              <WorkTypeSettings projectId={props.params.projectId} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
