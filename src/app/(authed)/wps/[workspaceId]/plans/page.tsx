'use client';
import '@xyflow/react/dist/style.css';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';

import React from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTable, DataTableToolbar } from '@/components/table';
import { Plan } from '@/core/plan';
import { planColumns } from '@/components/plan/table/plan-table-column';
import { useRouter } from 'next/navigation';
import { PlusSquareIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchPlansQueryOption } from '@/components/plan/hooks/use-plan';

export default function PlansPage() {
  const router = useRouter();

  const fetchPlans = useQuery({ ...fetchPlansQueryOption() });

  const table = useReactTable<Plan>({
    columns: planColumns,
    data: fetchPlans.data || [],
    state: { columnVisibility: { id: false, createdAt: false, updatedAt: false } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <section>
      <DataTableToolbar
        table={table}
        config={{
          actions: [
            {
              label: <PlusSquareIcon />,
              onClick: () => router.push('/plans/create'),
            },
          ],
        }}
      />
      <DataTable table={table} />
    </section>
  );
}
