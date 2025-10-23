import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AIInputForm } from '../ai-input-form';

const AddProjectsButton = () => {
  return <Button variant='outline'>Add Projects</Button>;
};

export const AddSourceButton = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='outline'>Add Source</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add a new source</DialogTitle>
          <DialogDescription>
            Provide the necessary details to add a new source to your workspace.
          </DialogDescription>
          <div
            className='grid gap-4 py-4'
            //
            //
          ></div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
