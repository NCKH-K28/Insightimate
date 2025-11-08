import z from 'zod';
import { ZIssue, ZIssueStatus } from './issue';

export const ZIssueCreateInput = ZIssue.omit({ id: true, createdAt: true, updatedAt: true });
export const ZIssueUpdateInput = ZIssueCreateInput.partial();

// Schema for creating issue status
export const ZIssueStatusCreateInput = ZIssueStatus.omit({ id: true, projectId: true });
export const ZIssueStatusUpdateInput = ZIssueStatusCreateInput.partial();

export type IssueCreateInput = z.infer<typeof ZIssueCreateInput>;
export type IssueUpdateInput = z.infer<typeof ZIssueUpdateInput>;
export type IssueStatusCreateInput = z.infer<typeof ZIssueStatusCreateInput>;
export type IssueStatusUpdateInput = z.infer<typeof ZIssueStatusUpdateInput>;
