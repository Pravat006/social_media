import { io, Socket } from "socket.io-client";
import {
    ClientToServerEvents,
    ServerToClientEvents
} from "@repo/shared";
import { config } from "@repo/env-config";

const WS_URI = config.NEXT_PUBLIC_WS_URI;

class SocketService {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

    public connect(token: string) {
        if (this.socket?.connected) return this.socket;

        this.socket = io(WS_URI, {
            auth: { token },
            transports: ["websocket"],
        });

        this.socket.on("connect", () => {
            console.log("[SOCKET] Connected to", WS_URI);
        });

        this.socket.on("connect_error", (error) => {
            console.error("[SOCKET] Connection error:", error.message);
        });

        this.socket.on("disconnect", (reason) => {
            console.log("[SOCKET] Disconnected:", reason);
        });

        return this.socket;
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public getSocket() {
        return this.socket;
    }
}

export const socketService = new SocketService();
