import { atom } from 'jotai';
import { ZProjectImport } from '@/contracts/project';
import { z } from 'zod';

// === Define Zod schemas for the context state ===
const ZEstimation = z.object({
  input: ZProjectImport.partial().optional(),
  output: z.any().optional(),
});
const ZEstimationTab = z.object({
  tabId: z.string(),
  tabName: z.string().optional(),
  estimation: ZEstimation.optional(),
});

const ZContext = z.object({
  type: z.enum(['file', 'text']),
  label: z.string(),
  value: z.string(),
  iconURL: z.string().optional(),
  meta: z.any().optional(),
  isLoading: z.boolean().optional(),
});

export const ZProjectImportState = z.object({
  estimationTabs: z.array(ZEstimationTab),
  project: ZProjectImport,
  contexts: z.array(ZContext),
  instruction: z.string(),
});

export type Estimation = z.infer<typeof ZEstimation>;
export type EstimationTab = z.infer<typeof ZEstimationTab>;
export type Context = z.infer<typeof ZContext>;
export type ProjectImportState = z.infer<typeof ZProjectImportState>;

import { focusAtom } from 'jotai-optics';
import { defaultProject } from '../constants';

export const projectImportStateAtom = atom<ProjectImportState>({
  estimationTabs: [{ tabId: 'tab-0', tabName: 'Estimation' }],
  instruction: '',
  project: defaultProject,
  contexts: [],
});

export const instructionAtom = focusAtom(projectImportStateAtom, (o) => o.prop('instruction'));
export const estimationTabsAtom = focusAtom(projectImportStateAtom, (o) =>
  o.prop('estimationTabs'),
);
export const contextsAtom = focusAtom(projectImportStateAtom, (o) => o.prop('contexts'));
export const projectAtom = focusAtom(projectImportStateAtom, (o) => o.prop('project'));
