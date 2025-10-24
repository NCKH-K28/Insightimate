import { createId } from '@paralleldrive/cuid2';

export const genProjectId = () => `prj_${createId()}`;
export const genProjectRoleId = () => `role_${createId()}`;
export const genIssuePriorityId = () => `priority_${createId()}`;
export const genIssueStatusId = () => `status_${createId()}`;
export const genIssueTypeId = () => `type_${createId()}`;
export const genIssueResolutionId = () => `resolution_${createId()}`;
export const genBoardId = () => `brd_${createId()}`;
export const genColumnId = () => `col_${createId()}`;
export const genSprintId = () => `spt_${createId()}`;
