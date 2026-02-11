
export const TOPICS = {
    /**
     * Published when: User sends a message
     * Consumed by: WebSocket server for real-time delivery
     */
    CHAT_MESSAGE_SENT: "chat.message.sent",

    /**
     * Message edit topic
     * Published when: User edits a message
     * Consumed by: WebSocket server to update message content
     */
    CHAT_MESSAGE_EDITED: "chat.message.edited",

    /**
     * Message reaction topic
     * Published when: User reacts to a message (like, love, etc.)
     * Consumed by: WebSocket server for reaction updates
     */
    CHAT_REACTION: "chat.reaction",

    /**
     * Message deletion topic
     * Published when: User deletes a message
     * Consumed by: WebSocket server to remove message from UI
     */
    CHAT_MESSAGE_DELETED: "chat.message.deleted",



} as const;

export type TopicName = typeof TOPICS[keyof typeof TOPICS];
