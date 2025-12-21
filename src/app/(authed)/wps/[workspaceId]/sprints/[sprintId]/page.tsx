'use client';

import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Loader2, Plus, Eye, LayoutGrid, BarChart3 } from 'lucide-react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { IssueTypeIcon, PriorityIcon, UserAvatar } from './components/board-view/helper-components';
import SprintHeader from './components/sprint-header';
import { mockIssueTypes, mockPriorities, mockUsers } from './mock-data';
import BoardTab from './tabs/board-tab';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SprintSummaryTab from './tabs/summary-tab';
import { behindScheduleSprintProps } from './mock-data-2';
import SprintReportsTab from './tabs/reports-tab';
import { sampleSprintReportsProps } from './mock-data-3';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/_client';
import { BoardIssueList, SprintItem } from '@/contracts/boards/boards.query';
import ListTab from './tabs/list-tab';
import KanbanTabV3 from './tabs/kanban-tab';

function CreateIssueDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    summary: string;
    description: string;
    type?: string;
    priority?: string;
    assignee?: string;
    storyPoints?: string;
  }>({
    summary: '',
    description: '',
    type: 'task',
    priority: 'medium',
    assignee: 'unassigned',
    storyPoints: 'none',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success('Issue created successfully');

    setIsSubmitting(false);
    onClose();
    setFormData({
      summary: '',
      description: '',
      type: 'task',
      priority: 'medium',
      assignee: 'unassigned',
      storyPoints: 'none',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create Issue</DialogTitle>
          <DialogDescription>Add a new issue to this sprint</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='summary'>Summary *</Label>
            <Input
              id='summary'
              placeholder='Enter issue summary'
              value={formData.summary}
              onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Enter issue description'
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='type'>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger id='type'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockIssueTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className='flex items-center gap-2'>
                        <IssueTypeIcon type={type} />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger id='priority'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockPriorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      <div className='flex items-center gap-2'>
                        <PriorityIcon priority={priority} />
                        {priority.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='assignee'>Assignee</Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, assignee: value }))}
              >
                <SelectTrigger id='assignee'>
                  <SelectValue placeholder='Unassigned' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='unassigned'>Unassigned</SelectItem>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className='flex items-center gap-2'>
                        <UserAvatar user={user} size='sm' showTooltip={false} />
                        {user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='storyPoints'>Story Points</Label>
              <Select
                value={formData.storyPoints}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, storyPoints: value }))}
              >
                <SelectTrigger id='storyPoints'>
                  <SelectValue placeholder='None' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>None</SelectItem>
                  {[1, 2, 3, 5, 8, 13, 21].map((points) => (
                    <SelectItem key={points} value={points.toString()}>
                      {points}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={!formData.summary || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Issue
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SprintPage() {
  const searchparams = useSearchParams();
  if (!searchparams) throw new Error('Search params are undefined');
  const params = useParams<{ workspaceId: string; sprintId: string }>();
  if (!params) throw new Error('Params are undefined');
  const router = useRouter();
  const pathname = usePathname();

  const { data: sprint } = useSuspenseQuery({
    queryKey: ['sprints', params.sprintId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/v2/sprints/${params.sprintId}`);
      const data = res.data;
      return data as SprintItem;
    },
  });

  const { data: issues } = useQuery({
    queryKey: ['issues', params.sprintId],
    queryFn: async () => {
      const path = `/v2/sprints/${params.sprintId}/issues`;
      const response = await axiosInstance.get(path);
      const data = response.data as BoardIssueList;
      return data.data;
    },
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const tab = searchparams.get('tab');
    if (tab === 'board' || tab === 'reports' || tab === 'list') return tab;
    return 'summary';
  });

  const handleTabChange = (tab: string) => {
    const searchParams = new URLSearchParams(searchparams.toString());
    searchParams.set('tab', tab);
    const queryString = searchParams.toString();
    router.replace(`${pathname}?${queryString}`);
    setActiveTab(tab);
  };

  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className='flex flex-col gap-2'>
        <SprintHeader params={params} />

        <Separator />

        <Tabs value={activeTab} onValueChange={handleTabChange} className='flex-1 flex flex-col'>
          <TabsList>
            <TabsTrigger value='summary'>
              <Eye className='h-4 w-4' />
              <span className='hidden sm:inline'>Summary</span>
            </TabsTrigger>

            <TabsTrigger value='board'>
              <LayoutGrid className='h-4 w-4' />
              <span className='hidden sm:inline'>Board</span>
            </TabsTrigger>

            <TabsTrigger value='list'>
              <LayoutGrid className='h-4 w-4' />
              <span className='hidden sm:inline'>List</span>
            </TabsTrigger>

            <TabsTrigger value='reports'>
              <BarChart3 className='h-4 w-4' />
              <span className='hidden sm:inline'>Reports</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value='summary' className='flex-1'>
            <SprintSummaryTab {...behindScheduleSprintProps} sprint={sprint} />
          </TabsContent>

          <TabsContent value='board' className='flex-1 flex flex-col overflow-hidden'>
            <div className='flex-1 overflow-auto'>
              <KanbanTabV3
                params={{
                  workspaceId: params.workspaceId,
                  boardId: sprint.boardId,
                  projectId: sprint.projectId,
                }}
                issues={issues ?? []}
              />
            </div>
          </TabsContent>

          <TabsContent value='reports' className='flex-1 '>
            <SprintReportsTab {...sampleSprintReportsProps} />
          </TabsContent>

          <TabsContent value='list' className='flex-1 flex flex-col'>
            <ListTab sprint={sprint} issues={issues ?? []} />
          </TabsContent>
        </Tabs>
      </div>

      <CreateIssueDialog isOpen={isCreateIssueOpen} onClose={() => setIsCreateIssueOpen(false)} />
    </TooltipProvider>
  );
}
