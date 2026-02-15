import { logger } from "@repo/logger";
import type { Socket } from "socket.io";

const socketLogger = (socket: Socket) => {
    logger.info("Socket connected", {
        socketId: socket.id,
        namespace: socket.nsp.name,
        userId: socket.data?.user?.id,
    });

    socket.on("disconnect", (reason) => {
        logger.info("Socket disconnected", {
            socketId: socket.id,
            userId: socket.data?.user?.id,
            reason,
        });
    });

    socket.on("error", (error: unknown) => {
        logger.error("Socket error", {
            socketId: socket.id,
            userId: socket.data?.user?.id,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
        });
    });
};

export default socketLogger;
