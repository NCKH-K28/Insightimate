import React from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Columns3,
  X,
  ListFilter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getContrastHexColor } from '@/lib/colord';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProjectImport } from '@/contracts/projects';

type FieldBadgeProps = { field?: { name: string; iconURL?: string | null; color?: string | null } };
const FieldBadge = (props: FieldBadgeProps) => {
  if (!props.field) {
    return (
      <Badge variant='outline' className='capitalize'>
        Unset
      </Badge>
    );
  }

  const { color: bgColor, contrast: textColor } = getContrastHexColor(props.field.color);

  return (
    <Badge className='capitalize' style={{ backgroundColor: bgColor, color: textColor }}>
      {props.field.iconURL && (
        <Image
          src={props.field.iconURL}
          alt={props.field.name}
          width={16}
          height={16}
          className='inline-block mr-1 rounded-sm'
        />
      )}
      {props.field.name}
    </Badge>
  );
};

// Empty State Component
type BacklogEmptyStateProps = {
  addIssueOpen: boolean;
  onAddIssueOpenChange: (open: boolean) => void;
};
const BacklogEmptyState = ({ onAddIssueOpenChange }: BacklogEmptyStateProps) => {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-8 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/30'>
      <div className='mb-6 p-4 rounded-full bg-primary/10'>
        <ListFilter className='w-10 h-10 text-primary' />
      </div>
      <h3 className='text-xl font-semibold mb-2'>No Backlog Items Yet</h3>
      <p className='text-sm text-muted-foreground text-center max-w-sm mb-6'>
        Your backlog is empty. Start by generating tasks with AI or adding them manually.
      </p>
      <div className='flex flex-row gap-3'>
        <Button type='button' className='gap-2'>
          <Sparkles className='w-4 h-4' />
          AI Generate
        </Button>
        <Button
          type='button'
          variant='outline'
          className='gap-2'
          onClick={() => onAddIssueOpenChange(true)}
        >
          <Plus className='w-4 h-4' />
          Add Task
        </Button>
      </div>
    </div>
  );
};

type SortableHeaderProps = {
  column: Column<Issue, unknown>;
  title: string;
};
const SortableHeader = ({ column, title }: SortableHeaderProps) => {
  const sorted = column.getIsSorted();

  return (
    <Button
      type='button'
      variant='ghost'
      size='sm'
      className='-ml-3 h-8 hover:bg-muted'
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {title}
      {sorted === 'asc' ? (
        <ArrowUp className='ml-2 h-4 w-4' />
      ) : sorted === 'desc' ? (
        <ArrowDown className='ml-2 h-4 w-4' />
      ) : (
        <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
      )}
    </Button>
  );
};

// Row Actions Component
type RowActionsProps = { issue: Issue; form: ProjectImportForm };
const RowActions = ({ issue, form }: RowActionsProps) => {
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const { remove } = useFieldArray({ control: form.control, name: 'issues' });

  const handleDelete = () => {
    const issueIndex = form.getValues('issues').findIndex((i) => i === issue);
    if (issueIndex !== -1) remove(issueIndex);
  };

  return (
    <>
      <IssueDialog
        mode='edit'
        issue={issue}
        form={form}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <div className='flex justify-end'>
        <Button variant='ghost' size='icon' onClick={() => setIsEditOpen(true)}>
          <Pencil />
          <span className='sr-only'>Edit Issue</span>
        </Button>
        <Button variant='ghost' size='icon' onClick={handleDelete}>
          <Trash2 className='text-destructive' />
          <span className='sr-only'>Delete Issue</span>
        </Button>
      </div>
    </>
  );
};

