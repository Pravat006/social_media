import { logger } from "@/config/logger";
import { ApiError } from "@/interface";
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import config from "@/config"
// import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { Payload } from "@/utils/generate-token";
import db from "@/services/db";
const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // get the token from cookies
        const token = req.cookies.accessToken || req.headers?.authorization?.replace('Bearer', '')

        if (!token) {
            return next(
                new ApiError(status.UNAUTHORIZED, "Authentication token not  found in cookies ", "Auth Middleware")
            )
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET) as Payload
        // find admin from the db
        const admin = await db.admin.findUnique({
            where: {
                id: decoded.id
            }
        })
        if (!admin) {
            return next(
                new ApiError(status.UNAUTHORIZED, "Admin not found", "AUTH MIDDLEWARE")
            )
        }
        const adminObj = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
        }

        req.admin = adminObj
        next()

    } catch (error) {
        logger.error('Error in admin middleware:', error);
        new ApiError(status.UNAUTHORIZED, "Invaild or Expired token", "AUTH MIDDLEWARE")
    }
}
export default adminMiddleware; 