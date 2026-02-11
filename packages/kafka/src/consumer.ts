import { config } from "@repo/env-config";
import { kafka } from "./client";
import { logger } from "@repo/logger";
import { Consumer } from "kafkajs";

/**
 * Message handler function type
 */
export type MessageHandler = (data: any, metadata: {
    topic: string;
    partition: number;
    offset: string;
}) => Promise<void>;

/**
 * Create a new Kafka consumer instance
 * @param groupId - Optional consumer group ID (defaults to env config)
 */
export const createConsumer = (groupId?: string): Consumer => {
    return kafka.consumer({
        groupId: groupId || config.KAFKA_GROUP_ID
    });
};

/**
 * Connect to Kafka and start consuming messages
 * @param topics - Topic name or array of topic names to subscribe to
 * @param handler - Custom message handler function
 * @returns Consumer instance for cleanup
 */
export const connectConsumer = async (
    topics: string | string[],
    handler: MessageHandler
): Promise<Consumer> => {
    const consumer = createConsumer();

    try {
        await consumer.connect();
        logger.info('Kafka consumer connected successfully');

        const topicArray = Array.isArray(topics) ? topics : [topics];
        await consumer.subscribe({
            topics: topicArray,
            fromBeginning: false
        });

        logger.info('Subscribed to Kafka topics', { topics: topicArray });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value!.toString());
                    await handler(data, {
                        topic,
                        partition,
                        offset: message.offset
                    });
                    logger.debug('Message processed successfully', {
                        topic,
                        partition,
                        offset: message.offset
                    });
                } catch (error) {
                    logger.error('Failed to process Kafka message', {
                        topic,
                        partition,
                        offset: message.offset,
                        error
                    });

                }
            }
        });
    } catch (error) {
        logger.error('Kafka consumer error', error);
        throw error;
    }

    return consumer;
};

/**
 * Disconnect the consumer gracefully
 * @param consumer - Consumer instance to disconnect
 */
export const disconnectConsumer = async (consumer: Consumer) => {
    try {
        await consumer.disconnect();
        logger.info('Kafka consumer disconnected');
    } catch (error) {
        logger.error('Error disconnecting Kafka consumer', error);
        throw error;
    }
}
