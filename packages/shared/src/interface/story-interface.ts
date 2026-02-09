import { IUser, IMedia } from './user-interface';

export interface IStory {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    user?: IUser;
    media?: IStoryMedia[];
    views?: IStoryView[];
    viewsCount?: number;
}

export interface IStoryMedia {
    storyId: string;
    mediaId: string;
    story?: IStory;
    media?: IMedia;
}

export interface IStoryView {
    storyId: string;
    userId: string;
    viewedAt: Date;
    story?: IStory;
    user?: IUser;
}
