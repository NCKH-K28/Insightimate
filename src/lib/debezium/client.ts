export const runtime = 'nodejs';
import axios from 'axios';

const DEBEZIUM_HOST = process.env.DEBEZIUM_HOST || 'http://localhost:8083';
const debeziumAxios = axios.create({
  baseURL: DEBEZIUM_HOST,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json' },
});

type DebeziumConfig = {
  name: string;
  config: Record<string, string>;
};

const deleteConnector = async (name: string) => {
  await debeziumAxios.delete(`/connectors/${name}`);
};

const getConnectorStatus = async (name: string) => {
  const res = await debeziumAxios.get(`/connectors/${name}/status`);
  return res.data;
};

const createConnector = async (config: DebeziumConfig) => {
  const res = await debeziumAxios.post('/connectors', config);
  return res.data;
};

const updateConnector = async (config: DebeziumConfig) => {
  const { name, ...restConfig } = config;
  const res = await debeziumAxios.put(`/connectors/${name}/config`, restConfig);
  return res.data;
};

export const debezium = {
  create: createConnector,
  delete: deleteConnector,
  getStatus: getConnectorStatus,
  update: updateConnector,
};
