import db from "@repo/db";
import { logger } from "@repo/logger";

export const connectDatabase = async () => {
    try {
        await db.$connect();
        logger.info("Database connected successfully");
    } catch (error) {
        logger.error("Database connection failed", error);
        process.exit(1);
    }
};

export default db;
