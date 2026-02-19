import { logger } from "@repo/logger";
import {
    setUserOnline,
    setUserOffline,
    setUserTyping,
    stopUserTyping,
    heartbeat
} from "@repo/redis";
import { IOServer, IOSocket } from "../@types";
import { getChatRoomId } from "../utils/rooms";

class PresenceHandler {
    private io: IOServer;
    private socket: IOSocket;

    constructor(io: IOServer, socket: IOSocket) {
        this.io = io;
        this.socket = socket;
    }

    public register() {
        const userId = this.socket.userId!;
        const username = this.socket.user?.username || "Unknown";

        this.handleUserOnline();

        this.socket.on("user:online", async () => {
            try {
                await heartbeat(userId);
            } catch (error) {
                logger.error("Heartbeat error:", error);
            }
        });

        this.socket.on("chat:typing", async (data) => {
            try {
                const { chatId, isTyping } = data;
                const roomName = getChatRoomId(chatId);

                if (isTyping) {
                    await setUserTyping(userId, chatId);
                } else {
                    await stopUserTyping(userId, chatId);
                }

                this.socket.to(roomName).emit("chat:typing", {
                    chatId,
                    userId,
                    username,
                    isTyping
                });
            } catch (error) {
                logger.error("Typing indicator error:", error);
            }
        });

        this.socket.on("user:offline", () => {
            this.handleUserOffline();
        });
        this.socket.on("disconnect", () => {
            this.handleUserOffline();
        });
    }

    private async handleUserOnline() {
        const userId = this.socket.userId!;
        const username = this.socket.user?.username || "Unknown";
        try {
            await setUserOnline(userId, username);
            // Broadcast global online status
            this.io.emit("user:online", { userId, username });
            logger.debug(`User ${username} presence set to online`);
        } catch (error) {
            logger.error("Failed to set user online:", error);
        }
    }

    private async handleUserOffline() {
        const userId = this.socket.userId!;
        const username = this.socket.user?.username || "Unknown";
        try {
            await setUserOffline(userId, username);
            // Broadcast global offline status
            this.io.emit("user:offline", {
                userId,
                username,
                lastSeen: new Date().toISOString()
            });
            logger.debug(`User ${username} presence set to offline`);
        } catch (error) {
            logger.error("Failed to set user offline:", error);
        }
    }
}

export const setupPresenceHandler = (io: IOServer, socket: IOSocket) => {
    const handler = new PresenceHandler(io, socket);
    handler.register();
};
