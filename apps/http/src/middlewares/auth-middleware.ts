import { ApiError } from "@/interface";
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { verifyAccessToken } from "@/utils/jwt";
import db from "@/services/db";
import { logger } from "@repo/logger";

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers?.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(
                new ApiError(status.UNAUTHORIZED, "Authentication token not found", "Auth Middleware")
            );
        }

        const token = authHeader.replace('Bearer ', '');

        const decoded = verifyAccessToken(token);

        if (!decoded) {
            return next(
                new ApiError(status.UNAUTHORIZED, "Invalid or expired token", "AUTH MIDDLEWARE")
            );
        }

        const user = await db.user.findUnique({
            where: {
                id: decoded.id
            },
            select: {
                id: true,
                username: true,
                email: true,
                name: true,
                isVerified: true,
                isPrivate: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        if (!user) {
            return next(
                new ApiError(status.UNAUTHORIZED, "User not found", "AUTH MIDDLEWARE")
            );
        }
        req.user = user;
        next();

    } catch (error) {
        logger.error('Error in auth middleware:', error);
        return next(
            new ApiError(status.UNAUTHORIZED, "Invalid or expired token", "AUTH MIDDLEWARE")
        );
    }
};

export default authMiddleware;