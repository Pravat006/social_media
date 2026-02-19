import { MembershipService } from "@/services/membeship-service";
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
        this.socket.on("chat:join", this.handleJoin.bind(this));
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


            let isAllowed = await this.membership.isCachedMember(userId, chatId)
            if (!isAllowed) {
                return cb?.({ ok: false, error: "UNAUTHORIZED" });
            }


            await this.membership.cacheMembership(userId, chatId)
            this.socket.join(roomName)


            cb?.({ ok: true, chatId });

            const user = this.socket.user;
            this.socket.to(roomName).emit("chat:joined", {
                userId,
                chatId,
                username: user?.username || "Unknown",
            })

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








