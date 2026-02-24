import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function IssueCardSkeleton() {
  return (
    <Card className='mb-2 animate-pulse'>
      <CardContent className='p-3'>
        <div className='flex items-center gap-2 mb-2'>
          <Skeleton className='h-4 w-4 rounded' />
          <Skeleton className='h-3 w-16' />
        </div>
        <Skeleton className='h-4 w-full mb-1' />
        <Skeleton className='h-4 w-3/4 mb-3' />
        <div className='flex justify-between items-center'>
          <Skeleton className='h-5 w-8 rounded' />
          <Skeleton className='h-6 w-6 rounded-full' />
        </div>
      </CardContent>
    </Card>
  );
}
