import { ProjectTabs } from '@/features/project/ui/project-tabs';

type PageProps = { params: Promise<{ orgSlug: string; projId: string }> };

export default async function Page({ params }: PageProps) {
  const { projId } = await params;

  return <ProjectTabs projId={projId} />;
}
