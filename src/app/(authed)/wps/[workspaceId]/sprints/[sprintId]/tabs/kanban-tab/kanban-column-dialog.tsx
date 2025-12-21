'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createId } from '@paralleldrive/cuid2';
import { ColumnForm } from '@/features/boards/ui/forms/column-form';

type StatusCategory = 'TODO' | 'IN_PROGRESS' | 'DONE';

type StatusOption = {
  id: string;
  name: string;
  color?: string;
  iconURL?: string;
  category: StatusCategory;
};

export type SubmitPayload = {
  mode: 'create' | 'update';
  data: {
    id: string;
    name: string;
    statuses: StatusOption[];
  };
};

export type KanbanColumnDialogProps = {
  mode: 'create' | 'update';
  statusOpts?: StatusOption[];
  column?: { id: string; data: { name: string; statuses: StatusOption[] } };

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderLabel?: () => React.ReactNode;

  onSubmit?: (payload: SubmitPayload) => void;

  triggerLabel?: string;
};

const formatStatus = (s: StatusOption) => ({
  name: s.name,
  category: s.category,
  color: s.color ?? '#94a3b8',
  iconURL: s.iconURL,
});

export const KanbanColumnDialog = (props: KanbanColumnDialogProps) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>{props.mode === 'create' ? 'Create Column' : 'Update Column'}</DialogTitle>
        </DialogHeader>

        <ColumnForm
          mode={props.mode}
          defaultValues={
            props.column?.data && {
              name: props.column.data.name,
              statuses: props.column.data.statuses.map(formatStatus),
            }
          }
          onSubmit={(v) => {
            if (!props.onSubmit) return;
            props.onSubmit({
              mode: props.mode,
              data: {
                ...v,
                id: props.column?.id ?? createId(),
                statuses: v.statuses.map((s) => ({ ...s, id: (s as any).id ?? createId() })),
              },
            });
          }}
        />

        <DialogFooter className='gap-2 sm:gap-0'></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
