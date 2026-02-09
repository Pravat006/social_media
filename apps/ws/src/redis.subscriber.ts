import { Server } from 'socket.io';
import { subscriber } from '@/config/redis';
import { logger } from '@repo/logger';
import { sendNotificationToUser } from '@/handlers/notification.handler';

export const setupRedisSubscriber = async (io: Server) => {
    try {
        await subscriber.subscribe('notifications', (message) => {
            try {
                const notification = JSON.parse(message);
                const { userId, ...data } = notification;

                if (userId) {
                    sendNotificationToUser(io, userId, data);
                    logger.debug(`Notification sent to user ${userId} via Redis Pub/Sub`);
                }
            } catch (error) {
                logger.error('Error parsing notification message:', error);
            }
        });

        logger.info('Redis subscriber setup completed');
    } catch (error) {
        logger.error('Error setting up Redis subscriber:', error);
    }
};
