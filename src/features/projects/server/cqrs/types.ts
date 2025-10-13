import { IssueStatus } from '@/contracts/issues/issue';
import { IssuePriority, IssueResolution, IssueType, Prisma } from '@prisma/client';

export type TxClient = Prisma.TransactionClient;
export type TemplateConfig = {
  boardType: string;
  statuses?: Omit<IssueStatus, 'id' | 'projectId'>[];
  types?: Omit<IssueType, 'id' | 'projectId'>[];
  priorities?: Omit<IssuePriority, 'id' | 'projectId'>[];
  resolutions?: Omit<IssueResolution, 'id' | 'projectId'>[];
};

export type ProjectActorParams = { projectId: string; actorId?: string };
export type ProjectParams = { projectId: string };
export type ProjectActorContext = { actorId: string };
export type ProjectContext = { actorId: string };

export type CreateProjectParams = {
  projectId: string;
  projectLeadId: string;
  inputKey: string;
  statuses: Prisma.IssueStatusCreateManyProjectInput[];
};
