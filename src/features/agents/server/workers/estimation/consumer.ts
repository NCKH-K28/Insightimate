// src/workers/analyze-document/consumer.ts
import { kafka } from '@/lib/kafka';
import { AnalysisMsg } from './schema';
import { analyzeDocumentHandler } from './handler';

export default async function startAnalyzeDocumentConsumer() {
  const consumer = kafka.consumer({ groupId: 'analyze-document-group' });
  let shuttingDown = false;

  await consumer.connect();
  await consumer.subscribe({ topic: 'agents.analysis.created', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (shuttingDown) return;
      try {
        const raw = message.value?.toString();
        console.log('[analyzeDocument] received:', raw);
        if (!raw) return;

        const parsed = AnalysisMsg.safeParse(JSON.parse(raw));
        if (!parsed.success) {
          console.error('[analyzeDocument] invalid payload', parsed.error.flatten());
          return;
        }

        await analyzeDocumentHandler(parsed.data);
      } catch (e) {
        console.error('[analyzeDocument] error:', e);
      }
    },
  });

  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await consumer.disconnect();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
