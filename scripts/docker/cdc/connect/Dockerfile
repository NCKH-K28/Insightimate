
FROM confluentinc/cp-kafka-connect-base:7.7.1
USER root
ENV CONNECT_PLUGIN_PATH="/usr/share/java,/usr/share/confluent-hub-components"

RUN mkdir -p /usr/share/confluent-hub-components

# Cài đặt Debezium Postgres connector
RUN set -eux; \
    DEBEZIUM_VERSION=2.5.4.Final && \
    cd /tmp && \
    curl -fsSL -o debezium-postgres.tar.gz \
    "https://repo1.maven.org/maven2/io/debezium/debezium-connector-postgres/${DEBEZIUM_VERSION}/debezium-connector-postgres-${DEBEZIUM_VERSION}-plugin.tar.gz" && \
    tar -xzf debezium-postgres.tar.gz -C /usr/share/confluent-hub-components && \
    rm debezium-postgres.tar.gz

# Cài đặt Aiven Elasticsearch connector
RUN set -eux; \
    AIVEN_ES_VERSION=7.0.0; \
    cd /tmp; \
    curl -fSL -o kafka-connect-elasticsearch.tar "https://github.com/Aiven-Open/elasticsearch-connector-for-apache-kafka/releases/download/v${AIVEN_ES_VERSION}/elasticsearch-connector-for-apache-kafka-${AIVEN_ES_VERSION}.tar"; \
    tar -xf kafka-connect-elasticsearch.tar -C /usr/share/confluent-hub-components; \
    rm kafka-connect-elasticsearch.tar