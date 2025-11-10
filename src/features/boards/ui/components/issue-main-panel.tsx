 
/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RichTextDescription from './richtext-description';
import IssueActivity from './issue-activity';

export default function IssueMainPanel({
  issue,
  onUpdate,
}: {
  issue: any;
  onUpdate: (data: any) => void;
}) {
  const [summary, setSummary] = useState(issue.summary);
  const [editingSummary, setEditingSummary] = useState(false);

  useEffect(() => {
    setSummary(issue.summary ?? '');
  }, [issue]);

  const saveSummary = () => {
    if (!summary.trim()) return;
    onUpdate({ summary });
    setEditingSummary(false);
  };

  return (
    <div className='w-3/5 border-r border-gray-300 flex-1 min-h-0 overflow-auto p-6 space-y-6'>
      {/* Summary */}
      <div>
        {!editingSummary ? (
          <h2
            className='text-3xl font-semibold mb-2 cursor-text'
            onClick={() => setEditingSummary(true)}
          >
            {summary || 'Untitled issue'}
          </h2>
        ) : (
          <div className='flex items-start gap-2'>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className='text-3xl font-semibold mb-2'
            />
            <div className='flex items-center gap-2 mt-1'>
              <Button size='sm' onClick={saveSummary}>
                Save
              </Button>
              <Button variant='ghost' size='sm' onClick={() => setEditingSummary(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        <div>
          <h3 className='font-semibold text-lg mb-1'>Description</h3>
          <RichTextDescription
            initialContent={issue.description ?? ''}
            onSave={(html) => onUpdate({ description: html })}
          />
        </div>
      </div>

      {/* Activity */}
      <div>
        <h3 className='font-semibold text-lg mb-1'>Activity</h3>
        <IssueActivity issueId={issue.id} />
      </div>
    </div>
  );
}
