import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { orgService } from '@/features/organization/server/org.service';
import { projectsService } from '@/features/project/server/projects.service';
import { ProjectsListPage } from '@/features/project/ui/projects-list-page';

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
    <ProjectsListPage
      initialData={result.data}
      orgId={org.id}
      orgSlug={orgSlug}
      context={{ userId: actorId }}
    />
  );
}
