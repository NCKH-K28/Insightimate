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
import { ColumnFilter, DataTableToolbar } from '@/components/table';
import { useIssuesToScrumRows } from '@/features/boards/hooks';
import { ScrumBoard } from '@/features/boards/ui/components';
import { issueColumns } from '@/features/boards/ui/tables/issue-column';

type BacklogTabProps = {
  params: { boardId: string; projectId: string; workspaceId: string };
};
export const BacklogTab = ({ params }: BacklogTabProps) => {
  const boardId = params.boardId;
  const { data: board } = useQuery(getBoardQueryOptions(boardId));
  const { data: issues } = useQuery(
    listBoardIssuesQueryOptions(boardId, { params: { filter: { type: 'SCRUM' } } }),
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

  const tableRows = useMemo(() => table.getRowModel().rows, [table.getRowModel().rows]);

  const filtered = useMemo(() => {
    return tableRows.map((row) => row.original);
  }, [tableRows]);

  const rows = useIssuesToScrumRows(params, filtered, board?.sprints || []);

  return (
    <div className='w-full'>
      <div className='w-full px-4 py-2'>
        <DataTableToolbar table={table} config={tableConfig} />
      </div>
      <ScrumBoard rows={rows} />
    </div>
  );
};

export default BacklogTab;
