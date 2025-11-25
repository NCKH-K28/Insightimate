import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UpdateFormData, UpdateSprintForm } from '../forms/update-sprint-form';
import { DialogDescription } from '@radix-ui/react-dialog';

type UpdateSprintButtonProps = {
  params: { boardId: string; sprintId: string };
  defaultValues?: Partial<UpdateFormData>;
  renderLabel?: (label: string) => React.ReactNode;
  label?: string;

  //
  hiddenDialogTrigger?: boolean;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

export const UpdateSprintButton = ({
  params,
  defaultValues,
  renderLabel,
  label = 'Update Sprint',
  hiddenDialogTrigger = false,
  dialogOpen,
  onDialogOpenChange,
}: UpdateSprintButtonProps) => {
  return (
    <Dialog modal={true} open={dialogOpen} onOpenChange={onDialogOpenChange}>
      {hiddenDialogTrigger || (
        <DialogTrigger asChild>
          {renderLabel ? renderLabel(label) : <Button variant='outline'>{label}</Button>}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold'>Update Sprint</DialogTitle>
          <DialogDescription className='text-base'>
            Update the details of your sprint below.
          </DialogDescription>
        </DialogHeader>
        <UpdateSprintForm params={params} defaultValues={defaultValues} />
      </DialogContent>
    </Dialog>
  );
};
