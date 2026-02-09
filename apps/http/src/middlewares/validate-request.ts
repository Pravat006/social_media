import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import status from "http-status";
import { logger } from "@repo/logger";

export const validateRequest = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            logger.error("[VALIDATION ERROR]", {
                url: req.url,
                body: req.body,
                errors: error.errors
            });
            return res.status(status.BAD_REQUEST).json({
                success: false,
                message: "Validation Error",
                errors: error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        next(error);
    }
};
