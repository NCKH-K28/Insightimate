'use client';

import * as React from 'react';
import type { GeneratedIssue } from '@/features/agents/types/chat';

type GeneratedIssuesPanelProps = {
  issues: GeneratedIssue[];
  projectId: string;
  saved?: boolean;
  onSaved?: () => void;
};

export function GeneratedIssuesPanel({
  issues,
  projectId,
  saved,
  onSaved,
}: GeneratedIssuesPanelProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const isDisabled = isSaving || saved;

  const handleSave = async () => {
    if (!issues.length) return;
    setIsSaving(true);
    try {
      // TODO: đổi endpoint cho khớp với project của bạn
      await fetch(`/api/projs/${projectId}/issues/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues }),
      });
      onSaved?.();
    } catch (err) {
      console.error('Failed to save issues', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!issues.length) return null;

  return (
    <div className='my-2 rounded border bg-muted p-2 text-xs'>
      <div className='mb-2 flex items-center justify-between'>
        <div>
          <div className='font-semibold'>Issues được AI đề xuất</div>
          <div className='text-[10px] text-muted-foreground'>
            Kiểm tra lại trước khi lưu vào project.
          </div>
        </div>
        <button
          type='button'
          onClick={handleSave}
          disabled={isDisabled}
          className='rounded bg-primary px-2 py-1 text-[11px] text-primary-foreground disabled:opacity-60'
        >
          {saved ? 'Đã lưu' : isSaving ? 'Saving...' : 'Save tất cả'}
        </button>
      </div>

      <div className='space-y-1'>
        {issues.map((issue, index) => (
          <div key={index} className='rounded border bg-background px-2 py-1'>
            <div className='font-medium'>{issue.summary}</div>
            {issue.description && (
              <div className='text-[11px] text-muted-foreground'>{issue.description}</div>
            )}
            <div className='mt-1 flex gap-2 text-[10px] text-muted-foreground'>
              <span>SP: {issue.story_points ?? '-'}</span>
              <span>Priority: {issue.priority}</span>
              {issue.due_date && <span>Due: {issue.due_date}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
