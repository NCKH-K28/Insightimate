'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Share2 } from 'lucide-react';
import StatusDropdown from './status-dropdown';
import MoreOptionsDropdown from './more-options-dropdown';
import { UserSelectors, userToOption, unassignedUser } from '@/features/users/ui/user-selector';
import DatePickerInput from './date-picker-input';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { listProjectMembersQueryOptions } from '@/features/projects/api/actions';

export default function IssueSidePanel({
  issue,
  project,
  onUpdate,
  onDelete,
  workspaceId,
  projectId,
}: {
  issue: any;
  project: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  workspaceId: string;
  projectId: string;
}) {
  const [storyPoints, setStoryPoints] = useState(issue.storyPoints ?? '');

  return (
    <div
      className={cn(
        'flex-1 max-h-screen overflow-y-auto p-6 border-l border-gray-200 bg-white space-y-6',
      )}
    >
      {/* Header */}
      <div className='flex items-center justify-between'>
        <StatusDropdown
          defaultStatus={issue?.status?.name ?? 'To Do'}
          onChange={(statusName) => {
            const statusObj = project?.statuses?.find((s: any) => s.name === statusName);
            if (statusObj?.id) onUpdate({ statusId: statusObj.id });
          }}
        />

        <div className='flex items-center gap-2'>
          <button
            type='button'
            className='p-2 rounded-md border hover:bg-gray-50 text-gray-600'
            aria-label='Share'
          >
            <Share2 className='w-4 h-4' />
          </button>

          <MoreOptionsDropdown
            onDelete={onDelete}
            onDeleted={() => (window.location.href = `/wps/${workspaceId}/projects/${projectId}`)}
          />
        </div>
      </div>

      {/* Details */}
      <div className='border rounded-md bg-white shadow-sm'>
        <Accordion type='single' collapsible defaultValue='details'>
          <AccordionItem value='details'>
            <AccordionTrigger className='flex justify-between items-center px-4 py-2 bg-gray-50 border-b text-sm font-semibold hover:no-underline'>
              Details
            </AccordionTrigger>

            <AccordionContent className='px-4 py-3 space-y-4 text-sm'>
              {/* Assignee */}
              <div>
                <h4 className='font-medium text-gray-800'>Assignee</h4>
                <div className='mt-2 w-40'>
                  <UserSelectors
                    value={issue?.assignee ? userToOption(issue.assignee) : null}
                    className='w-full'
                    extendOptions={[unassignedUser()]}
                    fetchQueryOptions={() => ({
                      ...listProjectMembersQueryOptions({ projectId }),
                      select: (res) => res.members.data,
                    })}
                    placeholder='Unassigned'
                    onChange={(option) =>
                      onUpdate({ assigneeId: option?.value ? option.value : null })
                    }
                    emptyMessage='No members found'
                  />
                </div>
              </div>

              {/* Parent */}
              <div className='mt-4'>
                <h4 className='font-medium text-gray-800'>Parent</h4>
                <div className='mt-2'>
                  <span className='inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-100 text-purple-700 text-sm font-medium'>
                    <svg
                      className='w-4 h-4 text-purple-600'
                      viewBox='0 0 24 24'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      aria-hidden
                    >
                      <path d='M12 2L15 8H9L12 2Z' fill='currentColor' opacity='0.9' />
                      <path
                        d='M12 22V9'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <span>{issue.parentTitle ?? 'No parent'}</span>
                  </span>
                </div>
              </div>

              {/* Dates */}
              <DatePickerInput
                label='Start Date'
                initialDate={issue?.startDate ?? undefined}
                onChange={(d) => onUpdate({ startDate: d ? d.toISOString() : null })}
              />

              <DatePickerInput
                label='Due Date'
                initialDate={issue?.dueDate ?? undefined}
                onChange={(d) => onUpdate({ dueDate: d ? d.toISOString() : null })}
              />

              {/* Sprint */}
              <div className='mt-4 flex gap-4'>
                <div className='flex-1'>
                  <h4 className='font-medium text-gray-800'>Sprint</h4>
                  <div className='mt-2'>
                    <div className='inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-blue-600 text-sm font-medium'>
                      <span>{issue?.sprint?.name ?? 'No sprint'}</span>
                      {issue?.sprint && (
                        <span className='ml-2 inline-flex items-center justify-center w-6 h-6 rounded border bg-white text-xs text-gray-700'>
                          +1
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Story Points */}
                <div className='flex-1'>
                  <h4 className='font-medium text-gray-800'>Story point estimate</h4>
                  <div className='mt-2'>
                    <input
                      type='number'
                      placeholder='Set story point'
                      min={0}
                      step={1}
                      value={storyPoints ?? ''}
                      onChange={(e) => {
                        const v = e.target.value === '' ? '' : Number(e.target.value);
                        setStoryPoints(v as any);
                      }}
                      onBlur={() => {
                        onUpdate({
                          storyPoints: storyPoints === '' ? null : storyPoints,
                        });
                      }}
                      className='w-full border rounded-md px-3 py-2 text-sm text-gray-700'
                      aria-label='Story point estimate'
                    />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
