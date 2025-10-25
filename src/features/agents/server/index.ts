import { sub } from './subs/sub-project';

await sub().then(() => {
  console.log('[agent-source-service] Subscriptions initialized');
});
