import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger, httpLogger } from '@repo/logger';
import router from './routes';
import path from 'path';
import { errorHandler, apiLimiter, notFound } from '@/middlewares';
import status from 'http-status';

import config from "@/config";

const app: Application = express();
// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

httpLogger(app);

app.use(cors({
    origin: config.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    res.status(500).json({
        message: config.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
});
app.use('/static', express.static(path.join(process.cwd(), 'public')));

app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {

    logger.info("HEALTH CHECK HIT")
    return res.status(status.OK).json({
        message: "health check hit from backend"
    })
})
app.use("/api/v0", apiLimiter, router);

app.use(notFound)
app.use(errorHandler)

export default app