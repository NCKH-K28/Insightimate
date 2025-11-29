/* eslint-disable react-hooks/incompatible-library */

import {
  getBoardIssueFacetsQueryOptions,
  getBoardQueryOptions,
  listBoardIssuesQueryOptions,
} from '@/features/boards/api/actions';
import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnFilter } from '@/components/table';
import { useIssuesToScrumRows } from '@/features/boards/hooks';
import { issueColumns } from '@/features/boards/ui/tables/issue-column';
import BacklogLayout from './backlog-layout';

const BacklogSkeleton = () => {
  return (
    <div className='w-full space-y-4'>
      <Skeleton className='h-8 w-1/3' />
      <div className='space-y-2'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-12 w-full' />
        ))}
      </div>
    </div>
  );
};

type BacklogTabProps = {
  params: { boardId: string; projectId: string; workspaceId: string };
};
export const BacklogTab = ({ params }: BacklogTabProps) => {
  const boardId = params.boardId;
  const { data: board } = useQuery(getBoardQueryOptions(boardId));
  const { data: issues, isPending } = useQuery(
    listBoardIssuesQueryOptions(boardId, {
      filter: { type: 'SCRUM', issueType: { hierarchy: 1 } },
    }),
  );

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

    if (issueFacets.assignees) {
      filters.push({
        type: 'faceted',
        columnKey: 'assigneeId',
        title: 'Assignee',
        options: issueFacets.assignees,
      });
    }

    return filters;
  }, [issueFacets]);

  const tableConfig = useMemo(
    () => ({
      searchPlaceholder: 'Search projects...',
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

  const tableRows = table.getRowModel().rows;

  const filtered = useMemo(() => {
    return tableRows.map((row) => row.original);
  }, [tableRows]);

  const rows = useIssuesToScrumRows(params, filtered, board?.sprints || []);

  if (isPending) return <BacklogSkeleton />;

  return <BacklogLayout table={table} tableConfig={tableConfig} rows={rows} params={params} />;
};

export default BacklogTab;
