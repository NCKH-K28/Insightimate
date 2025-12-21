/* eslint-disable react-hooks/incompatible-library */

'use client';

import {
  getBoardIssueFacetsQueryOptions,
  listBoardIssuesQueryOptions,
} from '@/features/boards/api/actions';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { ColumnFilter, DataTableToolbar } from '@/components/table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { issueColumns } from '@/features/boards/ui/tables/issue-column';
import { DottedSeparator } from '@/components/dotted-separator';
import { DataKanban } from '@/features/boards/ui/containers/kanban/data-kanban';
import { CreateStatusButton } from '@/features/projects/ui/buttons/create-status-btn';

type KanbanTabProps = {
  params: { boardId: string; projectId: string; workspaceId: string };
};

export const KanbanTab = ({ params }: KanbanTabProps) => {
  const boardId = params.boardId;
  const { data: issues } = useQuery(listBoardIssuesQueryOptions(boardId));
  const { data: issueFacets } = useQuery(getBoardIssueFacetsQueryOptions(boardId));

  const filterOptions = useMemo<ColumnFilter[]>(() => {
    if (!issueFacets) return [];
    const filters: ColumnFilter[] = [];

    if (issueFacets.types) {
      filters.push({
        type: 'faceted',
        columnKey: 'typeId',
        title: 'Type',
        options: issueFacets.types,
      });
    }

    if (issueFacets.priorities) {
      filters.push({
        type: 'faceted',
        columnKey: 'priorityId',
        title: 'Priority',
        options: issueFacets.priorities,
      });
    }

    if (issueFacets.statuses) {
      filters.push({
        type: 'faceted',
        columnKey: 'statusId',
        title: 'Status',
        options: issueFacets.statuses,
      });
    }

    return filters;
  }, [issueFacets]);

  const tableConfig = useMemo(
    () => ({
      searchPlaceholder: 'Search issues...',
      searchColumn: 'summary',
      filters: filterOptions,
    }),
    [filterOptions],
  );

  const table = useReactTable({
    data: issues ?? [],
    columns: useMemo(() => issueColumns, []),
    state: { columnVisibility: { id: false } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className='w-full'>
      <div className='w-full px-4 py-2'>
        <DataTableToolbar table={table} config={tableConfig} />
      </div>
      <DottedSeparator />
      <div className='flex justify-end px-4 pt-4 pb-2'>
        <CreateStatusButton projectId={params.projectId} variant='default' size='sm' />
      </div>
      <div className='px-4 pb-4'>
        <DataKanban data={issues ?? []} projectId={params.projectId} boardId={params.boardId} />
      </div>
    </div>
  );
};

export default KanbanTab;
