
import type { IUser } from '../interface';
import type { Serialize } from './common';

/**
 * Serialized user (for WebSocket/Redis)
 */
export interface UserDTO extends Omit<Serialize<IUser>, 'password'> {
}

/**
 * User presence (online/offline)
 */
export interface UserPresenceDTO {
    userId: string;
    username?: string;
    status: 'online' | 'offline';
    lastSeen?: string;
}
