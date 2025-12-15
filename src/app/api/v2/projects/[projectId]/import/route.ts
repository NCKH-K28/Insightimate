import { ZIssue, ZIssuePriority, ZIssueStatus, ZIssueType } from '@/contracts/issues/issue';
import { ZProjectRole } from '@/contracts/projects';
import { compose } from '@/lib/http/api-compose';
import countBy from 'lodash/countBy';
import z from 'zod';

//

export const GET = compose<{ projectId: string }>((req) => {
  const { projectId } = req.params;
});
