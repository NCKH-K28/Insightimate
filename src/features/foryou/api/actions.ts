import { foryouApi } from './http';

export const fetchWorkedItems = async (workspaceId?: string) => {
  const ctx = { workspaceId: workspaceId ?? 'global' } as const;
  const res = await foryouApi.worked(ctx);
  return res.items ?? [];
};

export const fetchWorkedItemsQueryOptions = (workspaceId?: string) => ({
  queryKey: ['foryou', 'worked', workspaceId ?? 'global'],
  queryFn: () => fetchWorkedItems(workspaceId),
  staleTime: 1000 * 60, 
});

export const fetchAssignedItems = async (workspaceId?: string) => {
  const ctx = { workspaceId: workspaceId ?? 'global' } as const;
  const res = await foryouApi.assigned(ctx);
  return res.items ?? [];
};

export const fetchAssignedItemsQueryOptions = (workspaceId?: string) => ({
  queryKey: ['foryou', 'assigned', workspaceId ?? 'global'],
  queryFn: () => fetchAssignedItems(workspaceId),
  staleTime: 1000 * 60,
});
