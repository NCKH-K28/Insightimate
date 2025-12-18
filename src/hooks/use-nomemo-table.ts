import { useReactTable } from '@tanstack/react-table';

type useReactTableType = typeof useReactTable;
export const useNoMemoTable: useReactTableType = (options) => {
  'use no memo';

  // eslint-disable-next-line react-hooks/incompatible-library
  return useReactTable(options);
};
