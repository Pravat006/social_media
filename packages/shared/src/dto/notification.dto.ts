/**
 * User notification
 */
export interface NotificationDTO {
    id?: string;
    userId: string;
    type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
    title: string;
    message: string;
    data?: {
        postId?: string;
        commentId?: string;
        userId?: string;
        messageId?: string;
    };
    createdAt: string;
    read?: boolean;
}

/**
 * Server-wide broadcast
 */
export interface BroadcastDTO {
    type: 'announcement' | 'maintenance' | 'update';
    title: string;
    message: string;
    data?: Record<string, any>;
    timestamp: string;
}
