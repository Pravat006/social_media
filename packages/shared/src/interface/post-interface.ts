import { IUser, IMedia } from './user-interface';

export interface IPost {
    id: string;
    authorId: string;
    caption?: string | null;
    views: number;
    createdAt: Date;
    updatedAt: Date;
    author?: IUser;
    media?: IPostMedia[];
    likes?: IPostLike[];
    comments?: IComment[];
    likesCount?: number;
    commentsCount?: number;
}

export interface IPostMedia {
    postId: string;
    mediaId: string;
    post?: IPost;
    media?: IMedia;
}

export interface IPostLike {
    userId: string;
    postId: string;
    createdAt: Date;
    user?: IUser;
    post?: IPost;
}

export interface IComment {
    id: string;
    postId: string;
    authorId: string;
    parentId?: string | null;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    post?: IPost;
    author?: IUser;
    parent?: IComment | null;
    replies?: IComment[];
}
