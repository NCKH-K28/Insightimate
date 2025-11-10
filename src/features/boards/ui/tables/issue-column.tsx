 

import { ColumnDef, createColumnHelper } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { IssueStatusCell } from './cells/issue-status-cell';
import { IssuePriorityCell } from './cells/issue-priority-cell';
import { IssueAssigneeCell } from './cells/issue-assignee-cell';
import { IssueTypeCell } from './cells/issue-type-cell';
import { IssueDueDateCell, IssueStartDateCell } from './cells/issue-date-cell';
import { BoardIssueList } from '@/contracts/boards/boards.query';

type IssueItem = BoardIssueList['data'][number];
const columnHelper = createColumnHelper<IssueItem>();
type CellType = ColumnDef<IssueItem>['cell'];

const createMultiSelectFilterFn = () => {
  return (row: any, id: string, filterValue: any) => {
    const cellValue = row.getValue(id);
    if (!filterValue) return true;
    if (Array.isArray(filterValue)) {
      return filterValue.length === 0 || filterValue.includes(cellValue);
    }
    return cellValue === filterValue;
  };
};
const multiSelectFilterFn = createMultiSelectFilterFn();

const IssueKeyCell: CellType = ({ row }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant='link' size='sm' className='p-0'>
          {row.original.key}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{row.original.key}</SheetTitle>
          <SheetDescription>{row.original.summary}</SheetDescription>
        </SheetHeader>
        {/* <IssueEditForm
          issueId={row.original.id}
          projectId={row.original.projectId}
          onSubmit={(data) => console.log(data)}
        /> */}
        <SheetFooter>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const IssueSummaryCell: CellType = ({ row }) => {
  return <span className='text-blue-600 hover:underline truncate'>{row.original.summary}</span>;
};

export const issueColumns = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
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
    size: 30,
  }),
  columnHelper.accessor('typeId', {
    header: 'Type',
    cell: IssueTypeCell,
    size: 100,
    filterFn: multiSelectFilterFn,
  }),
  columnHelper.accessor('key', {
    header: 'Key',
    cell: IssueKeyCell,
    size: 100,
  }),
  columnHelper.accessor('summary', { header: 'Summary', cell: IssueSummaryCell }),
  columnHelper.accessor('statusId', {
    header: 'Status',
    cell: IssueStatusCell,
    size: 100,
    filterFn: multiSelectFilterFn,
  }),
  columnHelper.accessor('priorityId', {
    header: 'Priority',
    cell: IssuePriorityCell,
    size: 100,
    filterFn: multiSelectFilterFn,
  }),
  columnHelper.accessor('assigneeId', {
    header: 'Assignee',
    cell: IssueAssigneeCell,
    size: 100,
    filterFn: multiSelectFilterFn,
  }),
  columnHelper.accessor('dueDate', {
    header: 'Due Date',
    cell: IssueDueDateCell,
    size: 100,
  }),
  columnHelper.accessor('startDate', { header: 'Start Date', cell: IssueStartDateCell, size: 100 }),
  columnHelper.accessor('createdAt', {
    header: 'Created At',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
    size: 100,
  }),
  columnHelper.accessor('updatedAt', {
    header: 'Updated At',
    cell: ({ row }) => format(new Date(row.original.updatedAt), 'MMM dd, yyyy'),
    size: 100,
  }),
];
