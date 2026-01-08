export const runtime = 'nodejs';
import serverConfig from '@/configs/server';
import axios from 'axios';

const debeziumConfig = serverConfig.debezium;
const debeziumAxios = axios.create({
  baseURL: debeziumConfig.apiURL,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json' },
});

type DebeziumConfig = { name: string; config: Record<string, string> };
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

const updateConnector = async ({ name, config }: DebeziumConfig) => {
  const res = await debeziumAxios.put(`/connectors/${name}/config`, config);
  return res.data;
};

export const debezium = {
  create: createConnector,
  delete: deleteConnector,
  getStatus: getConnectorStatus,
  update: updateConnector,
};
