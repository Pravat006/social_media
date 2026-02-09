import { IUser } from "@repo/shared";
import { NextFunction, Request, Response, RequestHandler } from "express";

declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res, next)).catch((err) => next(err));