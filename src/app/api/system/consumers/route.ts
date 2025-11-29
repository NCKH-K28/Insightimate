// import kafka
import { NextResponse } from 'next/server';
import { kafka } from '@/lib/kafka';

const consumer = kafka.consumer({ groupId: 'issues-group' });
const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'issues', fromBeginning: true });

  // Xử lý tin nhắn
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (message.value) {
        console.log(`Received message: ${message.value.toString()}`);
      }
    },
  });
};

runConsumer().catch((error) => {
  console.error('Error running consumer:', error);
});

export const GET = async () => {
  return NextResponse.json({ ok: true, message: 'Kafka consumer is running' }, { status: 200 });
};
