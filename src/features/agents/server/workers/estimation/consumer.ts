import { kafka } from '@/lib/kafka';
import { AnalysisMsg } from './schema';
import { analyzeDocumentHandler } from './handler';
import { logger } from '@/lib/winston';

export default async function startAnalyzeDocumentConsumer() {
  const consumer = kafka.consumer({ groupId: 'analyze-document-group' });
  let shuttingDown = false;
  const fromBeginning = false;

  await consumer.connect();
  await consumer.subscribe({ topic: 'agents.analysis.created', fromBeginning });

  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      if (shuttingDown) return;

      const commit = async () => {
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (Number(message.offset) + 1).toString(),
          },
        ]);
      };

      try {
        const raw = message.value?.toString();
        if (!raw) throw new Error('Empty message value');

        const parsed = AnalysisMsg.parse(JSON.parse(raw));

        await analyzeDocumentHandler(parsed);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        logger.error({ message: 'Error processing analyze document message', error: msg });
        if (msg.includes('[not-found]')) await commit();
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
