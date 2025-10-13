import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CompleteSprintForm } from '../forms/complete-sprint-form';

type CompleteSprintButtonProps = {
  params: { boardId: string; sprintId: string };
  hidden?: boolean;
};
export const CompleteSprintButton = (props: CompleteSprintButtonProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='ml-2' hidden={props.hidden}>
          Complete Sprint
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className='text-2xl font-bold'>Complete Sprint</DialogTitle>
        <CompleteSprintForm params={props.params} />
      </DialogContent>
    </Dialog>
  );
};
