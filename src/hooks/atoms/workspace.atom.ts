import { atomWithStorage } from 'jotai/utils';

export const selectedWorkspaceIdAtom = atomWithStorage<string | null>(
  'selectedWorkspaceId',
  null,
  {
    getItem: (key) => {
      if (typeof window === 'undefined') return null;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    },
    setItem: (key, value) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    },
    removeItem: (key) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    },
  },
  { getOnInit: true },
);
