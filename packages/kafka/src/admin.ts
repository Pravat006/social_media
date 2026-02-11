// Used for creating topics automatically if not exists

import { kafka } from "./client";
import { TOPICS } from "./topics";
import { logger } from "@repo/logger";

const admin = kafka.admin();

/**
 * Create Kafka topics if they don't already exist
 */
export const createTopics = async () => {
    try {
        await admin.connect();
        logger.info('Kafka admin connected');

        // Get list of existing topics
        const existingTopics = await admin.listTopics();

        // Filter out topics that already exist
        const topicsToCreate = Object.values(TOPICS).filter(
            topic => !existingTopics.includes(topic)
        );

        if (topicsToCreate.length === 0) {
            logger.info('All Kafka topics already exist', {
                topics: Object.values(TOPICS)
            });
            return;
        }

        // Create only the topics that don't exist
        await admin.createTopics({
            topics: topicsToCreate.map(topic => ({
                topic,
                numPartitions: 3,
                replicationFactor: 1,
            })),
        });

        logger.info('Kafka topics created successfully', {
            topics: topicsToCreate
        });
    } catch (error) {
        logger.error('Failed to create Kafka topics', error);
        throw error;
    } finally {
        await admin.disconnect();
        logger.info('Kafka admin disconnected');
    }
}

/**
 * List all existing Kafka topics
 */
export const listTopics = async (): Promise<string[]> => {
    try {
        await admin.connect();
        const topics = await admin.listTopics();
        await admin.disconnect();
        return topics;
    } catch (error) {
        logger.error('Failed to list Kafka topics', error);
        throw error;
    }
}

/**
 * Delete a Kafka topic
 * @param topics - Topic name or array of topic names to delete
 */
export const deleteTopics = async (topics: string | string[]) => {
    try {
        await admin.connect();
        const topicArray = Array.isArray(topics) ? topics : [topics];
        await admin.deleteTopics({ topics: topicArray });
        logger.info('Topics deleted', { topics: topicArray });
        await admin.disconnect();
    } catch (error) {
        logger.error('Failed to delete topics', error);
        throw error;
    }
}
