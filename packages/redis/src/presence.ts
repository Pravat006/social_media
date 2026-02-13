import { logger } from "@repo/logger";
import client from "./client";
import { publishDTO } from "./pubsub";
import type { UserPresenceDTO } from "./types";

/**
 * Ensure Redis client is connected
 */
async function ensureConnection() {
    if (client.status !== 'ready') {
        await client.connect();
    }
}

/**
 * Set user online status
 * Stores in Redis and broadcasts to all servers via Pub/Sub
 * 
 * @param userId - User ID
 * @param username - Username for display
 */
export const setUserOnline = async (userId: string, username?: string): Promise<void> => {
    try {
        await ensureConnection();

        await client.set(`user:${userId}:online`, '1', 'EX', 30);

        const presence: UserPresenceDTO = username
            ? { userId, username, status: 'online' }
            : { userId, status: 'online' };

        await publishDTO.userPresence(presence);

        logger.debug(`[REDIS Presence] User ${username || userId} is now online`);
    } catch (error) {
        logger.error('[REDIS Presence] Failed to set user online', { userId, error });
        throw error;
    }
};

/**
 * Set user offline status
 * @param userId - User ID
 * @param username - Username for display
 */
export const setUserOffline = async (userId: string, username?: string): Promise<void> => {
    try {
        await ensureConnection();

        await client.del(`user:${userId}:online`);

        const presence: UserPresenceDTO = username
            ? { userId, username, status: 'offline', lastSeen: new Date().toISOString() }
            : { userId, status: 'offline', lastSeen: new Date().toISOString() };

        await publishDTO.userPresence(presence);

        logger.debug(`[REDIS Presence] User ${username || userId} is now offline`);
    } catch (error) {
        logger.error('[REDIS Presence] Failed to set user offline', { userId, error });
        throw error;
    }
};

/**
 * Check if user is online
 * @param userId - User ID
 * @returns true if user is online, false otherwise
 */
export const isUserOnline = async (userId: string): Promise<boolean> => {
    try {
        await ensureConnection();
        const online = await client.get(`user:${userId}:online`);
        return online === '1';
    } catch (error) {
        logger.error('[REDIS Presence] Failed to check user online status', { userId, error });
        return false;
    }
};

/**
 * Get all online users
 * @returns Array of online user IDs
 */
export const getOnlineUsers = async (): Promise<string[]> => {
    try {
        await ensureConnection();

        const keys = await client.keys('user:*:online');
        // Extract user IDs from keys like "user:123:online"
        return keys
            .map(key => key.split(':')[1])
            .filter((id): id is string => id !== undefined);
    } catch (error) {
        logger.error('[REDIS Presence] Failed to get online users', { error });
        return [];
    }
};

/**
 * Heartbeat to keep user online
 * @param userId - User ID
 */
export const heartbeat = async (userId: string): Promise<void> => {
    try {
        await ensureConnection();

        // Refresh TTL to 30 seconds
        await client.expire(`user:${userId}:online`, 30);
    } catch (error) {
        logger.error('[REDIS Presence] Failed to send heartbeat', { userId, error });
        throw error;
    }
};

/**
 * Set user typing status
 * Auto-expires after 5 seconds if not refreshed
 * @param userId - User ID
 * @param chatId - Chat ID
 */
export const setUserTyping = async (userId: string, chatId: string): Promise<void> => {
    try {
        await ensureConnection();
        await client.set(`user:${userId}:typing:${chatId}`, '1', 'EX', 5);
    } catch (error) {
        logger.error('[REDIS Presence] Failed to set user typing', { userId, chatId, error });
        throw error;
    }
};

/**
 * Stop user typing status
 * @param userId - User ID
 * @param chatId - Chat ID
 */
export const stopUserTyping = async (userId: string, chatId: string): Promise<void> => {
    try {
        await ensureConnection();
        await client.del(`user:${userId}:typing:${chatId}`);
    } catch (error) {
        logger.error('[REDIS Presence] Failed to stop user typing', { userId, chatId, error });
        throw error;
    }
};

/**
 * Check if user is typing in a chat
 * @param userId - User ID
 * @param chatId - Chat ID
 * @returns true if user is typing, false otherwise
 */
export const isUserTyping = async (userId: string, chatId: string): Promise<boolean> => {
    try {
        await ensureConnection();
        const typing = await client.get(`user:${userId}:typing:${chatId}`);
        return typing === '1';
    } catch (error) {
        logger.error('[REDIS Presence] Failed to check user typing status', { userId, chatId, error });
        return false;
    }
};