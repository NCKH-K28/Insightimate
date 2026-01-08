'use client';

import React from 'react';

import { BoardIssueItem, SprintItem } from '@/contracts/boards/board.query';
import { Toolbar } from '../components/tool-bar';
import { ListView } from '../components/list-view/list-view';

// ============================================================================
// Main Sprint Page Component
// ============================================================================
type ListTabProps = {
  sprint: SprintItem;
  issues: BoardIssueItem[];
};

const ListTab = ({ sprint, issues }: ListTabProps) => {
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
        <ListView issues={issues} />
      </div>
    </>
  );
};

export default ListTab;
