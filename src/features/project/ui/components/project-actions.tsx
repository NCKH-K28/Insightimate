import { ProjectSettingsSheet } from './project-settings-sheet';

type ProjectActionsProps = { params: { projectId: string } };
export const ProjectActions = (props: ProjectActionsProps) => {
  return <ProjectSettingsSheet params={props.params} />;
};
