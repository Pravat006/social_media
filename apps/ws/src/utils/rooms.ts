/**
 * Centralized room name generators to maintain consistency
 * across all handlers and middlewares.
 */
export const getChatRoomId = (chatId: string): string => `chat:${chatId}`;

export const getUserRoomId = (userId: string): string => `user:${userId}`;

export const getStreamRoomId = (streamId: string): string => `stream:${streamId}`;
