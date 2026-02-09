// Chat Events
export interface ChatJoinData {
    chatId: string;
}

export interface ChatMessageData {
    chatId: string;
    content: string;
    tempId?: string;
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
    messageId: string;
    reaction: string;
}

// Live Stream Events
export interface LiveJoinData {
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

// Notification Events
export interface NotificationData {
    type: 'like' | 'comment' | 'follow' | 'mention' | 'message';
    title: string;
    message: string;
    data?: any;
    createdAt: Date;
}

// Server to Client Events
export interface ServerToClientEvents {
    // Chat
    'chat:joined': (data: { chatId: string }) => void;
    'chat:message': (message: any) => void;
    'chat:typing': (data: { chatId: string; userId: string; username?: string; isTyping: boolean }) => void;
    'chat:read': (data: { chatId: string; messageId: string; userId: string }) => void;
    'chat:reaction': (data: { messageId: string; userId: string; reaction: string; username?: string }) => void;

    // Live Stream
    'live:joined': (data: { streamId: string }) => void;
    'live:viewer-count': (data: { streamId: string; count: number }) => void;
    'live:message': (message: any) => void;
    'live:reaction': (data: { streamId: string; userId: string; username?: string; emoji: string; timestamp: number }) => void;
    'live:status': (data: { streamId: string; status: string }) => void;

    // Notifications
    'notification': (notification: NotificationData) => void;

    // General
    'error': (error: { message: string }) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
    // Chat
    'chat:join': (chatId: string) => void;
    'chat:leave': (chatId: string) => void;
    'chat:message': (data: ChatMessageData) => void;
    'chat:typing': (data: ChatTypingData) => void;
    'chat:read': (data: ChatReadData) => void;
    'chat:reaction': (data: ChatReactionData) => void;

    // Live Stream
    'live:join': (streamId: string) => void;
    'live:leave': (streamId: string) => void;
    'live:message': (data: LiveMessageData) => void;
    'live:reaction': (data: LiveReactionData) => void;
    'live:status': (data: LiveStatusData) => void;

    // User
    'user:online': () => void;
}

// Inter-server Events (for scaling)
export interface InterServerEvents {
    ping: () => void;
}

// Socket Data
export interface SocketData {
    userId: string;
    user: {
        id: string;
        username: string;
        email: string;
        name?: string | null;
    };
}
