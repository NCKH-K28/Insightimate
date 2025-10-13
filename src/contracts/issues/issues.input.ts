import z from 'zod';
import { ZIssue } from './issue';

export const ZIssueCreateInput = ZIssue.omit({ id: true, createdAt: true, updatedAt: true });
export const ZIssueUpdateInput = ZIssueCreateInput.partial();

export type IssueCreateInput = z.infer<typeof ZIssueCreateInput>;
export type IssueUpdateInput = z.infer<typeof ZIssueUpdateInput>;
