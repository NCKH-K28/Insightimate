import { Skeleton } from '@/components/ui/skeleton';

function SprintHeaderSkeleton() {
  return (
    <div className='bg-background'>
      <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2 sm:gap-3 mb-1'>
            <Skeleton className='h-8 w-48 sm:w-64 rounded-md' />
            <Skeleton className='h-6 w-20 rounded-md' />
          </div>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <Skeleton className='h-8 w-32 rounded-md' />
          <Skeleton className='h-8 w-10 rounded-md' />
        </div>
      </div>

      <Skeleton className='h-12 w-full mb-3 rounded-lg' />

      <div className='flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground'>
        <Skeleton className='h-5 w-32 rounded-md' />
        <Skeleton className='h-5 w-40 rounded-md' />
        <Skeleton className='h-5 w-28 rounded-md' />
      </div>
    </div>
  );
}

export { SprintHeaderSkeleton };
