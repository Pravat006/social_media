import { verifyToken } from '@repo/auth';
import { logger } from '@repo/logger';
import db from '@/config/db';
import { IOSocket } from '../@types';

export const authenticateSocket = async (socket: IOSocket, next: (err?: any) => void) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return next(new Error('Authentication token not provided'));
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            return next(new Error('Invalid or expired token'));
        }

        // Get user from database
        const user = await db.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                profilePicture: true,
            },
        });

        if (!user) {
            return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.userId = user.id;
        socket.user = user;

        logger.debug(`User ${user.username} authenticated on socket ${socket.id}`);
        next();
    } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Invalid or expired token'));
    }
};
