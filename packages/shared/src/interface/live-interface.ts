import { IUser, IMedia } from './user-interface';
import { StreamVisibility } from '../constants';

export interface ILiveStream {
    id: string;
    hostId: string;
    title?: string | null;
    description?: string | null;
    thumbnailId?: string | null;
    streamKey: string;
    category?: string | null;
    tags: string[];
    visibility: StreamVisibility;
    startedAt?: Date | null;
    endedAt?: Date | null;
    isActive: boolean;
    viewerCount: number;
    createdAt: Date;
    updatedAt: Date;
    host?: IUser;
    thumbnail?: IMedia | null;
    viewers?: ILiveViewer[];
    messages?: ILiveMessage[];
    reactions?: ILiveReaction[];
}

export interface ILiveViewer {
    id: string;
    streamId: string;
    userId: string;
    joinedAt: Date;
    leftAt?: Date | null;
    stream?: ILiveStream;
    user?: IUser;
}

export interface ILiveMessage {
    id: string;
    streamId: string;
    userId: string;
    content: string;
    createdAt: Date;
    stream?: ILiveStream;
    user?: IUser;
}

export interface ILiveReaction {
    id: string;
    streamId: string;
    userId: string;
    emoji: string;
    createdAt: Date;
    stream?: ILiveStream;
    user?: IUser;
}
