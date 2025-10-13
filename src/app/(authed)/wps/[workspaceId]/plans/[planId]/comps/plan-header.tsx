'use client';
import { fetchPlanQueryOption } from '@/components/plan/hooks/use-plan';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Settings2Icon } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export const PlanHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ planId: string; scenarioId?: string }>();

  const fetchPlan = useQuery({ ...fetchPlanQueryOption(params.planId) });

  const redirectToSettings = useCallback(() => {
    const basePath = pathname.split('/plans/')[0];
    router.push(`${basePath}/plans/${params.planId}/settings`);
  }, [pathname, router]);

  const plan = fetchPlan.data;

  const scenario = params?.scenarioId && plan?.scenarios.find((s) => s.id === params?.scenarioId);

  if (!plan) return null;
  return (
    <div className='size-full flex items-center justify-between py-2'>
      <div>
        <h1 className='text-2xl font-bold'>{plan?.title}</h1>
        <div className='text-sm text-muted-foreground'>
          {scenario ? `Scenario: ${scenario.title}` : ''}
        </div>
      </div>
      <div>
        <Button variant='outline' size='icon' onClick={redirectToSettings}>
          <Settings2Icon />
        </Button>
      </div>
    </div>
  );
};
