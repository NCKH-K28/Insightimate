'use client';

import React from 'react';

import { BoardView } from '../components/board-view/board-view';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/api/_client';
import { BoardIssueItem, SprintItem } from '@/contracts/boards/boards.query';
import { Toolbar } from '../components/tool-bar';

// ============================================================================
// Main Sprint Page Component
// ============================================================================
type BoardTabProps = {
  sprint: SprintItem;
  issues: BoardIssueItem[];
};

const BoardTab = ({ sprint, issues }: BoardTabProps) => {
  const { data: columns } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      const path = `/v2/boards/${sprint.boardId}/columns`;
      const response = await axiosInstance.get(path);
      const { data } = response.data;
      console.log('Columns data:', data);
      return data;
    },
  });

  return (
    <>
      <div className='flex-1 overflow-hidden'>
        <Toolbar
          filters={{ assignees: [], types: [], priorities: [], statuses: [] }}
          onCreateIssue={() => {}}
          searchQuery=''
          setFilters={() => {}}
          setSearchQuery={() => {}}
        />
        <BoardView columns={columns ?? []} items={issues} />
      </div>
    </>
  );
};

export default BoardTab;
