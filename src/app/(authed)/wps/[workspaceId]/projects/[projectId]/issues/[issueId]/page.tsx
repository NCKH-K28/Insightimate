'use client';

import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from 'next/navigation';
import { getProjectQueryOptions, listProjectMembersQueryOptions } from '@/features/projects/api/actions';
import { getBoardIssueQueryOptions } from '@/features/boards/api/actions';
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Share2, Calendar as CalendarIcon } from "lucide-react";
import StatusDropdown from "@/features/boards/ui/components/status-dropdown";
import MoreOptionsDropdown from "@/features/boards/ui/components/more-options-dropdown";
import { deleteBoardIssueMutationOptions } from '@/features/boards/api/actions';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DatePickerInput from "@/features/boards/ui/components/date-picker-input";
import { cn } from "@/lib/utils";
import { updateBoardIssueMutationOptions } from '@/features/boards/api/actions';
import RichTextDescription from "@/features/boards/ui/components/richtext-description";
import { UserSelectors, userToOption, unassignedUser } from '@/features/users/ui/user-selector';
import { toast } from 'sonner';
import CommentInput from "@/features/boards/ui/components/CommentInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommentList from "@/features/boards/ui/components/CommentList";



export default function Page() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    issueId: string;
  }>();

  const { data: project } = useQuery(getProjectQueryOptions({ projectId: params.projectId }));

  const router = useRouter();

  const boardId = project?.boardId;
  const issueQuery = useQuery({
    ...getBoardIssueQueryOptions({ boardId: boardId ?? '', issueId: params.issueId }),
    enabled: Boolean(boardId),
  });

  const issue = issueQuery.data;

  const [summary, setSummary] = useState('');
  const [storyPoints, setStoryPoints] = useState<number | ''>('');

  useEffect(() => {
    if (issue?.summary) setSummary(issue.summary);
  }, [issue?.summary]);

  useEffect(() => {
    setStoryPoints(issue?.storyPoints ?? '');
  }, [issue?.storyPoints]);

  const [editingSummary, setEditingSummary] = useState(false);

  const updateMutation = useMutation(updateBoardIssueMutationOptions({ boardId: boardId ?? '', issueId: params.issueId }));
  const deleteMutation = useMutation(deleteBoardIssueMutationOptions({ boardId: boardId ?? '', issueId: params.issueId }));

  const handleDelete = async () => {
    if (deleteMutation.isPending) return;
    await toast.promise(deleteMutation.mutateAsync({} as any), {
      loading: 'Deleting issue...',
      success: 'Issue deleted',
      error: (err: any) => `Error: ${err?.message || 'Failed to delete issue'}`,
    });
    // navigate back to the project page after successful delete
    try {
      router.push(`/wps/${params.workspaceId}/projects/${params.projectId}`);
    } catch (e) {
      // ignore navigation errors
    }
  };

  const saveSummary = async () => {
    if (!summary.trim()) return;

    toast.promise(
      updateMutation.mutateAsync({ summary } as any),
      {
        loading: 'Updating summary...',
        success: 'Summary updated successfully!',
        error: (err: any) => `Failed to update summary: ${err?.message || 'Unknown error'}`,
      }
    );

    setEditingSummary(false);
  };


  const cancelEdit = () => {
    setSummary(issue?.summary ?? '');
    setEditingSummary(false);
  };

  const handleUpdate = useCallback(
    (data: Parameters<typeof updateMutation.mutateAsync>[0]) => {
      if (updateMutation.isPending) return;
      if (!data) throw new Error('No data to update');
      toast.promise(updateMutation.mutateAsync(data as any), {
        loading: 'Updating issue...',
        success: 'Issue updated',
        error: (err: any) => `Error: ${err?.message || 'Failed to update issue'}`,
      });
    },
    [updateMutation],
  );

  function formatDate(d: Date | undefined) {
    if (!d) return "";
    return d.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function isValidDate(d: Date | undefined) {
    return !!d && !isNaN(d.getTime());
  }

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date | undefined>(undefined);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (issue?.dueDate) {
      try {
        const d = new Date(issue.dueDate);
        if (isValidDate(d)) {
          setDate(d);
          setMonth(d);
          setValue(formatDate(d));
          return;
        }
      } catch (e) {
        // fallthrough
      }
    }
    setDate(undefined);
    setMonth(undefined);
    setValue("");
  }, [issue?.dueDate]);

  return (
    <div
      className={
        cn(
          'size-full',
          'flex flex-1 overflow-y-auto',
        )
      }
    >
      <div className="w-3/5 border-r border-gray-300 flex-1 min-h-0 overflow-auto p-6">
        <div className="space-y-6">
          {/* Summary issue */}
          <div>
            {!editingSummary ? (
              <h2
                className="text-3xl font-semibold mb-2 cursor-text"
                onClick={() => setEditingSummary(true)}
              >
                {summary || 'Untitled issue'}
              </h2>
            ) : (
              <div className="flex items-start gap-2">
                <Input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="text-3xl font-semibold mb-2"
                  aria-label="Issue summary"
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-1">
                  <Button size="sm" onClick={saveSummary} disabled={updateMutation.isPending}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-1">Description</h3>
            <RichTextDescription
              initialContent={issue?.description ?? ""}
              onSave={(html) => handleUpdate({ description: html } as any)}
            />
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-1">Activity</h3>
            <Tabs defaultValue="checklist" className="w-full ">
              <TabsList>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>
              <TabsContent value="checklist"></TabsContent>
              <TabsContent value="comments"><CommentInput issueId={params.issueId} /><CommentList projectId={params.issueId} /></TabsContent>
            </Tabs>
          </div>


        </div>
      </div>

      <div className="flex-1 max-h-screen overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <StatusDropdown
              defaultStatus={issue?.status?.name ?? 'To Do'}
              onChange={(statusName) => {
                const statusObj = project?.statuses?.find((s: any) => s.name === statusName);
                if (statusObj?.id) handleUpdate({ statusId: statusObj.id } as any);
              }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded-md border hover:bg-gray-50 text-gray-600"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <MoreOptionsDropdown onDelete={handleDelete} onDeleted={() => router.push(`/wps/${params.workspaceId}/projects/${params.projectId}`)} />
            </div>
          </div>

          <div className="border rounded-md bg-white shadow-sm">
            <Accordion type="single" collapsible defaultValue="details">
              <AccordionItem value="details">
                <AccordionTrigger className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b text-sm font-semibold hover:no-underline">
                  Details
                </AccordionTrigger>

                <AccordionContent className="px-4 py-3 space-y-4 text-sm">
                  {/* Assignee */}
                  <div>
                    <h4 className="font-medium text-gray-800">Assignee</h4>
                    <div className="mt-2">
                      <div className="w-40">
                        <UserSelectors
                          value={issue?.assignee ? userToOption(issue.assignee) : null}
                          className="w-full"
                          extendOptions={[unassignedUser()]}
                          fetchQueryOptions={() => ({
                            ...listProjectMembersQueryOptions({ projectId: params.projectId }),
                            select: (res) => res.members.data,
                          })}
                          disabled={updateMutation.isPending}
                          placeholder="Unassigned"
                          onChange={(option) => handleUpdate({ assigneeId: option?.value ? option.value : null } as any)}
                          emptyMessage="No members found"
                        />
                      </div>
                    </div>

                    {/* Parent */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-800">Parent</h4>
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-100 text-purple-700 text-sm font-medium">
                          <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <path d="M12 2L15 8H9L12 2Z" fill="currentColor" opacity="0.9" />
                            <path d="M12 22V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>AA-5 aaaaa</span>
                        </span>
                      </div>
                    </div>

                    <DatePickerInput
                      label="Start Date"
                      initialDate={issue?.startDate ?? undefined}
                      onChange={(d) => {
                        // server expects date-only ISO (yyyy-MM-dd) for z.iso.date()
                        if (!d) return handleUpdate({ startDate: null } as any);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        const dateOnly = `${yyyy}-${mm}-${dd}`;
                        handleUpdate({ startDate: dateOnly } as any);
                      }}
                    />

                    <DatePickerInput
                      label="Due Date"
                      initialDate={issue?.dueDate ?? undefined}
                      onChange={(d) => {
                        if (!d) return handleUpdate({ dueDate: null } as any);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        const dateOnly = `${yyyy}-${mm}-${dd}`;
                        handleUpdate({ dueDate: dateOnly } as any);
                      }}
                    />
                    <div className="mt-4 flex gap-4">
                      {/* Sprint */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">Sprint</h4>
                        <div className="mt-2">
                          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-blue-600 text-sm font-medium">
                            <span>AA Sprint 2</span>
                            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded border bg-white text-xs text-gray-700">+1</span>
                          </div>
                        </div>
                      </div>

                      {/* Story point estimate */}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">Story point estimate</h4>
                        <div className="mt-2">
                          <input
                            type="number"
                            placeholder="Set story point"
                            min={0}
                            step={1}
                            value={storyPoints ?? ''}
                            onChange={(e) => {
                              const v = e.target.value === '' ? '' : Number(e.target.value);
                              setStoryPoints(v as any);
                            }}
                            onBlur={() => {
                              handleUpdate({ storyPoints: storyPoints === '' ? null : storyPoints } as any);
                            }}
                            className="w-full border rounded-md px-3 py-2 text-sm text-gray-700"
                            aria-label="Story point estimate"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
