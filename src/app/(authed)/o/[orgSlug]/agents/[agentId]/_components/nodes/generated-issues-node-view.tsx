// nodes/generated-issues-node-view.tsx
import React, { useState } from 'react';
import type { NodeViewProps } from '@tiptap/react';

export type GeneratedIssue = {
  title: string;
  description?: string;
  estimate?: number;
  priority?: 'low' | 'medium' | 'high';
};

export const GeneratedIssuesNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  const { issues, projectId, saved } = node.attrs as {
    issues: GeneratedIssue[];
    projectId: string | null;
    saved: boolean;
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!projectId) return; // bạn có thể show toast ở đây nếu muốn

    setSaving(true);
    try {
      await fetch(`/api/projs/${projectId}/issues/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issues }),
      });

      // ghi lại state vào node
      updateAttributes({ saved: true });
    } finally {
      setSaving(false);
    }
  };

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
          onClick={handleSave}
          disabled={saving || saved || !projectId}
          className='rounded bg-primary px-2 py-1 text-[11px] text-primary-foreground disabled:opacity-60'
        >
          {saved ? 'Đã lưu' : saving ? 'Saving...' : 'Save tất cả'}
        </button>
      </div>

      <div className='space-y-1'>
        {issues.map((issue, index) => (
          <div key={index} className='rounded border bg-background px-2 py-1'>
            <div className='font-medium'>{issue.title}</div>
            {issue.description && (
              <div className='text-[11px] text-muted-foreground'>{issue.description}</div>
            )}
            <div className='mt-1 flex gap-2 text-[10px] text-muted-foreground'>
              <span>Estimate: {issue.estimate ?? '-'}</span>
              <span>Priority: {issue.priority ?? '-'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
