import { Skeleton } from '@/components/ui/skeleton';

export default function IssueDetailLoading() {
  return (
    <div className='flex h-full w-full'>
      {/* Main content skeleton */}
      <div className='flex-1 space-y-6 p-6'>
        {/* Breadcrumb */}
        <div className='flex items-center gap-2'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-5 w-4' />
          <Skeleton className='h-5 w-20' />
        </div>
        {/* Title */}
        <Skeleton className='h-9 w-3/4' />
        {/* Description */}
        <div className='space-y-3'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-40 w-full rounded-lg' />
        </div>
        {/* Activity */}
        <div className='space-y-3'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-12 w-full rounded-lg' />
          <Skeleton className='h-12 w-full rounded-lg' />
        </div>
      </div>
      {/* Sidebar skeleton */}
      <div className='hidden lg:block w-80 border-l border-border p-5 space-y-5'>
        <Skeleton className='h-8 w-full rounded-md' />
        <div className='space-y-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='space-y-1.5'>
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-8 w-full rounded-md' />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
