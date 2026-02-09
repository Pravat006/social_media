import { Server } from 'socket.io';
import config from './config';
import { logger } from '@repo/logger';
import { connectDatabase } from './config/db';
import { connectRedis } from './config/redis';
import { authenticateSocket, AuthenticatedSocket } from './middlewares/auth.middleware';
import { setupChatHandlers } from './handlers/chat.handler';
import { setupLiveStreamHandlers } from './handlers/live.handler';
import { setupNotificationHandlers } from './handlers/notification.handler';
import { setupRedisSubscriber } from './redis.subscriber';

const io = new Server({
    cors: {
        origin: config.ALLOWED_ORIGINS,
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Authentication middleware
io.use(authenticateSocket);

// Connection handler
io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Client connected: ${socket.id} (User: ${socket.user?.username})`);

    // Setup event handlers
    setupChatHandlers(io, socket);
    setupLiveStreamHandlers(io, socket);
    setupNotificationHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id} (User: ${socket.user?.username}) - Reason: ${reason}`);

        // TODO: Update user's lastSeen in database
        // TODO: Clean up any active sessions
    });

    // Handle errors
    socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();

        // Connect to Redis
        await connectRedis();

        // Setup Redis subscriber
        await setupRedisSubscriber(io);

        // Start listening
        io.listen(parseInt(config.PORT.toString()));
        logger.info(`WebSocket server running on port ${config.PORT}`);
        logger.info(`Environment: ${config.NODE_ENV}`);
        logger.info(`Allowed origins: ${config.ALLOWED_ORIGINS.join(', ')}`);
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    io.close(() => {
        logger.info('WebSocket server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    io.close(() => {
        logger.info('WebSocket server closed');
        process.exit(0);
    });
});

// Start the server
startServer();

export default io;
