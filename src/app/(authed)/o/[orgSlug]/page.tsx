import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { orgService } from '@/features/organization/server/org.service';
import { dashboardService } from '@/features/organization/server/dashboard.service';
import { OrgDashboard } from '@/features/organization/ui/dashboard/org-dashboard';

type PageProps = { params: Promise<{ orgSlug: string }> };

export default async function Page({ params }: PageProps) {
  const { orgSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  const actorId = session.user.id;
  const org = await orgService.get({ id: orgSlug, by: 'slug' }, { actorId });

  const data = await dashboardService.getDashboard(org.id, { actorId });

  return (
    <div className='container mx-auto py-6'>
      <OrgDashboard data={data} orgId={org.id} orgSlug={orgSlug} orgName={org.name} />
    </div>
  );
}
