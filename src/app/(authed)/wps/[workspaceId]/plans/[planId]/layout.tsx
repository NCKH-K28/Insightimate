import { PlanHeader } from './comps/plan-header';

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='size-full grid grid-rows-[auto_1fr] gap-2'>
      <div className='h-16 border-b'>
        <PlanHeader />
      </div>
      <div className='min-h-0 min-w-0'>{children}</div>
    </div>
  );
}
