import http from 'http';
import { Server } from 'socket.io';
import {
    connectPublisher,
    connectSubscriber,
    subscribe,
} from './redis';
import { config } from './config';
import { logger } from '@repo/logger';
import { AuthenticatedSocket, authenticateSocket } from './middlewares/auth.middleware';
import { setupChatHandlers } from './handlers/chat.handler';
import socketLogger from './middlewares/socker-logger';
import { createRedisAdapter } from './redis-adapter';

const startServer = async () => {
    try {
        logger.info('Connecting to redis...');
        await Promise.all([
            connectPublisher(),
            connectSubscriber()
        ]);
        const httpServer = http.createServer();


        const io = new Server(httpServer, {
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



        io.on('connection', (socket: AuthenticatedSocket) => {
            logger.info(`User authenticated: ${socket.user?.username} (${socket.id})`);


            setupChatHandlers(io, socket);

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
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        logger.error('CRITICAL: Failed to start WebSocket server:', error);
        process.exit(1);
    }
};

startServer();
