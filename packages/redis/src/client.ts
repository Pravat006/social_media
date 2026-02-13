import { logger } from "@repo/logger";
import Redis from "ioredis";
import { config } from "@repo/env-config";


const client = new Redis({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
});
client.on('connect', () => logger.info('[REDIS] Connecting...'));
client.on('ready', () => logger.info('[REDIS] Connected successfully.'));
client.on('error', () => logger.error('[REDIS] Connection error'));
client.on('end', () => logger.info('[REDIS] Connection closed.'));

export default client;