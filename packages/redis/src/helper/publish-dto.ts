import { publish } from '../pubsub';
import { channels } from './channels';
import type {
    ChatMessageDTO,
    ChatTypingDTO,
    ChatReadDTO,
    ChatReactionDTO,
    ChatMemberDTO,
    LiveMessageDTO,
    LiveReactionDTO,
    LiveViewerDTO,
    LiveViewerCountDTO,
    LiveStatusDTO,
    UserPresenceDTO,
    NotificationDTO,
    BroadcastDTO,
} from '../types';

export const publishDTO = {
    /**
     * Publish a chat message
     */
    chatMessage: async (chatId: string, message: ChatMessageDTO): Promise<number> => {
        return publish(channels.chat(chatId), message);
    },

    /**
     * Publish a typing indicator
     */
    chatTyping: async (chatId: string, typing: ChatTypingDTO): Promise<number> => {
        return publish(channels.chat(chatId), typing);
    },

    /**
     * Publish a read receipt
     */
    chatRead: async (chatId: string, read: ChatReadDTO): Promise<number> => {
        return publish(channels.chat(chatId), read);
    },

    /**
     * Publish a message reaction
     */
    chatReaction: async (chatId: string, reaction: ChatReactionDTO): Promise<number> => {
        return publish(channels.chat(chatId), reaction);
    },

    /**
     * Publish a chat member event
     */
    chatMember: async (chatId: string, member: ChatMemberDTO): Promise<number> => {
        return publish(channels.chat(chatId), member);
    },

    /**
     * Publish a live stream message
     */
    liveMessage: async (streamId: string, message: LiveMessageDTO): Promise<number> => {
        return publish(channels.liveStream(streamId), message);
    },

    /**
     * Publish a live stream reaction
     */
    liveReaction: async (streamId: string, reaction: LiveReactionDTO): Promise<number> => {
        return publish(channels.liveStream(streamId), reaction);
    },

    /**
     * Publish a live viewer event
     */
    liveViewer: async (streamId: string, viewer: LiveViewerDTO): Promise<number> => {
        return publish(channels.liveStream(streamId), viewer);
    },

    /**
     * Publish live viewer count
     */
    liveViewerCount: async (streamId: string, count: LiveViewerCountDTO): Promise<number> => {
        return publish(channels.liveStream(streamId), count);
    },

    /**
     * Publish live stream status
     */
    liveStatus: async (streamId: string, status: LiveStatusDTO): Promise<number> => {
        return publish(channels.liveStream(streamId), status);
    },

    /**
     * Publish user presence
     */
    userPresence: async (presence: UserPresenceDTO): Promise<number> => {
        return publish(channels.presence(), presence);
    },

    /**
     * Publish a notification to a user
     */
    notification: async (userId: string, notification: NotificationDTO): Promise<number> => {
        return publish(channels.notification(userId), notification);
    },

    /**
     * Publish a broadcast message
     */
    broadcast: async (broadcast: BroadcastDTO): Promise<number> => {
        return publish(channels.broadcast(), broadcast);
    },
};
