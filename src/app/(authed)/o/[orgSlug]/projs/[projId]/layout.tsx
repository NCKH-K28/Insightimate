import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { orgService } from '@/features/organization/server/org.service';
import { projectsService } from '@/features/project/server/projects.service';
import { ProjectDetailLayout } from '@/features/project/ui/project-detail-layout';

type LayoutProps = {
  params: Promise<{ orgSlug: string; projId: string }>;
  children: React.ReactNode;
};

export default async function Layout({ params, children }: LayoutProps) {
  const { orgSlug, projId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  const actorId = session.user.id;
  const org = await orgService.get({ id: orgSlug, by: 'slug' }, { actorId });
  const project = await projectsService.getById(projId, { actorId });

  return (
    <ProjectDetailLayout project={project} orgSlug={org.slug}>
      {children}
    </ProjectDetailLayout>
  );
}
