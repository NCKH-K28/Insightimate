import { baseApi } from '@/lib/api';

// export const userApi = buildApi({
//   search: {
//     path: 'v2/users:search' as const,
//     method: 'get',
//     schemas: {
//       query: z.object({
//         search: z.string().min(1),
//         resourceType: z.enum(['WORKSPACE']).optional(),
//         resourceId: z.string().optional(),
//       }),
//     },
//   },
// });

// userApi.search({}, {});

export const userApi = {
  search: (params?: { search: string; resourceType?: 'WORKSPACE'; resourceId?: string }) => {
    return baseApi.get('v2/users:search', undefined, { params });
  },
};
