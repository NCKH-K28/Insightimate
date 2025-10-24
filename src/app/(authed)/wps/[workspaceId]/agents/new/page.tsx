import { CreateAgentForm } from '@/features/agents/ui/components/create-agent-form';

export default async function NewPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  return <CreateAgentForm values={{ workspaceId }} />;
}
