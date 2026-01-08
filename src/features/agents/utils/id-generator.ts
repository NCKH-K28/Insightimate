import { createId } from '@paralleldrive/cuid2';

export const genAgentId = <P extends string = 'agent'>(prefix: P = 'agent' as P) =>
  `${prefix}_${createId()}`;
export const genDataSourceId = <P extends string = 'datasource'>(prefix: P = 'datasource' as P) =>
  `${prefix}_${createId()}`;
export const genFileRefId = <P extends string = 'fileref'>(prefix: P = 'fileref' as P) =>
  `${prefix}_${createId()}`;
export const genAnalysisId = <P extends string = 'analysis'>(prefix: P = 'analysis' as P) =>
  `${prefix}_${createId()}`;
