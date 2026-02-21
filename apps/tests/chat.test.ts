import request from "supertest";
import app from "../http/src/app";
import db from "../http/src/services/db";
import { verifyAccessToken } from "@repo/auth";

// Mock dependencies
jest.mock("../http/src/services/db", () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
        },
        chat: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        chatMember: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
        },
        $connect: jest.fn(),
    },
}));

jest.mock("@repo/auth", () => ({
    verifyAccessToken: jest.fn(),
}));

jest.mock("@repo/logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
    httpLogger: jest.fn((app) => app),
}));

describe("Chat Module Integration Tests", () => {
    const mockUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        isVerified: false,
        isPrivate: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockDate = new Date();
    const createMockChat = (overrides = {}) => ({
        id: "chat-123",
        type: "DIRECT",
        name: null,
        directKey: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        ...overrides
    });

    const createMockMember = (overrides = {}) => ({
        chatId: "chat-123",
        userId: "user-1",
        role: "MEMBER",
        joinedAt: mockDate,
        lastDeletedAt: null,
        ...overrides
    });

    const setupAuth = () => {
        (verifyAccessToken as jest.Mock).mockReturnValue({ id: "user-1" });
        (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    };

    describe("POST /api/v0/chat", () => {
        it("should create a direct chat successfully", async () => {
            setupAuth();
            const chatData = {
                type: "DIRECT",
                memberIds: ["user-1", "user-2"],
            };

            (db.chat.findUnique as jest.Mock).mockResolvedValue(null); // No existing chat
            (db.chat.create as jest.Mock).mockResolvedValue(createMockChat({
                id: "chat-123",
                type: "DIRECT"
            }));

            const response = await request(app)
                .post("/api/v0/chat")
                .set("Authorization", "Bearer valid-token")
                .send(chatData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Chat initialized successfully");
            expect(response.body.data.id).toBe("chat-123");
        });

        it("should create a group chat successfully", async () => {
            setupAuth();
            const chatData = {
                type: "GROUP",
                name: "Test Group",
                memberIds: ["user-1", "user-2", "user-3"],
            };

            (db.chat.create as jest.Mock).mockResolvedValue(createMockChat({
                id: "group-123",
                type: "GROUP",
                name: "Test Group"
            }));

            const response = await request(app)
                .post("/api/v0/chat")
                .set("Authorization", "Bearer valid-token")
                .send(chatData);

            expect(response.status).toBe(201);
            expect(response.body.data.type).toBe("GROUP");
        });
    });

    describe("DELETE /api/v0/chat/:chatId", () => {
        it("should allow a member to leave a group chat", async () => {
            setupAuth();
            const chatId = "group-123";

            (db.chat.findUnique as jest.Mock).mockResolvedValue(createMockChat({
                id: chatId,
                type: "GROUP",
                members: [
                    { userId: "user-1", role: "MEMBER" },
                    { userId: "user-2", role: "ADMIN" },
                ],
            }));

            (db.chatMember.delete as jest.Mock).mockResolvedValue(createMockMember({ userId: "user-1", chatId }));

            const response = await request(app)
                .delete(`/api/v0/chat/${chatId}`)
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/deleted\/left/i);
            expect(db.chatMember.delete).toHaveBeenCalled();
        });

        it("should allow admin to delete the group chat", async () => {
            setupAuth();
            const chatId = "group-123";

            (db.chat.findUnique as jest.Mock).mockResolvedValue(createMockChat({
                id: chatId,
                type: "GROUP",
                members: [
                    { userId: "user-1", role: "ADMIN" },
                ],
            }));

            (db.chat.delete as jest.Mock).mockResolvedValue(createMockChat({ id: chatId }));

            const response = await request(app)
                .delete(`/api/v0/chat/${chatId}`)
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(200);
            expect(db.chat.delete).toHaveBeenCalled();
        });
    });

    describe("POST /api/v0/chat/:chatId/members", () => {
        it("should allow admin to add a member", async () => {
            setupAuth();
            const chatId = "group-123";
            const newMemberId = "user-2";

            (db.chat.findUnique as jest.Mock).mockResolvedValue(createMockChat({
                id: chatId,
                type: "GROUP",
                members: [{ userId: "user-1", role: "ADMIN" }],
            }));

            (db.chatMember.create as jest.Mock).mockResolvedValue(createMockMember({ userId: newMemberId, chatId }));

            const response = await request(app)
                .post(`/api/v0/chat/${chatId}/members`)
                .set("Authorization", "Bearer valid-token")
                .send({ userId: newMemberId, action: "ADD", role: "MEMBER" });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Member added successfully");
        });
    });

    describe("POST /api/v0/chat/:chatId/members/:userId/toggle-role", () => {
        it("should allow admin to toggle member role", async () => {
            setupAuth();
            const chatId = "group-123";
            const targetUserId = "user-2";

            (db.chat.findUnique as jest.Mock).mockResolvedValue(createMockChat({
                id: chatId,
                type: "GROUP",
                members: [
                    { userId: "user-1", role: "ADMIN" },
                    { userId: targetUserId, role: "MEMBER" }
                ],
            }));

            (db.chatMember.update as jest.Mock).mockResolvedValue(createMockMember({ userId: targetUserId, chatId, role: "ADMIN" }));

            const response = await request(app)
                .post(`/api/v0/chat/${chatId}/members/${targetUserId}/toggle-role`)
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(200);
            expect(response.body.message).toMatch(/toggled successfully/i);
            expect(db.chatMember.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { role: "ADMIN" }
            }));
        });
    });

    describe("GET /api/v0/chat/:chatId/members/:userId", () => {
        it("should retrieve chat member details", async () => {
            setupAuth();
            const chatId = "chat-123";
            const userId = "user-1";

            (db.chatMember.findUnique as jest.Mock).mockResolvedValue(createMockMember({ chatId, userId, role: "ADMIN" }));

            const response = await request(app)
                .get(`/api/v0/chat/${chatId}/members/${userId}`)
                .set("Authorization", "Bearer valid-token");

            expect(response.status).toBe(200);
            expect(response.body.data.role).toBe("ADMIN");
        });
    });
});
