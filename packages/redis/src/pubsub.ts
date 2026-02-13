import Redis from "ioredis";
import { logger } from "@repo/logger";
import { config } from "@repo/env-config";
import type { RedisPubSubMessage } from "./types";

let publisher: Redis | null = null;

/**
 * Get or create Redis publisher instance
 */
export const getPublisher = (): Redis => {
    if (!publisher) {
        publisher = new Redis({
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            lazyConnect: true,
        });

        publisher.on('connect', () => logger.info('[Redis Publisher] Connecting...'));
        publisher.on('ready', () => logger.info('[Redis Publisher] Connected successfully'));
        publisher.on('error', (err) => logger.error('[Redis Publisher] Error:', err));
        publisher.on('end', () => logger.info('[Redis Publisher] Connection closed'));
    }
    return publisher;
};

/**
 * Connect the publisher
 */
export const connectPublisher = async (): Promise<void> => {
    const pub = getPublisher();
    if (pub.status !== 'ready') {
        await pub.connect();
    }
};

/**
 * Publish a message to a channel
 * @param channel - Channel name (e.g., 'chat:room:123')
 * @param message - Message data (will be JSON stringified)
 * @returns Number of subscribers that received the message
 */
export const publish = async <T extends RedisPubSubMessage = RedisPubSubMessage>(
    channel: string,
    message: T
): Promise<number> => {
    const pub = getPublisher();

    try {
        if (pub.status !== 'ready') {
            await pub.connect();
        }

        const subscriberCount = await pub.publish(channel, JSON.stringify(message));

        logger.debug('[Redis Pub/Sub] Published message', {
            channel,
            subscriberCount,
            messageType: typeof message
        });

        return subscriberCount;
    } catch (error) {
        logger.error('[Redis Pub/Sub] Failed to publish message', {
            channel,
            error
        });
        throw error;
    }
};

/**
 * Disconnect the publisher
 */
export const disconnectPublisher = async (): Promise<void> => {
    if (publisher && publisher.status === 'ready') {
        await publisher.quit();
        publisher = null;
        logger.info('[Redis Publisher] Disconnected');
    }
};

let subscriber: Redis | null = null;

/**
 * Message handler function type
 */
export type MessageHandler<T = RedisPubSubMessage> = (
    channel: string,
    message: T
) => void | Promise<void>;

/**
 * Get or create Redis subscriber instance
 */
export const getSubscriber = (): Redis => {
    if (!subscriber) {
        subscriber = new Redis({
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
            lazyConnect: true,
        });

        subscriber.on('connect', () => logger.info('[Redis Subscriber] Connecting...'));
        subscriber.on('ready', () => logger.info('[Redis Subscriber] Connected successfully'));
        subscriber.on('error', (err) => logger.error('[Redis Subscriber] Error:', err));
        subscriber.on('end', () => logger.info('[Redis Subscriber] Connection closed'));
    }
    return subscriber;
};

/**
 * Connect the subscriber
 */
export const connectSubscriber = async (): Promise<void> => {
    const sub = getSubscriber();
    if (sub.status !== 'ready') {
        await sub.connect();
    }
};

/**
 * Subscribe to a channel or pattern
 * @param channelOrPattern - Channel name or pattern (e.g., 'chat:*')
 * @param handler - Function to handle incoming messages
 * @param isPattern - Whether to use pattern matching (default: false)
 */
export const subscribe = async (
    channelOrPattern: string | string[],
    handler: MessageHandler,
    isPattern: boolean = false
): Promise<void> => {
    const sub = getSubscriber();

    try {
        if (sub.status !== 'ready') {
            await sub.connect();
        }

        const channels = Array.isArray(channelOrPattern) ? channelOrPattern : [channelOrPattern];

        // Subscribe to channels
        if (isPattern) {
            //  pattern subscribe    e.g. chat:*
            await sub.psubscribe(...channels);
            logger.info('[Redis Pub/Sub] Subscribed to patterns', { patterns: channels });
        } else {
            // subscribe to normal exact channels    e.g. chat:123
            await sub.subscribe(...channels);
            logger.info('[Redis Pub/Sub] Subscribed to channels', { channels });
        }

        // Handle incoming messages
        const eventName = isPattern ? 'pmessage' : 'message';

        sub.on(eventName, async (pattern: string, channel: string, message: string) => {
            try {
                const actualChannel = isPattern ? channel : pattern;
                const actualMessage = isPattern ? message : channel;

                const parsedMessage = JSON.parse(actualMessage);

                logger.debug('[Redis Pub/Sub] Received message', {
                    channel: actualChannel,
                    messageType: typeof parsedMessage
                });

                await handler(actualChannel, parsedMessage);
            } catch (error) {
                logger.error('[Redis Pub/Sub] Failed to handle message', {
                    channel: isPattern ? channel : pattern,
                    error
                });
            }
        });
    } catch (error) {
        logger.error('[Redis Pub/Sub] Failed to subscribe', {
            channels: channelOrPattern,
            error
        });
        throw error;
    }
};

/**
 * Unsubscribe from a channel or pattern
 * @param channelOrPattern - Channel name or pattern
 * @param isPattern - Whether it's a pattern (default: false)
 */
export const unsubscribe = async (
    channelOrPattern: string | string[],
    isPattern: boolean = false
): Promise<void> => {
    const sub = getSubscriber();

    if (!sub || sub.status !== 'ready') {
        return;
    }

    try {
        const channels = Array.isArray(channelOrPattern) ? channelOrPattern : [channelOrPattern];

        if (isPattern) {
            await sub.punsubscribe(...channels);
            logger.info('[Redis Pub/Sub] Unsubscribed from patterns', { patterns: channels });
        } else {
            await sub.unsubscribe(...channels);
            logger.info('[Redis Pub/Sub] Unsubscribed from channels', { channels });
        }
    } catch (error) {
        logger.error('[Redis Pub/Sub] Failed to unsubscribe', {
            channels: channelOrPattern,
            error
        });
        throw error;
    }
};

/**
 * Disconnect the subscriber
 */
export const disconnectSubscriber = async (): Promise<void> => {
    if (subscriber && subscriber.status === 'ready') {
        await subscriber.quit();
        subscriber = null;
        logger.info('[Redis Subscriber] Disconnected');
    }
};


/**
 * Get number of active subscriptions
 */
export const getSubscriptionCount = async (): Promise<number> => {
    const sub = getSubscriber();

    if (!sub || sub.status !== 'ready') {
        return 0;
    }

    // Get subscription count from Redis
    const channels = await sub.call('PUBSUB', 'CHANNELS') as string[];
    return channels.length;
};

/**
 * Check if a channel has any subscribers
 * @param channel - Channel name
 */
export const hasSubscribers = async (channel: string): Promise<boolean> => {
    const pub = getPublisher();

    if (!pub || pub.status !== 'ready') {
        return false;
    }

    const count = await pub.call('PUBSUB', 'NUMSUB', channel) as [string, number][];
    const firstEntry = count[0];
    return count.length > 0 && firstEntry !== undefined && firstEntry[1] > 0;
};

/**
 * Graceful shutdown - disconnect both publisher and subscriber
 */
export const shutdown = async (): Promise<void> => {
    logger.info('[Redis Pub/Sub] Shutting down...');
    await Promise.all([
        disconnectPublisher(),
        disconnectSubscriber()
    ]);
    logger.info('[Redis Pub/Sub] Shutdown complete');
};

// Re-export publishDTO helpers from separate file
export { publishDTO } from './helper/publish-dto';
