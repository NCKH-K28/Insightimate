import type { ActivityEventWithActor } from '@/contracts/activity';

export type ChangeEntry = {
  field: string;
  old?: unknown;
  new?: unknown;
  oldLabel?: string;
  newLabel?: string;
};

export type ActionRendererProps = {
  change: ChangeEntry;
  event: ActivityEventWithActor;
};
