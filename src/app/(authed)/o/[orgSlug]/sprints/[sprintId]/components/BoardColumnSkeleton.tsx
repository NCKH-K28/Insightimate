import { Skeleton } from '@/components/ui/skeleton';
import { IssueCardSkeleton } from './IssueCardSkeleton';

export function BoardColumnSkeleton() {
  return (
    <div className='flex-shrink-0 w-72 bg-slate-50 rounded-lg'>
      <div className='p-3 border-b border-slate-200'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-5 w-6 rounded' />
          </div>
          <Skeleton className='h-4 w-12' />
        </div>
      </div>
      <div className='p-2 space-y-2'>
        {[1, 2, 3].map((i) => (
          <IssueCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
