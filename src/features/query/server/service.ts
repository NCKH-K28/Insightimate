import { search } from './cqrs/q-search-v1';
import { search as searchV2 } from './cqrs/q-search-v2';

import { listBoards } from './cqrs/q-board-list';
import { listIssues } from './cqrs/q-issue-list';
import { listProjects } from './cqrs/q-project-list';

export const queryService = {
  search,
  semanticSearch: searchV2,

  listProjects,
  listIssues,
  listBoards,
};
