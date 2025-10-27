export * from './search.schema';
import axiosInstance from '@/lib/api/_client';
import { SearchInput, SearchOutput } from './search.schema';

export const queryApi = {
  search: async (input: SearchInput): Promise<SearchOutput> => {
    try {
      const response = await axiosInstance.get<SearchOutput>(
        'http://localhost:3000/api/v2/search',
        { params: input },
      );
      return response.data;
    } catch (error) {
      console.error('Error during search API call:', error);
      throw error;
    }
  },
};
