// postgres-source
export const postgresSourceConfig = {
  name: 'postgres-source',
  config: {
    'connector.class': 'io.debezium.connector.postgresql.PostgresConnector',
    'plugin.name': 'pgoutput',
    'database.hostname': 'postgres',
    'database.port': '5432',
    'database.user': 'postgres',
    'database.password': 'postgres',
    'database.dbname': 'postgres',
    'slot.name': 'cdc_slot',
    'topic.prefix': 'pg',
    'schema.include.list': 'public',
    'tombstones.on.delete': 'false',
    'heartbeat.interval.ms': '5000',
    'publication.autocreate.mode': 'all_tables',
  },
};

// elasticsearch-sink
export const elasticsearchSinkConfig = {
  name: 'elasticsearch-sink',
  config: {
    'connector.class': 'io.aiven.connect.elasticsearch.ElasticsearchSinkConnector',
    'tasks.max': '1',
    'topics.regex': 'pg\\.public\\.(users|workspaces|projects|issues)',
    'connection.url': 'http://elasticsearch:9200',
    'type.name': '_doc',
    'schema.ignore': 'true',

    transforms: 'keyId,takeAfter,route',

    'transforms.keyId.type': 'org.apache.kafka.connect.transforms.ExtractField$Key',
    'transforms.keyId.field': 'id',

    'transforms.takeAfter.type': 'org.apache.kafka.connect.transforms.ExtractField$Value',
    'transforms.takeAfter.field': 'after',

    'transforms.route.type': 'org.apache.kafka.connect.transforms.RegexRouter',
    'transforms.route.regex': 'pg\\.public\\.(.*)',
    'transforms.route.replacement': '$1',

    'key.converter': 'org.apache.kafka.connect.json.JsonConverter',
    'key.converter.schemas.enable': 'false',
    'value.converter': 'org.apache.kafka.connect.json.JsonConverter',
    'value.converter.schemas.enable': 'false',

    'key.ignore': 'false',
    'behavior.on.null.values': 'delete',
    'write.method': 'upsert',
  },
};