type BacklogPage = { pageSize: number; pageIndex: number };
const useBacklogPage = () => {
  const searchParams = useSearchParams();
  if (!searchParams)
    throw new Error('useSearchParams must be used within a Next.js Router context');

  const router = useRouter();

  const pageSize = parseInt(searchParams.get('backlogPageSize') || '10', 10);
  const pageIndex = parseInt(searchParams.get('backlogPage') || '0', 10);

  const [page, setPage] = React.useState<BacklogPage>({ pageSize, pageIndex });

  const updateURL = (newPage: BacklogPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('backlogPageSize', newPage.pageSize.toString());
    params.set('backlogPage', newPage.pageIndex.toString());
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  return { page, setPage, updateURL };
};

export default function BacklogTab() {
  'use no memo';

  const form = useFormContext<ProjectImport>();

  const types = useWatch({ control: form.control, name: 'types' });
  const statuses = useWatch({ control: form.control, name: 'statuses' });
  const priorities = useWatch({ control: form.control, name: 'priorities' });
  const issues = useWatch({ control: form.control, name: 'issues' });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Helper functions
  const getType = React.useCallback(
    (typeId: string) => types?.find((t) => t.id === typeId),
    [types],
  );

  const getStatus = React.useCallback(
    (statusId: string) => statuses?.find((s) => s.id === statusId),
    [statuses],
  );

  const getPriority = React.useCallback(
    (priorityId: string) => priorities?.find((p) => p.id === priorityId),
    [priorities],
  );

  const columns = React.useMemo<ColumnDef<Issue>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <SortableHeader column={column} title='ID' />,
        cell: ({ row }) => (
          <span className='font-mono text-xs text-muted-foreground'>#{row.getValue('id')}</span>
        ),
        size: 80,
      },
      {
        accessorKey: 'typeId',
        header: 'Type',
        cell: ({ row }) => <FieldBadge field={getType(row.getValue('typeId'))} />,
        size: 120,
      },
      {
        accessorKey: 'summary',
        header: ({ column }) => <SortableHeader column={column} title='Summary' />,
        cell: ({ row }) => (
          <div className='flex flex-col gap-1'>
            <span className='font-medium line-clamp-1'>{row.getValue('summary')}</span>
            {row.original.description && (
              <span className='text-xs text-muted-foreground line-clamp-1'>
                {row.original.description}
              </span>
            )}
          </div>
        ),
        size: 300,
      },
      {
        accessorKey: 'statusId',
        header: 'Status',
        cell: ({ row }) => <FieldBadge field={getStatus(row.getValue('statusId'))} />,
        size: 130,
      },
      {
        accessorKey: 'priorityId',
        header: ({ column }) => <SortableHeader column={column} title='Priority' />,
        cell: ({ row }) => <FieldBadge field={getPriority(row.getValue('priorityId'))} />,
        size: 120,
      },
      {
        accessorKey: 'estimate',
        header: 'Estimate',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>{JSON.stringify(row.getValue('estimate'))}</div>
        ),
        size: 120,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => <RowActions issue={row.original} form={form} />,
        size: 50,
      },
    ],
    [getType, getStatus, getPriority],
  );

  const { page, setPage, updateURL } = useBacklogPage();

  const table = useReactTable<Issue>({
    data: issues ?? [],
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: page,
    },
    onPaginationChange: (updater) => {
      setPage((old) => {
        const raw = typeof updater === 'function' ? updater(old) : updater;
        const totalRows = table.getFilteredRowModel().rows.length;

        const pageSize = raw.pageSize || old.pageSize || 10;
        const pageCount = pageSize > 0 ? Math.ceil(totalRows / pageSize) : 1;

        const maxPageIndex = Math.max(pageCount - 1, 0);
        const pageIndex = Math.max(0, Math.min(raw.pageIndex, maxPageIndex));

        const newPage = { pageSize, pageIndex };
        updateURL(newPage);
        return newPage;
      });
    },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const hasActiveFilters = globalFilter || columnFilters.length > 0;

  const [addIssueOpen, setAddIssueOpen] = React.useState(false);

  if (issues?.length === 0) {
    return (
      <>
        <IssueDialog mode='add' form={form} isOpen={addIssueOpen} onOpenChange={setAddIssueOpen} />
        <BacklogEmptyState addIssueOpen={addIssueOpen} onAddIssueOpenChange={setAddIssueOpen} />
      </>
    );
  }

  return (
    <>
      <IssueDialog mode='add' form={form} isOpen={addIssueOpen} onOpenChange={setAddIssueOpen} />

      <div className='flex h-full w-full flex-col gap-4'>
        <div className='shrink-0 '>
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            {/* Search and Filters */}
            <div className='flex flex-1 items-center gap-2 w-full sm:w-auto flex-wrap'>
              <div className='relative flex-1 sm:flex-initial'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search issues...'
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className='pl-9 w-full sm:w-[300px]'
                />
                {globalFilter && (
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6'
                    onClick={() => setGlobalFilter('')}
                  >
                    <X className='h-3 w-3' />
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <Select
                value={(table.getColumn('statusId')?.getFilterValue() as string) ?? 'all'}
                onValueChange={(value) =>
                  table.getColumn('statusId')?.setFilterValue(value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  {statuses?.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select
                value={(table.getColumn('priorityId')?.getFilterValue() as string) ?? 'all'}
                onValueChange={(value) =>
                  table.getColumn('priorityId')?.setFilterValue(value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className='w-[140px]'>
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priority</SelectItem>
                  {priorities?.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      {priority.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className='flex items-center gap-2 flex-shrink-0'>
              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <Columns3 className='h-4 w-4' />
                    <span className='hidden sm:inline'>Columns</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-40'>
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        className='capitalize'
                      >
                        {column.id === 'statusId'
                          ? 'Status'
                          : column.id === 'priorityId'
                            ? 'Priority'
                            : column.id === 'typeId'
                              ? 'Type'
                              : column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size='sm' className='gap-2' onClick={() => setAddIssueOpen(true)}>
                <Plus className='h-4 w-4' />
                <span className='hidden sm:inline'>Add Issue</span>
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className='flex items-center gap-2 flex-wrap mt-4'>
              <span className='text-sm text-muted-foreground'>Active filters:</span>
              {globalFilter && (
                <Badge variant='secondary' className='gap-1'>
                  Search: {globalFilter}
                  <X className='h-3 w-3 cursor-pointer' onClick={() => setGlobalFilter('')} />
                </Badge>
              )}
              {columnFilters.map((filter) => (
                <Badge key={filter.id} variant='secondary' className='gap-1'>
                  {filter.id}: {String(filter.value)}
                  <X
                    className='h-3 w-3 cursor-pointer'
                    onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}
                  />
                </Badge>
              ))}
              <Button
                variant='ghost'
                size='sm'
                className='h-6 px-2 text-xs'
                onClick={() => {
                  setGlobalFilter('');
                  setColumnFilters([]);
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className='flex-1 min-h-0 rounded-lg border bg-card overflow-hidden'>
          <div className='h-full overflow-auto'>
            <table className='w-full'>
              <thead className='sticky top-0 z-10 bg-muted/50'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className='border-b'>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50 cursor-pointer',
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className='px-4 py-3 align-middle'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className='h-32 text-center text-muted-foreground'>
                      <div className='flex flex-col items-center gap-2'>
                        <Filter className='h-8 w-8 opacity-50' />
                        <p>No results found. </p>
                        <Button
                          variant='link'
                          size='sm'
                          onClick={() => {
                            setGlobalFilter('');
                            setColumnFilters([]);
                          }}
                        >
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className='shrink-0 bg-card flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='text-sm text-muted-foreground'>
            Showing{' '}
            <span className='font-medium'>
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className='font-medium'>
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}
            </span>{' '}
            of <span className='font-medium'>{table.getFilteredRowModel().rows.length}</span>{' '}
            results
          </div>

          <div className='flex items-center gap-2'>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className='w-[110px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='flex items-center gap-1'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>First page</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous page</TooltipContent>
              </Tooltip>

              <div className='flex items-center gap-1 px-2'>
                <span className='text-sm font-medium'>
                  {table.getState().pagination.pageIndex + 1}
                </span>
                <span className='text-sm text-muted-foreground'>/</span>
                <span className='text-sm text-muted-foreground'>{table.getPageCount()}</span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next page</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Last page</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
