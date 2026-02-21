import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import {
    connectPublisher,
    connectSubscriber,
    subscribe,
} from './redis';
import { config } from './config';
import { logger } from '@repo/logger';
import { IOSocket } from './@types';
import { authenticateSocket } from './middlewares/auth-middleware';
import { requireRoomAccess } from './middlewares/require-room-access';
import socketLogger from './middlewares/socker-logger';

import { MembershipService } from './services/membeship-service';
import { createRedisAdapter } from './redis-adapter';
import { connectProducer, disconnectProducer } from '@repo/kafka';
import { setupChatHandlers, setUpJoinHandler, setupPresenceHandler } from './handlers';

const startServer = async () => {
    try {
        logger.info('Connecting to redis...');
        await Promise.allSettled([
            connectPublisher(),
            connectSubscriber(),
        ]);
        logger.info('Redis connected. Attempting Kafka connection (non-fatal)...');
        connectProducer().catch((err) => {
            logger.warn('Kafka producer unavailable — messages will not be persisted to Kafka', { error: err.message });
        });
        const httpServer = http.createServer();


        const io = new SocketIoServer(httpServer, {
            cors: {
                origin: config.CORS_ORIGIN,
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });

        io.adapter(createRedisAdapter());

        // middlewares
        io.use(authenticateSocket);
        io.use((socket, next) => {
            socketLogger(socket);
            next();
        });



        const membershipService = new MembershipService();

        io.on('connection', (socket: IOSocket) => {
            logger.info(`User authenticated: ${socket.user?.username} (${socket.id})`);

            requireRoomAccess(socket);
            setUpJoinHandler(io, socket, membershipService);
            setupChatHandlers(io, socket);
            setupPresenceHandler(io, socket);

            socket.on('disconnect', (reason: string) => {
                logger.info("User disconnected", {
                    socketId: socket.id,
                    reason,
                });
            });
        });

        await subscribe('system:notifications', (channel, message: any) => {
            logger.info("External notification", {
                channel,
                message,
            });
            io.to(message.userId).emit('notification', message);
        });

        httpServer.on("error", (err) => {
            logger.error("HTTP server error", {
                error: err.message,
                stack: err.stack,
            });
        });


        httpServer.listen(config.WS_PORT, () => {
            logger.info(`🚀 WebSocket server is live on port ${config.WS_PORT}`);
            logger.info(`Environment: ${config.NODE_ENV}`);
        });

        const shutdown = async () => {
            logger.info('Shutting down gracefully...');
            io.close();
            httpServer.close();
            await disconnectProducer();
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('CRITICAL: Failed to start WebSocket server:', error);
        process.exit(1);
    }
};

export { startServer };

if (require.main === module) {
    startServer();
}
