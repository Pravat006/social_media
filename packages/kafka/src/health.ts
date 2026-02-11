import { kafka } from "./client";
import { logger } from "@repo/logger";

/**
 * Check if Kafka is healthy and accessible
 * @returns Promise<boolean> - true if healthy, false otherwise
 */
export const checkKafkaHealth = async (): Promise<boolean> => {
    const admin = kafka.admin();
    try {
        await admin.connect();
        await admin.listTopics();
        await admin.disconnect();
        logger.info('Kafka health check: OK');
        return true;
    } catch (error) {
        logger.error('Kafka health check: FAILED', error);
        return false;
    }
};

/**
 * Get Kafka cluster metadata
 */
export const getClusterMetadata = async () => {
    const admin = kafka.admin();
    try {
        await admin.connect();
        const cluster = await admin.describeCluster();
        const topics = await admin.listTopics();
        await admin.disconnect();

        return {
            brokers: cluster.brokers,
            controller: cluster.controller,
            clusterId: cluster.clusterId,
            topics: topics,
        };
    } catch (error) {
        logger.error('Failed to get cluster metadata', error);
        throw error;
    }
};
