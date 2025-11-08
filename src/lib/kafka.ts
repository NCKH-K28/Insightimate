import { Kafka, logLevel } from 'kafkajs';
import get from 'lodash/get';
import set from 'lodash/set';
import { z } from 'zod';

const ZKafkaBroker = z.string().regex(/^[^:]+:\d+$/, 'Invalid broker format, expected host:port');
const ZKafkaBrokers = z.array(ZKafkaBroker);

const KAFKA_BROKERS = process.env.KAFKA_BROKERS ?? '';

const brokers = ZKafkaBrokers.parse(KAFKA_BROKERS.split(',').map((b) => b.trim()));
const clientId = 'insightimate-app';

const getKafka = async () => {
  const kafka = get(globalThis, 'kafkaInstance') as Kafka | undefined;
  if (kafka) return kafka;

  const newKafka = new Kafka({
    clientId,
    brokers,
    logLevel: logLevel.ERROR,
  });
  set(globalThis, 'kafkaInstance', newKafka);
  return newKafka;
};

const kafka = await getKafka();

export { kafka, getKafka };
