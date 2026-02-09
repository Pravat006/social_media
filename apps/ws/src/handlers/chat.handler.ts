import { Server } from 'socket.io';
import { AuthenticatedSocket } from '@/middlewares/auth.middleware';
import { logger } from '@repo/logger';

export const setupChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Join user's personal room
    socket.join(`user:${userId}`);
    logger.debug(`User ${userId} joined personal room`);

    // Join chat room
    socket.on('chat:join', async (chatId: string) => {
        try {
            // TODO: Verify user is member of this chat
            socket.join(`chat:${chatId}`);
            logger.debug(`User ${userId} joined chat ${chatId}`);

            socket.emit('chat:joined', { chatId });
        } catch (error) {
            logger.error('Error joining chat:', error);
            socket.emit('error', { message: 'Failed to join chat' });
        }
    });

    // Leave chat room
    socket.on('chat:leave', (chatId: string) => {
        socket.leave(`chat:${chatId}`);
        logger.debug(`User ${userId} left chat ${chatId}`);
    });

    // Send message
    socket.on('chat:message', async (data: { chatId: string; content: string; tempId?: string }) => {
        try {
            const { chatId, content, tempId } = data;

            // TODO: Save message to database
            // TODO: Validate user is member of chat

            // Broadcast message to chat room
            io.to(`chat:${chatId}`).emit('chat:message', {
                id: tempId, // Replace with actual message ID from DB
                chatId,
                senderId: userId,
                content,
                createdAt: new Date(),
                sender: socket.user,
            });

            logger.debug(`Message sent in chat ${chatId} by user ${userId}`);
        } catch (error) {
            logger.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('chat:typing', (data: { chatId: string; isTyping: boolean }) => {
        const { chatId, isTyping } = data;
        socket.to(`chat:${chatId}`).emit('chat:typing', {
            chatId,
            userId,
            username: socket.user?.username,
            isTyping,
        });
    });

    // Mark messages as read
    socket.on('chat:read', async (data: { chatId: string; messageId: string }) => {
        try {
            const { chatId, messageId } = data;

            // TODO: Update message read status in database

            // Notify other users in chat
            socket.to(`chat:${chatId}`).emit('chat:read', {
                chatId,
                messageId,
                userId,
            });
        } catch (error) {
            logger.error('Error marking message as read:', error);
        }
    });

    // Message reaction
    socket.on('chat:reaction', async (data: { messageId: string; reaction: string }) => {
        try {
            const { messageId, reaction } = data;

            // TODO: Save reaction to database
            // TODO: Get chatId from message

            const chatId = 'temp-chat-id'; // Replace with actual chatId

            io.to(`chat:${chatId}`).emit('chat:reaction', {
                messageId,
                userId,
                reaction,
                username: socket.user?.username,
            });
        } catch (error) {
            logger.error('Error adding reaction:', error);
        }
    });
};
