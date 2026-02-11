import { kafka } from "./client";
import { logger } from "@repo/logger";

export const producer = kafka.producer();

/**
 * Connect the Kafka producer
 */
export const connectProducer = async () => {
    try {
        await producer.connect();
        logger.info('Kafka producer connected successfully');
    } catch (error) {
        logger.error('Failed to connect Kafka producer', error);
        throw error;
    }
}

/**
 * Send message to a topic
 * @param topic - Kafka topic name
 * @param message - Message payload (will be JSON stringified)
 * @param key - Optional message key for partitioning
 */
export const sendMessage = async <T = object>(
    topic: string,
    message: T,
    key: string
) => {
    if (!key) {
        throw new Error('Key is required for message partitioning');
    }
    try {
        await producer.send({
            topic,
            messages: [{
                key: key,
                value: JSON.stringify(message),
                timestamp: Date.now().toString(),
            }]
        });
        logger.info(`Message sent to topic: ${topic}`, { key });
    } catch (error) {
        logger.error(`Failed to send message to topic: ${topic}`, error);
        throw error;
    }
}

/**
 * Send multiple messages to a topic in batch
 * @param topic - Kafka topic name
 * @param messages - Array of message payloads
 */
export const sendMessageBatch = async <T = object>(
    topic: string,
    messages: T[]
) => {
    try {
        await producer.send({
            topic,
            messages: messages.map(msg => ({
                value: JSON.stringify(msg),
                timestamp: Date.now().toString(),
            }))
        });
        logger.info(`Batch sent to topic: ${topic}`, { count: messages.length });
    } catch (error) {
        logger.error(`Failed to send batch to topic: ${topic}`, error);
        throw error;
    }
}

/**
 * Disconnect the producer gracefully
 */
export const disconnectProducer = async () => {
    try {
        await producer.disconnect();
        logger.info('Kafka producer disconnected');
    } catch (error) {
        logger.error('Error disconnecting Kafka producer', error);
        throw error;
    }
}
