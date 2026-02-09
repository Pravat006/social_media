import { createClient, RedisClientType } from 'redis';
import config from './index';
import { logger } from '@repo/logger';

export const redisClient: RedisClientType = createClient({
    socket: {
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
    },
});

redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
});

export const subscriber: RedisClientType = redisClient.duplicate();

subscriber.on('error', (err) => {
    logger.error('Redis Subscriber Error:', err);
});

subscriber.on('connect', () => {
    logger.info('Redis Subscriber Connected');
});

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        await subscriber.connect();
        logger.info('Redis connected successfully');
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        process.exit(1);
    }
};

export default redisClient;
