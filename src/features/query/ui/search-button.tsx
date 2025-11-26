import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchIcon } from 'lucide-react';
import { SearchForm } from './search-form';

type SearchButtonProps = React.ComponentProps<typeof Button> & {
  triggerLabel?: string;
  renderTrigger?: (props: React.ComponentProps<typeof DialogTrigger>) => React.ReactNode;
};
export const SearchButton = ({
  triggerLabel = 'Search',
  renderTrigger,
  ...props
}: SearchButtonProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {renderTrigger ? (
          renderTrigger(props)
        ) : (
          <Button {...props}>
            <SearchIcon />
            <span>{triggerLabel}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className='p-2 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden'
        //
      >
        <DialogHeader hidden>
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <SearchForm />
      </DialogContent>
    </Dialog>
  );
};
