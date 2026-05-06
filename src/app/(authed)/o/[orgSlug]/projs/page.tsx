import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { orgService } from '@/features/organization/server/org.service';
import { projectsService } from '@/features/project/server/projects.service';
import { ProjectsTable } from '@/features/project/ui/table/projects-table';

type PageProps = { params: Promise<{ orgSlug: string }> };

export default async function Page({ params }: PageProps) {
  const { orgSlug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  const actorId = session.user.id;
  const org = await orgService.get({ id: orgSlug, by: 'slug' }, { actorId });

  const result = await projectsService.list(
    { filter: { orgId: org.id } },
    { actorId },
    { include: { permissions: true } },
  );

  return (
    <div className='container mx-auto py-6 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Projects</h1>
        <p className='text-muted-foreground'>Manage your organization&apos;s projects</p>
      </div>

      <ProjectsTable initialData={result.data} orgId={org.id} context={{ userId: actorId }} />
    </div>
  );
}
