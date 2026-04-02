import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function IssueNotFound() {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-4 p-8'>
      <div className='rounded-full bg-muted p-4'>
        <FileQuestion className='h-8 w-8 text-muted-foreground' />
      </div>
      <h2 className='text-xl font-semibold'>Issue not found</h2>
      <p className='text-muted-foreground text-center max-w-sm'>
        The issue you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to
        view it.
      </p>
      <Button variant='outline' asChild>
        <Link href='..'>Back to project</Link>
      </Button>
    </div>
  );
}
