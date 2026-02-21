import request from "supertest";
import app from "../http/src/app";
import db from "../http/src/services/db";
import bcrypt from "bcryptjs";

// Mock database
jest.mock("../http/src/services/db", () => ({
    __esModule: true,
    default: {
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        $connect: jest.fn(),
    },
}));

// Mock bcrypt
jest.mock("bcryptjs", () => ({
    hash: jest.fn().mockResolvedValue("hashed-password"),
    compare: jest.fn().mockResolvedValue(true),
}));

describe("Auth Module Integration Tests", () => {
    const mockDate = new Date();
    const createMockUser = (overrides = {}) => ({
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        name: "Test User",
        password: "hashed-password",
        isVerified: false,
        isPrivate: false,
        createdAt: mockDate,
        updatedAt: mockDate,
        ...overrides
    });

    describe("POST /api/v0/auth/register", () => {
        it("should register a user successfully", async () => {
            const registerData = {
                name: "Test User",
                username: "testuser",
                email: "test@example.com",
                password: "password123",
            };

            (db.user.findFirst as jest.Mock).mockResolvedValue(null);
            (db.user.create as jest.Mock).mockResolvedValue(createMockUser());

            const response = await request(app)
                .post("/api/v0/auth/register")
                .send(registerData);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("User registered successfully");
            expect(response.body.data.user.id).toBe("user-123");
            expect(response.body.data.tokens).toBeDefined();
        });

        it("should return 409 if user already exists", async () => {
            const registerData = {
                name: "Test User",
                username: "testuser",
                email: "test@example.com",
                password: "password123",
            };

            (db.user.findFirst as jest.Mock).mockResolvedValue({ id: "existing-id" });

            const response = await request(app)
                .post("/api/v0/auth/register")
                .send(registerData);

            expect(response.status).toBe(409);
            expect(response.body.message).toMatch(/already exists/i);
        });
    });

    describe("POST /api/v0/auth/login", () => {
        it("should login successfully with correct credentials", async () => {
            const loginData = {
                email: "test@example.com",
                password: "password123",
            };

            (db.user.findUnique as jest.Mock).mockResolvedValue(createMockUser());
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            const response = await request(app)
                .post("/api/v0/auth/login")
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("User logged in successfully");
            expect(response.body.data.tokens).toBeDefined();
        });

        it("should return 401 with invalid credentials", async () => {
            const loginData = {
                email: "test@example.com",
                password: "wrong-password",
            };

            (db.user.findUnique as jest.Mock).mockResolvedValue(createMockUser());
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            const response = await request(app)
                .post("/api/v0/auth/login")
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body.message).toMatch(/invalid credentials/i);
        });
    });
});
