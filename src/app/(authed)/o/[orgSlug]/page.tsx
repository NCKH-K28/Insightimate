'use client';

import { useParamsRequired } from '@/hooks/next-navigation';
import { useQuery } from '@tanstack/react-query';

export default function Page() {
  const params = useParamsRequired<{ orgSlug: string }>();
  const fetchorg = useQuery({
    queryKey: ['org', params.orgSlug],
    queryFn: async () => {
      const res = await fetch(`/api/v3/orgs/${params.orgSlug}?by=slug`);
      if (!res.ok) throw new Error('Failed to fetch organization');
      return res.json();
    },
  });

  if (fetchorg.isLoading) return <div>Loading...</div>;
  if (fetchorg.isError) return <div>Error: {(fetchorg.error as Error).message}</div>;

  return (
    <div>
      <h1>Organization: {fetchorg.data.data.slug}</h1>
      <p>ID: {fetchorg.data.data.id}</p>
      <p>Name: {fetchorg.data.data.name}</p>
    </div>
  );
}
