// features/projects/state/project-draft.with-expiry.ts
import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage, RESET } from 'jotai/utils';
import { atomFamily } from 'jotai-family';

import type { ProjectImport } from '@/contracts/projects';

const STORAGE_KEY = 'cap1.projectDrafts.v1';
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1h

type DraftItem = {
  data: ProjectImport;
  expiresAt: number; // epoch ms
};

type DraftState = {
  drafts: Record<string, DraftItem>;
};

const initialState: DraftState = { drafts: {} };

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

function isExpired(item: DraftItem, now = Date.now()) {
  return item.expiresAt <= now;
}

function prune(state: DraftState, now = Date.now()): DraftState {
  const drafts: DraftState['drafts'] = {};
  for (const [id, item] of Object.entries(state.drafts ?? {})) {
    if (!isExpired(item, now)) drafts[id] = item;
  }
  return { drafts };
}

const base = createJSONStorage<DraftState>(() =>
  typeof window === 'undefined' ? noopStorage : window.localStorage,
);

// prune khi read/write để localStorage không phình + không giữ data hết hạn
const storage = {
  ...base,
  getItem: (key: string, initialValue: DraftState) => {
    const raw = base.getItem(key, initialValue);
    if (!raw || typeof raw !== 'object') return initialValue;
    return prune(raw as DraftState);
  },
  setItem: (key: string, value: DraftState) => {
    base.setItem(key, prune(value));
  },
};

export const projectDraftStateAtom = atomWithStorage<DraftState>(
  STORAGE_KEY,
  initialState,
  storage,
  { getOnInit: true },
);

export const projectDraftByIdAtomFamily = atomFamily((id: string) =>
  atom((get) => {
    const item = get(projectDraftStateAtom).drafts[id];
    if (!item) return null;
    if (isExpired(item)) return null;
    return item.data;
  }),
);

export const upsertProjectDraftAtom = atom(
  null,
  (get, set, payload: { id: string; data: ProjectImport; expiresAt?: number; ttlMs?: number }) => {
    const state = get(projectDraftStateAtom);

    const expiresAt =
      payload.expiresAt ??
      (typeof payload.ttlMs === 'number'
        ? Date.now() + payload.ttlMs
        : Date.now() + DEFAULT_TTL_MS);

    set(projectDraftStateAtom, {
      drafts: {
        ...state.drafts,
        [payload.id]: { data: payload.data, expiresAt },
      },
    });
  },
);

export const removeProjectDraftAtom = atom(null, (get, set, id: string) => {
  const state = get(projectDraftStateAtom);
  const { [id]: _removed, ...rest } = state.drafts;
  set(projectDraftStateAtom, { drafts: rest });
});

export const pruneExpiredProjectDraftsAtom = atom(null, (get, set) => {
  set(projectDraftStateAtom, prune(get(projectDraftStateAtom)));
});

export const clearAllProjectDraftsAtom = atom(null, (_get, set) => {
  set(projectDraftStateAtom, RESET);
});

export { RESET };
