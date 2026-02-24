/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
} from '@/features/boards/hooks/grantt';
import groupBy from 'lodash/groupBy';
import { EyeIcon, LinkIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  listBoardIssuesQueryOptions,
  updateBoardIssueMutationOptions,
} from '@/features/boards/api/actions';
import { format } from 'date-fns';

type IssueField = { id: string; name: string; iconURL?: string | null; color?: string | null };
type IssueType = {
  id: string;
  summary: string;
  description: string | null;
  startAt: Date | null;
  endAt: Date | null;
  status?: IssueField | null;
  priority?: IssueField | null;
  assignee?: { id: string; name: string; avatar: string } | null;
  reporter?: { id: string; name: string; avatar: string } | null;
  group?: { id: string; name: string } | null;
};

type GanttTabProps = { params: { boardId: string; projId: string } };

export function GanttTab({ params }: GanttTabProps) {
  const { boardId } = params;

  const [features, setFeatures] = useState<IssueType[]>([]);
  const groupedFeatures = groupBy(features, 'group.name');
  const sortedGroupedFeatures = Object.fromEntries(
    Object.entries(groupedFeatures).sort(([nameA], [nameB]) => nameA.localeCompare(nameB)),
  );

  const updateIssue = useMutation(updateBoardIssueMutationOptions({ boardId, issueId: '' }));

  const { data: boardIssues } = useQuery({
    ...listBoardIssuesQueryOptions(boardId, { include: ['sprint'] }),
    refetchOnWindowFocus: true,
  });

  const handleUpdateIssuesDates = () => {
    const updates: { id: string; startDate: string | null; dueDate: string | null }[] = [];
    features.forEach((feature) => {
      const boardIssue = boardIssues?.find((issue) => issue.id === feature.id);
      if (!boardIssue) return;
      const rawStartDate = feature.startAt ? format(feature.startAt, 'yyyy-MM-dd') : null;
      const rawDueDate = feature.endAt ? format(feature.endAt, 'yyyy-MM-dd') : null;
      const targetStartDate = boardIssue.startDate
        ? format(new Date(boardIssue.startDate), 'yyyy-MM-dd')
        : null;
      const targetDueDate = boardIssue.dueDate
        ? format(new Date(boardIssue.dueDate), 'yyyy-MM-dd')
        : null;
      if (rawStartDate !== targetStartDate || rawDueDate !== targetDueDate) {
        updates.push({ id: feature.id, startDate: rawStartDate, dueDate: rawDueDate });
      }
    });
    updates.forEach((update) => {
      updateIssue.mutate({
        issueId: update.id,
        startDate: update.startDate,
        dueDate: update.dueDate,
      });
    });
  };

  useEffect(() => {
    if (!boardIssues) return;
    const loadedFeatures: IssueType[] = boardIssues.map((issue) => ({
      id: issue.id,
      summary: issue.summary,
      description: issue.description,
      startAt: issue.startDate ? new Date(issue.startDate) : null,
      endAt: issue.dueDate ? new Date(issue.dueDate) : null,
      group: issue.sprint
        ? { id: issue.sprint.id, name: issue.sprint.name }
        : { id: 'backlog', name: 'Backlog' },
    }));
    setFeatures(loadedFeatures);
  }, [boardIssues]);

  useEffect(() => {
    handleUpdateIssuesDates();
  }, [features]);

  const handleViewFeature = (id: string) => console.log(`Feature selected: ${id}`);
  const handleCopyLink = (id: string) => console.log(`Copy link: ${id}`);
  const handleRemoveFeature = (id: string) =>
    setFeatures((prev) => prev.filter((f) => f.id !== id));
  const handleCreateMarker = (date: Date) => console.log(`Create marker: ${date.toISOString()}`);
  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    if (!endAt) return;
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, startAt, endAt } : f)));
  };
  const handleAddFeature = (date: Date) => console.log(`Add feature: ${date.toISOString()}`);

  return (
    <GanttProvider className='border' onAddItem={handleAddFeature} range='monthly' zoom={100}>
      <GanttSidebar>
        {Object.entries(sortedGroupedFeatures).map(([group, features]) => (
          <GanttSidebarGroup key={group} name={group}>
            {features.map((feature) => (
              <GanttSidebarItem
                feature={feature}
                key={feature.id}
                onSelectItem={handleViewFeature}
              />
            ))}
          </GanttSidebarGroup>
        ))}
      </GanttSidebar>
      <GanttTimeline>
        <GanttHeader />
        <GanttFeatureList>
          {Object.entries(sortedGroupedFeatures).map(([group, features]) => (
            <GanttFeatureListGroup key={group}>
              {features.map((feature) => (
                <div className='flex' key={feature.id}>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <button onClick={() => handleViewFeature(feature.id)} type='button'>
                        <GanttFeatureItem onMove={handleMoveFeature} {...feature}>
                          <p className='flex-1 truncate text-xs'>{feature.summary}</p>
                          {feature.assignee && (
                            <Avatar className='h-4 w-4'>
                              <AvatarImage src={feature.assignee.avatar} />
                              <AvatarFallback>{feature.assignee.name?.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          )}
                        </GanttFeatureItem>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        className='flex items-center gap-2'
                        onClick={() => handleViewFeature(feature.id)}
                      >
                        <EyeIcon className='text-muted-foreground' size={16} /> View feature
                      </ContextMenuItem>
                      <ContextMenuItem
                        className='flex items-center gap-2'
                        onClick={() => handleCopyLink(feature.id)}
                      >
                        <LinkIcon className='text-muted-foreground' size={16} /> Copy link
                      </ContextMenuItem>
                      <ContextMenuItem
                        className='flex items-center gap-2 text-destructive'
                        onClick={() => handleRemoveFeature(feature.id)}
                      >
                        <TrashIcon size={16} /> Remove from roadmap
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              ))}
            </GanttFeatureListGroup>
          ))}
        </GanttFeatureList>
        <GanttToday />
        <GanttCreateMarkerTrigger onCreateMarker={handleCreateMarker} />
      </GanttTimeline>
    </GanttProvider>
  );
}
