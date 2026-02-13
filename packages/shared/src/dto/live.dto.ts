/**
 * Live Stream-related Data Transfer Objects (DTOs)
 * Used for: HTTP responses, WebSocket events, Redis Pub/Sub, Kafka messages
 */

import type {
    ILiveStream,
    ILiveMessage,
    ILiveReaction,
} from '../interface';
import type { Serialize } from './common';


export interface LiveStreamDTO extends Omit<Serialize<ILiveStream>, 'host' | 'thumbnail' | 'viewers' | 'messages' | 'reactions'> {
}

/**
 * Serialized live message (for WebSocket/Redis)
 * Based on ILiveMessage interface
 */
export interface LiveMessageDTO extends Omit<Serialize<ILiveMessage>, 'stream' | 'user'> {
    username: string;
}

/**
 * Live message input (from client)
 */
export interface LiveMessageInputDTO {
    streamId: string;
    content: string;
}

/**
 * Serialized live reaction (for WebSocket/Redis)
 * Based on ILiveReaction interface
 */
export interface LiveReactionDTO extends Omit<Serialize<ILiveReaction>, 'stream' | 'user'> {
    username: string;
}

/**
 * Live viewer event
 */
export interface LiveViewerDTO {
    streamId: string;
    userId: string;
    username: string;
    action: 'joined' | 'left';
}

/**
 * Live viewer count
 */
export interface LiveViewerCountDTO {
    streamId: string;
    count: number;
}

/**
 * Live stream status
 */
export interface LiveStatusDTO {
    streamId: string;
    status: 'started' | 'ended';
    startedAt?: string;
    endedAt?: string;
}

/**
 * Union type for all live stream channel messages
 */
export type LiveChannelMessage =
    | LiveMessageDTO
    | LiveReactionDTO
    | LiveViewerDTO
    | LiveViewerCountDTO
    | LiveStatusDTO;
