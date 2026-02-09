# WebSocket Server

Real-time WebSocket server for the social media platform using Socket.IO.

## Features

- **Real-time Chat**: Direct and group messaging with typing indicators, read receipts, and reactions
- **Live Streaming**: Live video streaming with viewer count, messages, and reactions
- **Notifications**: Real-time notifications for user activities
- **Authentication**: JWT-based authentication for secure connections
- **Redis Integration**: For managing active connections and viewer counts
- **Database Integration**: Prisma ORM for data persistence

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**:
   ```bash
   pnpm dev
   ```

4. **Build for production**:
   ```bash
   pnpm build
   pnpm start
   ```

## WebSocket Events

### Chat Events

#### Client → Server

- `chat:join` - Join a chat room
  ```typescript
  socket.emit('chat:join', chatId: string);
  ```

- `chat:leave` - Leave a chat room
  ```typescript
  socket.emit('chat:leave', chatId: string);
  ```

- `chat:message` - Send a message
  ```typescript
  socket.emit('chat:message', {
    chatId: string;
    content: string;
    tempId?: string;
  });
  ```

- `chat:typing` - Send typing indicator
  ```typescript
  socket.emit('chat:typing', {
    chatId: string;
    isTyping: boolean;
  });
  ```

- `chat:read` - Mark message as read
  ```typescript
  socket.emit('chat:read', {
    chatId: string;
    messageId: string;
  });
  ```

- `chat:reaction` - Add reaction to message
  ```typescript
  socket.emit('chat:reaction', {
    messageId: string;
    reaction: string;
  });
  ```

#### Server → Client

- `chat:joined` - Confirmation of joining chat
- `chat:message` - New message received
- `chat:typing` - User typing status
- `chat:read` - Message read status
- `chat:reaction` - New reaction added

### Live Stream Events

#### Client → Server

- `live:join` - Join a live stream
  ```typescript
  socket.emit('live:join', streamId: string);
  ```

- `live:leave` - Leave a live stream
  ```typescript
  socket.emit('live:leave', streamId: string);
  ```

- `live:message` - Send message in stream
  ```typescript
  socket.emit('live:message', {
    streamId: string;
    content: string;
  });
  ```

- `live:reaction` - Send reaction in stream
  ```typescript
  socket.emit('live:reaction', {
    streamId: string;
    emoji: string;
  });
  ```

- `live:status` - Update stream status (host only)
  ```typescript
  socket.emit('live:status', {
    streamId: string;
    status: 'started' | 'ended';
  });
  ```

#### Server → Client

- `live:joined` - Confirmation of joining stream
- `live:viewer-count` - Updated viewer count
- `live:message` - New message in stream
- `live:reaction` - New reaction in stream
- `live:status` - Stream status changed

### Notification Events

#### Server → Client

- `notification` - Real-time notification
  ```typescript
  {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
  ```

## Client Connection Example

```typescript
import { io } from 'socket.io-client';

// Connect with authentication
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Join a chat
socket.emit('chat:join', 'chat-id-123');

// Listen for messages
socket.on('chat:message', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('chat:message', {
  chatId: 'chat-id-123',
  content: 'Hello, world!'
});
```

## Architecture

```
apps/ws/
├── src/
│   ├── config/          # Configuration files
│   │   ├── index.ts     # Environment config
│   │   ├── logger.ts    # Winston logger
│   │   ├── redis.ts     # Redis client
│   │   └── db.ts        # Database connection
│   ├── handlers/        # Event handlers
│   │   ├── chat.handler.ts
│   │   ├── live.handler.ts
│   │   └── notification.handler.ts
│   ├── middlewares/     # Socket middlewares
│   │   └── auth.middleware.ts
│   └── index.ts         # Server entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | WebSocket server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_ACCESS_TOKEN_SECRET` | JWT secret for token verification | - |
| `JWT_REFRESH_TOKEN_SECRET` | JWT refresh token secret | - |
| `REDIS_HOST` | Redis server host | localhost |
| `REDIS_PORT` | Redis server port | 6379 |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | http://localhost:3000 |

## Redis Usage

Redis is used for:
- **Viewer counts** for live streams (`stream:{streamId}:viewers`)
- **Online status** tracking
- **Pub/Sub** for scaling across multiple server instances (future)

## Scaling

For production deployment with multiple server instances:

1. Enable Redis adapter for Socket.IO
2. Use Redis Pub/Sub for cross-server communication
3. Implement sticky sessions or use Redis for session storage

## Security

- JWT token authentication required for all connections
- CORS configuration for allowed origins
- Rate limiting (to be implemented)
- Input validation for all events

## TODO

- [ ] Implement database operations for saving messages
- [ ] Add rate limiting for events
- [ ] Implement user presence tracking
- [ ] Add support for voice/video calls signaling
- [ ] Implement message encryption
- [ ] Add analytics and monitoring
- [ ] Scale with Redis adapter for multiple instances
