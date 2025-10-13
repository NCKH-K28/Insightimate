'use client';

import { fetchPlanQueryOption } from '@/components/plan/hooks/use-plan';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PlanPage() {
  const router = useRouter();
  const params = useParams<{ planId: string; scenarioId?: string }>();

  const fetchPlan = useQuery({ ...fetchPlanQueryOption(params.planId) });

  useEffect(() => {
    if (params.scenarioId || !fetchPlan.data) return;
    const plan = fetchPlan.data;
    const scenarios = plan?.scenarios;
    const firstScenario = scenarios?.[0];
    if (!firstScenario) throw new Error('Scenario ID is missing in the URL');

    router.push(`/plans/${params.planId}/${firstScenario.id}`);
  }, [fetchPlan.data, params.scenarioId, router]);

  if (fetchPlan.isLoading) return <div>Loading...</div>;
  if (fetchPlan.isError) return <div>Error: {String(fetchPlan.error)}</div>;

  return null;
  return (
    <div>
      <h1>Plan Page</h1>
      <pre>{JSON.stringify(fetchPlan.data, null, 2)}</pre>
    </div>
  );
}
