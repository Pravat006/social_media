import { logger } from "@repo/logger";
import { sendMessage, TOPICS } from "@repo/kafka";
import crypto from "crypto";
import { ChatDeleteData, ChatMessageData, ChatReactionData, ChatReadData, ServerToClientEvents } from "@repo/shared";
import { IOServer, IOSocket } from "../@types";
import { getChatRoomId, getUserRoomId } from "../utils/rooms";

class ChatHandler {

    private io: IOServer
    private socket: IOSocket

    constructor(io: IOServer, socket: IOSocket) {
        this.io = io
        this.socket = socket
    }

    public setupChatHandlers() {
        const userId = this.socket.userId!;
        const username = this.socket.user?.username || "Unknown";

        this.socket.join(getUserRoomId(userId));
        logger.debug(`User ${userId} joined personal room`);

        this.socket.on('chat:message', async (data: ChatMessageData) => {
            try {
                const { chatId, content, mediaIds } = data;
                const roomName = getChatRoomId(chatId);

                const messageId = crypto.randomUUID();
                const createdAt = new Date().toISOString();

                const kafkaPayload = {
                    id: messageId,
                    chatId,
                    senderId: userId,
                    content,
                    createdAt: new Date(),
                    mediaIds,
                };

                const broadcastPayload: Parameters<ServerToClientEvents['chat:message']>[0] = {
                    id: messageId,
                    chatId,
                    senderId: userId,
                    senderUsername: username,
                    senderName: this.socket.user?.name,
                    content: content || "",
                    type: 'USER',
                    createdAt,
                    mediaIds: mediaIds || [],
                };


                await sendMessage(TOPICS.CHAT_MESSAGE_SENT, kafkaPayload, chatId);

                // Broadcast to chat room
                this.io.to(roomName).emit('chat:message', broadcastPayload);

                logger.debug(`Message sent in chat ${chatId} by user ${userId}`);
            } catch (error) {
                logger.error('Error sending message:', error);
                this.socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Mark messages as read (Seen Receipt)
        this.socket.on('chat:read', async (data: ChatReadData) => {
            try {
                const { chatId, messageId } = data;
                const roomName = getChatRoomId(chatId);
                const readAt = new Date().toISOString();

                const kafkaPayload = {
                    chatId,
                    messageId,
                    userId,
                    readAt: new Date(),
                };

                const broadcastPayload: Parameters<ServerToClientEvents['chat:read']>[0] = {
                    chatId,
                    messageId,
                    userId,
                    readAt,
                };

                // Produce read receipt to Kafka
                await sendMessage(TOPICS.CHAT_MESSAGE_READ, kafkaPayload, chatId);

                this.socket.to(roomName).emit('chat:read', broadcastPayload);
            } catch (error) {
                logger.error('Error marking message as read:', error);
            }
        });

        this.socket.on('chat:reaction', async (data: ChatReactionData) => {
            try {
                const { chatId, messageId, reaction } = data;
                const roomName = getChatRoomId(chatId);
                const createdAt = new Date().toISOString();

                const kafkaPayload = {
                    messageId,
                    reaction,
                    userId,
                    chatId,
                    createdAt: new Date(),
                };

                const broadcastPayload: Parameters<ServerToClientEvents['chat:reaction']>[0] = {
                    messageId,
                    reaction,
                    userId,
                    username,
                    createdAt,
                };


                await sendMessage(TOPICS.CHAT_REACTION, kafkaPayload, chatId);


                this.socket.to(roomName).emit('chat:reaction', broadcastPayload);
            } catch (error) {
                logger.error('Error adding reaction:', error);
            }
        });

        this.socket.on('chat:delete', async (data: ChatDeleteData) => {
            try {
                const { chatId, messageId } = data;
                const roomName = getChatRoomId(chatId);
                const deletedAt = new Date().toISOString();

                const kafkaPayload = {
                    chatId,
                    messageId,
                    userId,
                    deletedAt: new Date(),
                };

                const broadcastPayload: Parameters<ServerToClientEvents['chat:delete']>[0] = {
                    chatId,
                    messageId,
                    userId,
                    deletedAt,
                };

                // Produce deletion to Kafka
                await sendMessage(TOPICS.CHAT_MESSAGE_DELETED, kafkaPayload, chatId);

                // Broadcast to chat room
                this.io.to(roomName).emit('chat:delete', broadcastPayload);
            } catch (error) {
                logger.error('Error deleting message:', error);
            }
        });
    }
}

export const setupChatHandlers = (io: IOServer, socket: IOSocket) => {
    const handler = new ChatHandler(io, socket);
    handler.setupChatHandlers();
};