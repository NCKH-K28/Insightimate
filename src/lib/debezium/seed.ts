import { debezium } from './client';
import { elasticsearchSinkConfig, postgresSourceConfig } from './connectors';

const connectors = [postgresSourceConfig, elasticsearchSinkConfig];

// rebuild

export const seedDebeziumConnectors = async () => {
  const results = [];

  for (const connector of connectors) {
    try {
      await debezium.update({
        name: connector.name,
        config: { ...connector.config, 'snapshot.mode': 'initial' },
      });
      results.push(`[${connector.name}] Connector updated`);
    } catch (error) {
      console.warn(`Failed to update connector [${connector.name}]:`, error);
      await debezium.create(connector);
      results.push(`[${connector.name}] Connector created`);
    }
  }
  return results;
};
