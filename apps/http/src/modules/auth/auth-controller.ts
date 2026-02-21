import { asyncHandler } from "@/utils/async-handler";
import { toUserDTO } from "../user/user-dto";
import { ApiResponse } from "@/interface/api-response";
import { generateTokens, verifyRefreshToken } from "@/utils/jwt";
import db from "@/services/db";
import status from "http-status";
import bcrypt from "bcryptjs";
import { ApiError } from "@/interface";
import { loginSchema, registerSchema } from "./validations";

/**
 * Register a new user
 */
export const register = asyncHandler(async (req, res) => {
    const { name, username, email, password } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db.user.findFirst({
        where: {
            OR: [
                { email },
                { username }
            ]
        }
    });

    if (existingUser) {
        throw new ApiError(status.CONFLICT, "User with this email or username already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
        data: {
            name,
            username,
            email,
            password: hashedPassword,
        },
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            isVerified: true,
            isPrivate: true,
            createdAt: true,
            updatedAt: true,
        }
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    return res
        .status(status.CREATED)
        .json(new ApiResponse(status.CREATED, "User registered successfully", {
            user: toUserDTO(user),
            tokens: {
                accessToken,
                refreshToken,
            }
        }));
});

/**
 * User login with email and password
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const user = await db.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new ApiError(status.NOT_FOUND, "User not found");
    }

    if (!user.password) {
        throw new ApiError(status.BAD_REQUEST, "Please use social login for this account");
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(status.UNAUTHORIZED, "Invalid credentials");
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, "User logged in successfully", {
            user: toUserDTO(user),
            tokens: {
                accessToken,
                refreshToken,
            }
        }));
});

/**
 * Logout (client should discard tokens)
 */
export const logout = asyncHandler(async (req, res) => {
    // Since we're using token-based auth without cookies,
    // the client is responsible for discarding the tokens
    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, "Logged out successfully"));
});

/**
 * Refresh access token using refresh token
 */
export const refreshTokens = asyncHandler(async (req, res) => {
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');

    if (!refreshToken) {
        throw new ApiError(status.BAD_REQUEST, "Refresh token not provided");
    }

    const decodedToken = verifyRefreshToken(refreshToken);

    if (!decodedToken) {
        throw new ApiError(status.UNAUTHORIZED, "Invalid or expired refresh token");
    }

    if (!decodedToken.id) {
        throw new ApiError(status.UNAUTHORIZED, "Invalid refresh token");
    }

    const user = await db.user.findUnique({
        where: { id: decodedToken.id }
    });

    if (!user) {
        throw new ApiError(status.NOT_FOUND, "User not found");
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, "Tokens refreshed successfully", {
            tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            }
        }));
});
