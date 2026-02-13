/**
 * Data Transfer Objects (DTOs)
 * 
 * DTOs are serialized versions of database interfaces optimized for network transmission.
 * They convert Date objects to ISO strings and exclude unnecessary nested relations.
 * 
 * Use these for:
 * - HTTP responses
 * - WebSocket events
 * - Redis Pub/Sub messages
 * - Kafka messages
 */


export * from './common';

export * from './chat.dto';
export * from './live.dto';
export * from './user.dto';
export * from './notification.dto';

import type {
    ChatMessageDTO,
    ChatTypingDTO,
    ChatReadDTO,
    ChatReactionDTO,
    ChatMemberDTO,
} from './chat.dto';

import type {
    LiveMessageDTO,
    LiveReactionDTO,
    LiveViewerDTO,
    LiveViewerCountDTO,
    LiveStatusDTO,
} from './live.dto';

import type {
    UserPresenceDTO,
} from './user.dto';

import type {
    NotificationDTO,
    BroadcastDTO,
} from './notification.dto';

/**
 * Union type for all Redis Pub/Sub message types
 */
export type RedisPubSubMessage =
    | ChatMessageDTO
    | ChatTypingDTO
    | ChatReadDTO
    | ChatReactionDTO
    | ChatMemberDTO
    | LiveMessageDTO
    | LiveReactionDTO
    | LiveViewerDTO
    | LiveViewerCountDTO
    | LiveStatusDTO
    | NotificationDTO
    | UserPresenceDTO
    | BroadcastDTO;
