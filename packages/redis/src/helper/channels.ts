export const channels = {
    /**
     * Chat room channel
     * @param chatId - Chat ID
     */
    chat: (chatId: string) => `chat:${chatId}`,

    /**
     * User-specific channel
     * @param userId - User ID
     */
    user: (userId: string) => `user:${userId}`,

    /**
     * Live stream channel
     * @param streamId - Stream ID
     */
    liveStream: (streamId: string) => `live:${streamId}`,

    /**
     * Notification channel
     * @param userId - User ID
     */
    notification: (userId: string) => `notification:${userId}`,

    /**
     * Presence channel (online/offline)
     */
    presence: () => 'presence',

    /**
     * Broadcast to all servers
     */
    broadcast: () => 'broadcast',
};