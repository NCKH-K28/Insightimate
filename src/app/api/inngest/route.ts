import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { helloWorld } from './functions';
import { analyzeDocument } from '@/features/agents/server/jobs/analyze-doc';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld, analyzeDocument],
});
