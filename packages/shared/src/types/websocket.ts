/**
 * WebSocket Event Types
 */


export interface SocketUser {
    id: string;
    username: string;
    email: string;
    name?: string | null;
    profilePictureId?: string | null;
}


export interface ChatJoinData {
    chatId: string;
}

export interface ChatLeaveData {
    chatId: string;
}

export interface ChatMessageData {
    chatId: string;
    content?: string;
    tempId?: string;
    mediaIds?: string[];
}

export interface ChatTypingData {
    chatId: string;
    isTyping: boolean;
}

export interface ChatReadData {
    chatId: string;
    messageId: string;
}

export interface ChatReactionData {
    chatId: string;
    messageId: string;
    reaction: string;
}

export interface ChatDeleteData {
    chatId: string;
    messageId: string;
}


export interface LiveJoinData {
    streamId: string;
}

export interface LiveLeaveData {
    streamId: string;
}

export interface LiveMessageData {
    streamId: string;
    content: string;
}

export interface LiveReactionData {
    streamId: string;
    emoji: string;
}

export interface LiveStatusData {
    streamId: string;
    status: 'started' | 'ended';
}


export interface NotificationData {
    type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
    title: string;
    message: string;
    data?: any;
    createdAt: Date;
}


export interface ServerToClientEvents {
    // Chat Events
    'chat:joined': (data: {
        chatId: string;
        userId: string;
        username: string;
    }) => void;

    'chat:left': (data: {
        chatId: string;
        userId: string;
        username: string;
    }) => void;

    'chat:message': (data: {
        id: string;
        chatId: string;
        senderId: string;
        senderUsername: string;
        senderName?: string | null;
        content: string;
        type: 'USER' | 'SYSTEM' | 'CALL';
        createdAt: string;
        tempId?: string;
        mediaIds?: string[];
    }) => void;

    'chat:typing': (data: {
        chatId: string;
        userId: string;
        username: string;
        isTyping: boolean;
    }) => void;

    'chat:read': (data: {
        chatId: string;
        messageId: string;
        userId: string;
        readAt: string;
    }) => void;

    'chat:reaction': (data: {
        chatId: string;
        messageId: string;
        userId: string;
        username: string;
        reaction: string;
        createdAt: string;
    }) => void;

    'chat:delete': (data: {
        chatId: string;
        messageId: string;
        userId: string;
        deletedAt: string;
    }) => void;

    // Live Stream Events
    'live:joined': (data: {
        streamId: string;
        userId: string;
        username: string;
    }) => void;

    'live:left': (data: {
        streamId: string;
        userId: string;
        username: string;
    }) => void;

    'live:viewer-count': (data: {
        streamId: string;
        count: number;
    }) => void;

    'live:message': (data: {
        id: string;
        streamId: string;
        userId: string;
        username: string;
        content: string;
        createdAt: string;
    }) => void;

    'live:reaction': (data: {
        streamId: string;
        userId: string;
        username: string;
        emoji: string;
        timestamp: number;
    }) => void;

    'live:status': (data: {
        streamId: string;
        status: 'started' | 'ended';
        startedAt?: string;
        endedAt?: string;
    }) => void;

    // Notification Events
    'notification': (notification: NotificationData) => void;

    // User Presence Events
    'user:online': (data: {
        userId: string;
        username: string;
    }) => void;

    'user:offline': (data: {
        userId: string;
        username: string;
        lastSeen: string;
    }) => void;

    // General Events
    'error': (error: {
        message: string;
        code?: string;
    }) => void;

    'success': (data: {
        message: string;
        data?: any;
    }) => void;

    'users:online_initial': (userIds: string[]) => void;
}

export interface ClientToServerEvents {
    // Chat Events
    'chat:join': (chatId: string) => void;
    'chat:leave': (chatId: string) => void;
    'chat:message': (data: ChatMessageData) => void;
    'chat:typing': (data: ChatTypingData) => void;
    'chat:read': (data: ChatReadData) => void;
    'chat:reaction': (data: ChatReactionData) => void;
    'chat:delete': (data: ChatDeleteData) => void;

    // Live Stream Events
    'live:join': (streamId: string) => void;
    'live:leave': (streamId: string) => void;
    'live:message': (data: LiveMessageData) => void;
    'live:reaction': (data: LiveReactionData) => void;
    'live:status': (data: LiveStatusData) => void;

    // User Presence Events
    'user:online': () => void;
    'user:offline': () => void;
}

export interface InterServerEvents {
    ping: () => void;
    'user:broadcast': (data: {
        userId: string;
        event: string;
        data: any;
    }) => void;
}


export interface SocketData {
    userId: string;
    user: SocketUser;
}

export interface AuthenticatedSocket {
    id: string;
    data: SocketData;
    user: SocketUser;
    join: (room: string) => void;
    leave: (room: string) => void;
    emit: <K extends keyof ServerToClientEvents>(
        event: K,
        ...args: Parameters<ServerToClientEvents[K]>
    ) => boolean;
    on: <K extends keyof ClientToServerEvents>(
        event: K,
        listener: ClientToServerEvents[K]
    ) => void;
}

