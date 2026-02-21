import { MembershipService } from "@/services/membeship-service";
import { chatService } from "@/services/chat-service";
import { logger } from "@repo/logger";
import { IOServer, IOSocket } from "../@types";
import { getChatRoomId } from "../utils/rooms";


class JoinHandler {
    private io: IOServer;
    private socket: IOSocket;
    private membership: MembershipService

    constructor(
        io: IOServer,
        socket: IOSocket,
        membership: MembershipService
    ) {
        this.io = io;
        this.socket = socket;
        this.membership = membership;
    }

    public register() {
        // Auto-rejoin all previously known rooms the moment the socket connects
        this.autoRejoinRooms();
        this.socket.on("chat:join", this.handleJoin.bind(this));
    }

    /**
     * On connect, re-join every chat room the user is already a member of.
     * This ensures: if User B sends a message to User A, User A receives it
     * without needing to manually click on User B first.
     */
    private async autoRejoinRooms() {
        const userId = this.socket.userId!;
        try {
            const cachedChatIds = await this.membership.loadMemberships(userId);
            if (cachedChatIds.length === 0) {
                logger.debug(`No cached rooms to rejoin for user ${userId}`);
                return;
            }
            const roomNames = cachedChatIds.map(chatId => getChatRoomId(chatId));
            this.socket.join(roomNames);
            logger.info(`Auto-rejoined ${cachedChatIds.length} rooms for user ${userId}: [${cachedChatIds.join(", ")}]`);
        } catch (error) {
            logger.error("Error during auto-rejoin of rooms:", error);
        }
    }

    private async handleJoin(
        chatId: string,
        cb?: (data: { ok: boolean; error?: string; chatId?: string }) => void
    ) {
        try {
            const userId = this.socket.userId!;

            const roomName = getChatRoomId(chatId);
            if (this.socket.rooms.has(roomName)) {
                return cb?.({ ok: true, chatId });
            }

            // Check Redis cache first (fast path)
            let isAllowed = await this.membership.isCachedMember(userId, chatId);

            if (!isAllowed) {
                isAllowed = await chatService.checkChatMembership(chatId, userId);
                if (isAllowed) {
                    // Warm the Redis cache so future checks are fast
                    await this.membership.cacheMembership(userId, chatId);
                }
            }

            if (!isAllowed) {
                return cb?.({ ok: false, error: "UNAUTHORIZED" });
            }

            // Always ensure membership is cached for future auto-rejoin on reconnect
            await this.membership.cacheMembership(userId, chatId);
            this.socket.join(roomName);

            cb?.({ ok: true, chatId });

            const user = this.socket.user;
            this.socket.to(roomName).emit("chat:joined", {
                userId,
                chatId,
                username: user?.username || "Unknown",
            });

            logger.info(`User ${userId} joined room ${chatId}`);

        } catch (error) {
            logger.error("Error joining chat:", error);
            cb?.({ ok: false, error: "INTERNAL_SERVER_ERROR" });
        }
    }
}

export const setUpJoinHandler = (
    io: IOServer,
    socket: IOSocket,
    membership: MembershipService
) => {
    const handler = new JoinHandler(io, socket, membership);
    handler.register();
}




