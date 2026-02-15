import { Socket } from 'socket.io';
import { verifyToken } from '@repo/auth';

import { logger } from '@repo/logger';
import db from '@/config/db';

export interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: {
        id: string;
        username: string;
        email: string;
        name?: string | null;
    };
}

export const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
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
