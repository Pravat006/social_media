import { logger } from "@repo/logger";
import client from "./client";

const CACHE_TTL = 900;
export const REDIS = {
    async connect() {
        if (client.status !== 'ready') await client.connect();
    },
    async quit() {
        if (client.status === 'ready')
            await client.quit();
    },
    async get<T>(key: string): Promise<T | null> {
        await this.connect();
        const data = await client.get(key);
        if (data) {
            logger.info(`[REDIS] CACHE HIT for key: ${key}`);
            return JSON.parse(data) as T;
        } else {
            logger.info(`[REDIS] CACHE MISS for key: ${key}`);
            return null;
        }
    },

    async set<T>(key: string, value: T, ttl: number = CACHE_TTL): Promise<boolean> {
        await this.connect();
        const result = await client.set(key, JSON.stringify(value), 'EX', ttl);
        return result === 'OK';
    },

    async delete(key: string): Promise<boolean> {
        await this.connect();
        const result = await client.del(key);
        return result > 0;
    },

    async deleteByPattern(pattern: string): Promise<void> {
        await this.connect();
        let cursor = '0';
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await client.del(keys);
                logger.info(`[REDIS] Deleting keys: ${keys.join(', ')}`);
            }
        } while (cursor !== '0');
    },

    async flushAll(): Promise<void> {
        await this.connect();
        await client.flushdb();
    },

    async publish(channel: string, message: any): Promise<number> {
        await this.connect();
        return await client.publish(channel, JSON.stringify(message));
    }
};
