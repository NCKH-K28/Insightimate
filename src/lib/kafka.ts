import serverConfig from '@/configs/server';
import { Kafka, logLevel } from 'kafkajs';
import get from 'lodash/get';
import set from 'lodash/set';

const kafkaConfig = serverConfig.kafka;
const brokers = kafkaConfig.brokers;
const clientId = kafkaConfig.clientId;

const getKafka = () => {
  const key = '__kafkaInstance_';
  const kafka = get(globalThis, key) as Kafka | undefined;
  if (kafka) return kafka;

  const newKafka = new Kafka({ clientId, brokers, logLevel: logLevel.ERROR });
  set(globalThis, key, newKafka);
  return newKafka;
};

const kafka = getKafka();
const kafkaClient = kafka;

export { kafka, getKafka };
export default kafkaClient;
