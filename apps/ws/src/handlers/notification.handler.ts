import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/auth.middleware';
import { logger } from '@repo/logger';

export const setupNotificationHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // User is online
    socket.on('user:online', async () => {
        try {
            // TODO: Update user's lastSeen in database
            // TODO: Notify user's friends/followers

            logger.debug(`User ${userId} is online`);
        } catch (error) {
            logger.error('Error setting user online:', error);
        }
    });

    // Send notification to specific user
    const sendNotification = (targetUserId: string, notification: any) => {
        io.to(`user:${targetUserId}`).emit('notification', notification);
    };

    // Expose sendNotification for other handlers
    (socket as any).sendNotification = sendNotification;
};

// Helper function to send notifications from anywhere
export const sendNotificationToUser = (io: Server, userId: string, notification: any) => {
    io.to(`user:${userId}`).emit('notification', notification);
};
