import { Server as SocketIoServer, Socket } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@repo/shared';


export type IOServer = SocketIoServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

export interface IOSocket extends Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
> {
    userId?: string;
    user?: {
        id: string;
        username: string;
        email: string;
        name?: string | null;
    };
}
