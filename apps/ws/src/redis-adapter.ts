import { createAdapter } from '@socket.io/redis-adapter';
import {
    getPublisher,
    getSubscriber,
} from './redis';

export const createRedisAdapter = () => {
    const pubClient = getPublisher();
    const subClient = getSubscriber();
    const adapter = createAdapter(pubClient, subClient);
    return adapter;
}