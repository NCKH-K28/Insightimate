import axiosInstance from '@/lib/api/_client';

import type * as SchemaV1 from '@/contracts/query/schema-v1';
import type * as SchemaV2 from '@/contracts/query/schema-v2';

export const queryApi = {
  search: async (input: SchemaV1.SearchInput): Promise<SchemaV1.SearchOutput> => {
    try {
      const response = await axiosInstance.get<SchemaV1.SearchOutput>('v1/search', {
        params: input,
      });
      return response.data;
    } catch (error) {
      console.error('Error during search API call:', error);
      throw error;
    }
  },
  searchV2: async (input: SchemaV2.SearchInput): Promise<SchemaV2.SearchOutput> => {
    const response = await axiosInstance.get<SchemaV2.SearchOutput>('v2/search', { params: input });
    return response.data;
  },
};
