import { logger } from "@repo/logger";
import { IOSocket } from "../@types";
import { chatService } from "@/services/chat-service";
import { getChatRoomId } from "../utils/rooms";


export const requireRoomAccess = (socket: IOSocket) => {
    socket.use(async (packet: any[], next: (err?: any) => void) => {
        const [event, data] = packet;
        const userId = socket.userId;

        if (!event.startsWith('chat:') || event === 'chat:join') {
            return next();
        }

        try {
            const chatId = data?.chatId;
            if (!chatId) {
                return next(new Error("Missing chatId in event payload"));
            }

            const roomName = getChatRoomId(chatId);
            if (socket.rooms.has(roomName)) {
                return next();
            }

            const isMember = await chatService.checkChatMembership(chatId, userId!);
            if (!isMember) {
                logger.warn(`Unauthorized access attempt by ${userId} to room ${chatId}`);
                return next(new Error("UNAUTHORIZED_ROOM_ACCESS"));
            }

            socket.join(roomName);
            next();

        } catch (error) {
            logger.error("Room access middleware error:", error);
            next(new Error("INTERNAL_SERVER_ERROR"));
        }
    });

    socket.on('error', (err: any) => {
        if (err?.message === "UNAUTHORIZED_ROOM_ACCESS") {
            socket.emit('error', { message: 'You are not a member of this chat' });
        }
    });
}