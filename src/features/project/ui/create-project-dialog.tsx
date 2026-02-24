import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectCreateForm } from './forms';

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: { leadId: string; orgId: string };
};

export function CreateProjectDialog({ open, onOpenChange, values }: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden p-0'>
        <DialogHeader className='px-6 pt-6 pb-0 shrink-0'>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <div className='flex-1 overflow-y-auto px-6 pb-6'>
          <ProjectCreateForm values={values} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
