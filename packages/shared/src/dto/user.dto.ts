import type { IUser, IMedia, IUserProfile } from '../interface';
import type { Serialize } from './common';

/**
 * Serialized user (for WebSocket/Redis)
 */
export interface UserDTO extends Omit<Serialize<IUser>, 'password'> {
}

/**
 * Serialized media
 */
export interface MediaDTO extends Serialize<IMedia> {
}

/**
 * Serialized user profile
 */
export interface UserProfileDTO extends Omit<Serialize<IUserProfile>, 'password' | 'profilePicture'> {
    profilePicture?: MediaDTO | null;
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
