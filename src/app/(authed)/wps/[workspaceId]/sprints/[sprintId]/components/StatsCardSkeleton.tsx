import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className='p-4'>
        <div className='flex items-center gap-2 mb-2'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-3 w-20' />
        </div>
        <Skeleton className='h-8 w-12 mb-1' />
        <Skeleton className='h-3 w-32' />
        <Skeleton className='h-1.5 w-full mt-2' />
      </CardContent>
    </Card>
  );
}
