import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/auth.middleware';
import { logger } from '@repo/logger';
import redisClient from '@/config/redis';

export const setupLiveStreamHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Join live stream
    socket.on('live:join', async (streamId: string) => {
        try {
            // TODO: Verify stream exists and is active
            socket.join(`stream:${streamId}`);

            // Increment viewer count
            await redisClient.incr(`stream:${streamId}:viewers`);
            const viewerCount = await redisClient.get(`stream:${streamId}:viewers`);

            // Notify all viewers of new viewer count
            io.to(`stream:${streamId}`).emit('live:viewer-count', {
                streamId,
                count: parseInt(viewerCount || '0'),
            });

            logger.debug(`User ${userId} joined stream ${streamId}`);

            socket.emit('live:joined', { streamId });
        } catch (error) {
            logger.error('Error joining live stream:', error);
            socket.emit('error', { message: 'Failed to join stream' });
        }
    });

    // Leave live stream
    socket.on('live:leave', async (streamId: string) => {
        try {
            socket.leave(`stream:${streamId}`);

            // Decrement viewer count
            await redisClient.decr(`stream:${streamId}:viewers`);
            const viewerCount = await redisClient.get(`stream:${streamId}:viewers`);

            io.to(`stream:${streamId}`).emit('live:viewer-count', {
                streamId,
                count: Math.max(0, parseInt(viewerCount || '0')),
            });

            logger.debug(`User ${userId} left stream ${streamId}`);
        } catch (error) {
            logger.error('Error leaving live stream:', error);
        }
    });

    // Send live message
    socket.on('live:message', async (data: { streamId: string; content: string }) => {
        try {
            const { streamId, content } = data;

            // TODO: Save message to database

            // Broadcast message to all viewers
            io.to(`stream:${streamId}`).emit('live:message', {
                id: Date.now().toString(), // Replace with actual ID from DB
                streamId,
                userId,
                username: socket.user?.username,
                content,
                createdAt: new Date(),
            });
        } catch (error) {
            logger.error('Error sending live message:', error);
        }
    });

    // Send live reaction
    socket.on('live:reaction', async (data: { streamId: string; emoji: string }) => {
        try {
            const { streamId, emoji } = data;

            // Broadcast reaction (ephemeral, not saved)
            io.to(`stream:${streamId}`).emit('live:reaction', {
                streamId,
                userId,
                username: socket.user?.username,
                emoji,
                timestamp: Date.now(),
            });
        } catch (error) {
            logger.error('Error sending live reaction:', error);
        }
    });

    // Stream status update (host only)
    socket.on('live:status', async (data: { streamId: string; status: 'started' | 'ended' }) => {
        try {
            const { streamId, status } = data;

            // TODO: Verify user is the host
            // TODO: Update stream status in database

            if (status === 'ended') {
                // Clear viewer count
                await redisClient.del(`stream:${streamId}:viewers`);
            }

            io.to(`stream:${streamId}`).emit('live:status', {
                streamId,
                status,
            });

            logger.info(`Stream ${streamId} ${status} by user ${userId}`);
        } catch (error) {
            logger.error('Error updating stream status:', error);
        }
    });
};
