import db from "@repo/db";
import { logger } from "@repo/logger";

export const connectDatabase = async () => {
    try {
        await db.$connect();
        logger.info("Database connected successfully", "HTTP");
    } catch (error) {
        logger.error("Database connection failed", error, "HTTP");
        process.exit(1);
    }
};

export default db;