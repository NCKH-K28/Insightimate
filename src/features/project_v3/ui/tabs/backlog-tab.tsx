/* eslint-disable react-hooks/incompatible-library */
'use client';

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
  type Table,
} from '@tanstack/react-table';
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { type ColumnFilter, DataTableToolbar } from '@/components/table';
import { useIssuesToScrumRows } from '@/features/boards/hooks';
import { issueColumns } from '@/features/boards/ui/tables/issue-column';
import { ScrumBoard, type ScrumRowProps } from '@/features/boards/ui/containers/scrum/scrum-board';
import { EpicsPanel } from '@/features/boards/ui/containers/scrum/scrum-epic-panel';

// ==================== Inline BacklogLayout ====================
// Previously lived at wps/[...]/backlog-layout which was deleted during v2→v3 migration.

type BacklogLayoutProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: Table<any>;
  tableConfig: { searchPlaceholder?: string; searchColumn?: string; filters?: ColumnFilter[] };
  rows: ScrumRowProps[];
  params: { boardId: string; projectId: string; orgSlug: string };
};

function BacklogLayout({ table, tableConfig, rows, params }: BacklogLayoutProps) {
  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} config={tableConfig} />
      <div className='flex gap-4'>
        <EpicsPanel params={params} className='w-64 shrink-0 rounded-lg border' />
        <div className='flex-1 min-w-0'>
          <ScrumBoard rows={rows} />
        </div>
      </div>
    </div>
  );
}

const BacklogSkeleton = () => (
  <div className='w-full space-y-4'>
    <Skeleton className='h-8 w-1/3' />
    <div className='space-y-2'>
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className='h-12 w-full' />
      ))}
    </div>
  </div>
);

type BacklogTabProps = { params: { boardId: string; projId: string } };

export function BacklogTab({ params }: BacklogTabProps) {
  const { boardId, projId } = params;
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
    if (issueFacets.types)
      filters.push({
        type: 'faceted',
        columnKey: 'typeId',
        title: 'Type',
        options: issueFacets.types,
      });
    if (issueFacets.priorities)
      filters.push({
        type: 'faceted',
        columnKey: 'priorityId',
        title: 'Priority',
        options: issueFacets.priorities,
      });
    if (issueFacets.statuses)
      filters.push({
        type: 'faceted',
        columnKey: 'statusId',
        title: 'Status',
        options: issueFacets.statuses,
      });
    if (issueFacets.assignees)
      filters.push({
        type: 'faceted',
        columnKey: 'assigneeId',
        title: 'Assignee',
        options: issueFacets.assignees,
      });
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

  const tableRows = table.getRowModel().rows;
  const filtered = useMemo(() => tableRows.map((row) => row.original), [tableRows]);

  // BacklogLayout & useIssuesToScrumRows expect { boardId, projectId, orgSlug }
  const legacyParams = { boardId, projectId: projId, orgSlug: '' };
  const rows = useIssuesToScrumRows(legacyParams, filtered, board?.sprints || []);

  if (isPending) return <BacklogSkeleton />;

  return (
    <BacklogLayout table={table} tableConfig={tableConfig} rows={rows} params={legacyParams} />
  );
}
