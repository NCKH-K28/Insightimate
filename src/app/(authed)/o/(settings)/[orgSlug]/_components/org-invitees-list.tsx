'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { OrgInvitationItem } from '@/contracts/organization/organization.query';
import { Skeleton } from '@/components/ui/skeleton';
import { useNoMemoTable } from '@/hooks/use-nomemo-table';

export const ROLE_LABELS: Record<string, string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

type Invitee = OrgInvitationItem;

type BuildColumnsParams = {
  onResend?: (invite: Invitee) => void;
  onRevoke?: (invite: Invitee) => void;
};

export const buildColumns = ({ onResend, onRevoke }: BuildColumnsParams): ColumnDef<Invitee>[] => {
  const columns: ColumnDef<Invitee>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'email',

      header: () => <span>Email</span>,
      cell: ({ row }) => {
        return <span>{row.getValue('email')}</span>;
      },
    },
    {
      accessorKey: 'role',
      header: () => <span>Role</span>,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return <span>{ROLE_LABELS[role] || role}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => <span>Invited At</span>,
      cell: ({ row }) => {
        const createdAt = row.original.createdAt;
        if (!createdAt) return <span>-</span>;
        const date = new Date(createdAt);
        return <span>{formatDistanceToNow(date, { addSuffix: true })}</span>;
      },
    },
    {
      id: 'actions',
      header: () => <span>Actions</span>,
      cell: ({ row }) => {
        const invite = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onResend?.(invite)}>
                Resend Invitation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRevoke?.(invite)} className='text-red-600'>
                Revoke Invitation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
};

type OrgInviteesListProps = {
  invitees: Invitee[];
  roleOptions?: string[];
  onResend?: (invite: Invitee) => void;
  onRevoke?: (invite: Invitee) => void;
};

export function OrgInviteesList({
  invitees,
  roleOptions,
  onResend,
  onRevoke,
}: OrgInviteesListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns = React.useMemo(() => buildColumns({ onResend, onRevoke }), [onResend, onRevoke]);

  const table = useNoMemoTable({
    data: invitees,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between pb-4'>
        <h3 className='text-lg font-medium'>Pending Invitations</h3>
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No pending invitations.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export const OrgInviteesListSkeleton: React.FC = () => {
  return (
    <div className='w-full space-y-3'>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className='h-4 w-12 rounded-md' />
              </TableHead>
              <TableHead>
                <Skeleton className='h-4 w-24 rounded-md' />
              </TableHead>
              <TableHead>
                <Skeleton className='h-4 w-16 rounded-md' />
              </TableHead>
              <TableHead>
                <Skeleton className='h-4 w-20 rounded-md' />
              </TableHead>
              <TableHead>
                <Skeleton className='h-4 w-16 rounded-md' />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className='h-6 w-6 rounded-md' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-48 rounded-md' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-20 rounded-md' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-24 rounded-md' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-6 w-6 rounded-md' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-end space-x-2 py-2'>
        <Skeleton className='h-8 w-20 rounded-md' />
        <Skeleton className='h-8 w-20 rounded-md' />
      </div>
    </div>
  );
};
