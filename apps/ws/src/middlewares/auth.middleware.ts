import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '@/config';
import db from '@/config/db';
import { logger } from '@repo/logger';

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
        const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET) as { id: string; email: string; name: string };

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
