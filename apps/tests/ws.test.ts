import { io as Client, Socket as ClientSocket } from "socket.io-client";
import { Server } from "socket.io";
import { createServer } from "http";

// --- GLOBAL MOCKS ---
jest.mock("@repo/env-config", () => ({
    config: {
        REDIS_HOST: "localhost",
        REDIS_PORT: 6379,
        WS_PORT: 4001,
    }
}));

jest.mock("@repo/logger", () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    }
}));

import { setupChatHandlers } from "../ws/src/handlers/chat-handler";
import { setUpJoinHandler } from "../ws/src/handlers/join-handler";
import { setupPresenceHandler } from "../ws/src/handlers/presence-handler";
import { MembershipService } from "../ws/src/services/membeship-service";
import { requireRoomAccess } from "../ws/src/middlewares/require-room-access";
import { chatService } from "../ws/src/services/chat-service";

// Mock business services
jest.mock("../ws/src/services/chat-service", () => ({
    chatService: {
        checkChatMembership: jest.fn(),
    }
}));

// Mock dependencies
jest.mock("@repo/redis", () => ({
    redisClient: {
        sismember: jest.fn(),
        sadd: jest.fn(),
    },
    getPublisher: jest.fn(),
    getSubscriber: jest.fn(),
    connectPublisher: jest.fn(),
    connectSubscriber: jest.fn(),
    subscribe: jest.fn(),
    setUserOnline: jest.fn(),
    setUserOffline: jest.fn(),
    setUserTyping: jest.fn(),
    stopUserTyping: jest.fn(),
    heartbeat: jest.fn(),
}));

jest.mock("@repo/kafka", () => ({
    connectProducer: jest.fn(),
    disconnectProducer: jest.fn(),
    sendMessage: jest.fn(),
    TOPICS: {
        CHAT_MESSAGE_SENT: "chat_message_sent",
        CHAT_MESSAGE_READ: "chat_message_read",
        CHAT_REACTION: "chat_reaction",
    },
}));

describe("WebSocket Chat Tests", () => {
    let io: Server, clientSocket: ClientSocket, clientSocket2: ClientSocket;
    const serverSockets = new Map<string, any>();
    const port = 4001;

    beforeAll((done) => {
        const httpServer = createServer();
        io = new Server(httpServer);
        httpServer.listen(port, () => {
            let connectedCount = 0;
            const onConnect = () => {
                connectedCount++;
                if (connectedCount === 2) done();
            };

            clientSocket = Client(`http://localhost:${port}`, { auth: { token: "user1" } });
            clientSocket2 = Client(`http://localhost:${port}`, { auth: { token: "user2" } });

            io.on("connection", (socket) => {
                const token = socket.handshake.auth.token;
                (socket as any).userId = token;
                (socket as any).user = { username: `user-${token}` };
                serverSockets.set(token, socket);

                const membershipService = new MembershipService();
                requireRoomAccess(socket as any);
                setUpJoinHandler(io as any, socket as any, membershipService);
                setupChatHandlers(io as any, socket as any);
                setupPresenceHandler(io as any, socket as any);
            });

            clientSocket.on("connect", onConnect);
            clientSocket2.on("connect", onConnect);
        });
    });

    afterAll(() => {
        io.close();
        clientSocket.disconnect();
        clientSocket2.disconnect();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (chatService.checkChatMembership as jest.Mock).mockResolvedValue(true);
        const { redisClient } = require("@repo/redis");
        redisClient.sismember.mockResolvedValue(1);
    });

    const joinRoom = (chatId: string) => {
        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Join timed out")), 2000);
            clientSocket.emit("chat:join", chatId, (res1: any) => {
                if (!res1.ok) return reject(new Error("Client 1 failed to join: " + res1.error));
                clientSocket2.emit("chat:join", chatId, (res2: any) => {
                    if (!res2.ok) return reject(new Error("Client 2 failed to join: " + res2.error));
                    clearTimeout(timeout);
                    resolve();
                });
            });
        });
    };

    it("should join a chat room successfully", async () => {
        const chatId = "test-room";
        await joinRoom(chatId);

        const s1 = serverSockets.get("user1");
        const s2 = serverSockets.get("user2");
        expect(s1.rooms.has(`chat:${chatId}`)).toBe(true);
        expect(s2.rooms.has(`chat:${chatId}`)).toBe(true);
    });

    it("should broadcast messages to other users in the room", async () => {
        const chatId = "broadcast-room";
        const message = "Hello Friend";
        await joinRoom(chatId);

        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Broadcast timed out")), 2000);
            clientSocket2.on("chat:message", (data) => {
                expect(data.content).toBe(message);
                expect(data.chatId).toBe(chatId);
                clientSocket2.off("chat:message");
                clearTimeout(timeout);
                resolve();
            });

            clientSocket.emit("chat:message", { chatId, content: message });
        });
    });

    it("should handle typing indicators across users", async () => {
        const chatId = "typing-room";
        await joinRoom(chatId);

        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Typing timed out")), 2000);
            clientSocket2.on("chat:typing", (data) => {
                expect(data.chatId).toBe(chatId);
                expect(data.isTyping).toBe(true);
                clientSocket2.off("chat:typing");
                clearTimeout(timeout);
                resolve();
            });

            clientSocket.emit("chat:typing", { chatId, isTyping: true });
        });
    });

    it("should broadcast read receipts", async () => {
        const chatId = "read-room";
        const messageId = "msg-123";
        await joinRoom(chatId);

        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Read receipt timed out")), 2000);
            clientSocket2.on("chat:read", (data) => {
                expect(data.messageId).toBe(messageId);
                clientSocket2.off("chat:read");
                clearTimeout(timeout);
                resolve();
            });

            clientSocket.emit("chat:read", { chatId, messageId });
        });
    });

    it("should broadcast reactions", async () => {
        const chatId = "reaction-room";
        const messageId = "msg-123";
        const reaction = "👍";
        await joinRoom(chatId);

        return new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Reaction timed out")), 2000);
            clientSocket2.on("chat:reaction", (data) => {
                expect(data.messageId).toBe(messageId);
                expect(data.reaction).toBe(reaction);
                clientSocket2.off("chat:reaction");
                clearTimeout(timeout);
                resolve();
            });

            clientSocket.emit("chat:reaction", { chatId, messageId, reaction });
        });
    });

    it("should deny access to unauthorized rooms", (done) => {
        const chatId = "denied-chat";
        (chatService.checkChatMembership as jest.Mock).mockResolvedValue(false);
        const { redisClient } = require("@repo/redis");
        redisClient.sismember.mockResolvedValue(0);

        clientSocket.emit("chat:message", { chatId, content: "Locked out" });

        clientSocket.on("error", (err) => {
            expect(err.message).toMatch(/not a member/);
            clientSocket.off("error");
            done();
        });
    });
});
