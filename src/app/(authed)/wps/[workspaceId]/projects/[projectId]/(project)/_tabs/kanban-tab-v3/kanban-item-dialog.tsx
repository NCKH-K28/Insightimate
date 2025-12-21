'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { ColumnItem } from '@/features/boards/ui/containers/kanban-v2/ui';
import { IssueForm } from '@/features/boards/ui/forms/issue-form';

export type KanbanItemDialogProps = {
  mode: 'create' | 'update';
  params: { projectId: string; boardId: string };
  open: boolean;
  onClose: () => void;
  item?: ColumnItem;
};

export function KanbanItemDialog({ mode, params, open, onClose, item }: KanbanItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[680px]'>
        <DialogHeader>
          <DialogTitle>{item ? 'Update Issue' : 'Create Issue'}</DialogTitle>
        </DialogHeader>
        <IssueForm mode={mode} defaultValues={item?.data} params={params} />
      </DialogContent>
    </Dialog>
  );
}
