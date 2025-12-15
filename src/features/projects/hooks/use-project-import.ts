import { useForm, UseFormReturn } from 'react-hook-form';
import { ZProjectImport } from '@/contracts/projects/project-import.input';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';

type ProjectImport = z.infer<typeof ZProjectImport>;
export type UseProjectImportForm = UseFormReturn<ProjectImport>;

export const useProjectImport = () => {
  const form = useForm({
    resolver: zodResolver(ZProjectImport),
    defaultValues: {
      metadata: {},
      project: {
        id: '',
        key: '',
        name: '',
        description: null,
        avatar: null,
        createdAt: '',
        updatedAt: '',
        leadId: '',

        actors: [],
        roles: [],
        types: [],
        priorities: [],
        statuses: [],
        issues: [],
      },
    },
  });

  return { form };
};
