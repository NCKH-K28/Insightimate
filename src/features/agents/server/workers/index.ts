export const runtime = 'nodejs';

import get from 'lodash/get';
import set from 'lodash/set';

import { syncProject } from './sync-project';
import { startAnalyzeDocumentConsumer } from './analyze-doc';

export const main = async () => {
  await Promise.all([startAnalyzeDocumentConsumer(), syncProject()]);
};

const runMain = async () => {
  const mainInstance = get(globalThis, '__AGENTS_MAIN__');
  if (mainInstance) return mainInstance;

  const newMainInstance = main();
  set(globalThis, '__AGENTS_MAIN__', newMainInstance);
  return newMainInstance;
};

runMain();
