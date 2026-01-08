import { toolRegistry } from '../registry';
import { AgentTool } from '../types';
import {
  getProject,
  listProjects,
  ZGetProjectInput,
  ZListProjectsInput,
} from '../../../ai/insightmate/services/project';
import {
  getSprint,
  listSprints,
  ZGetSprintInput,
  ZListSprintsInput,
} from '../../../ai/insightmate/services/sprint';

export const registerProjectTools = () => {
  const getProjectTool: AgentTool = {
    name: 'get_project',
    description: 'Get project by id',
    schema: ZGetProjectInput,
    execute: async (input, ctx) => getProject(input, { actorId: ctx.userId }),
  };

  const listProjectsTool: AgentTool = {
    name: 'list_projects',
    description: 'List projects',
    schema: ZListProjectsInput,
    execute: async (input, ctx) => listProjects(input, { actorId: ctx.userId }),
  };

  const getSprintTool: AgentTool = {
    name: 'get_sprint',
    description: 'Get sprint by id',
    schema: ZGetSprintInput,
    execute: async (input, ctx) => getSprint(input, { actorId: ctx.userId }),
  };

  const listSprintsTool: AgentTool = {
    name: 'list_sprints',
    description: 'List sprints',
    schema: ZListSprintsInput,
    execute: async (input, ctx) => listSprints(input, { actorId: ctx.userId }),
  };

  toolRegistry.register(getProjectTool);
  toolRegistry.register(listProjectsTool);
  toolRegistry.register(getSprintTool);
  toolRegistry.register(listSprintsTool);
};
