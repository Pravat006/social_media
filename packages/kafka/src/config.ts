import { config } from "@repo/env-config";

export const kafkaConfig = {
    clientId: config.KAFKA_CLIENT_ID,
    brokers: [config.KAFKA_BROKERS || "localhost:9092"],
    ssl: false,
    sasl: undefined,
};
