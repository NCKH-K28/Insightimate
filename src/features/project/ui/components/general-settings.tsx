import { fetchProjectQueryOptions } from '@/features/project/api/actions';
import { useSuspenseQuery } from '@tanstack/react-query';
import { UpdateProjectForm } from '../forms/update-project-form';

export const GeneralSettings = (props: { projectId: string }) => {
  const { data: project } = useSuspenseQuery(fetchProjectQueryOptions(props));

  return (
    <div id={'general'}>
      <UpdateProjectForm
        params={{ projectId: project.id }}
        defaultValues={project}
        onSuccess={() => {
          // Handle success
        }}
      />
    </div>
  );
};
