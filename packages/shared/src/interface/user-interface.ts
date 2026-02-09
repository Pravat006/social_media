import { MediaType } from '../constants';

export interface IUser {
    id: string;
    username: string;
    email: string;
    password?: string | null;
    name?: string | null;
    bio?: string | null;
    profilePictureId?: string | null;
    isVerified: boolean;
    isPrivate: boolean;
    lastSeen?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserProfile extends IUser {
    profilePicture?: IMedia | null;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
}

export interface IFollow {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
    follower?: IUser;
    following?: IUser;
}

export interface IMedia {
    id: string;
    ownerId: string;
    url: string;
    type: MediaType;
    mimeType?: string | null;
    size?: number | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
    createdAt: Date;
    updatedAt: Date;
    owner?: IUser;
}
