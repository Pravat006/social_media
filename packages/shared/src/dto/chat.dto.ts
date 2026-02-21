/**
 * Chat-related Data Transfer Objects (DTOs)
 */

import type {
    IMessage,
    IChat,
    IChatMember,
    IMessageReaction,
    IMessageRead,
} from '../interface';
import type { UserDTO } from './user.dto';
import type { Serialize } from './common';


export interface ChatMessageDTO extends Omit<Serialize<IMessage>, 'chat' | 'sender' | 'messageMedias' | 'messageReactions' | 'messageReads' | 'callData'> {
    senderUsername: string;
    senderName?: string | null;
    senderAvatar?: string | null;
    tempId?: string;
}

/**
 * Chat message input (from client)
 */
export interface ChatMessageInputDTO {
    chatId: string;
    content: string;
    tempId?: string;
}

/**
 * Serialized chat (for HTTP responses)
 * Based on IChat interface
 */
export interface ChatDTO extends Omit<Serialize<IChat>, 'members' | 'messages'> {
    lastMessage?: ChatMessageDTO;
    members?: ChatMemberDTO[];
    unreadCount?: number;
}

/**
 * Chat typing indicator
 */
export interface ChatTypingDTO {
    chatId: string;
    userId: string;
    username: string;
    isTyping: boolean;
}

/**
 * Chat message read receipt
 * Based on IMessageRead interface
 */
export interface ChatReadDTO extends Serialize<IMessageRead> {
    username: string;
}

/**
 * Chat message reaction
 * Based on IMessageReaction interface
 */
export interface ChatReactionDTO extends Serialize<IMessageReaction> {
    username: string;
}

/**
 * Full chat member record
 */
export interface ChatMemberDTO extends Omit<Serialize<IChatMember>, 'user' | 'chat'> {
    user?: UserDTO;
}

/**
 * Chat member event (join/leave)
 */
export interface ChatMemberEventDTO {
    chatId: string;
    userId: string;
    username: string;
    action: 'joined' | 'left';
}

/**
 * Union type for all chat channel messages
 */
export type ChatChannelMessage =
    | ChatMessageDTO
    | ChatTypingDTO
    | ChatReadDTO
    | ChatReactionDTO
    | ChatMemberDTO;
