import { redisClient } from "@/redis"

export class MembershipService {
    private _key(userId: string) {
        return `user:${userId}:rooms`
    }
    async isCachedMember(userId: string, chatId: string) {
        return (
            await redisClient.sismember(this._key(userId), chatId) === 1
        )
    }
    async cacheMembership(userId: string, chatId: string) {
        return redisClient.sadd(this._key(userId), chatId)
    }
    async removeCachedMembership(userId: string, chatId: string) {
        return redisClient.srem(this._key(userId), chatId)
    }
    async loadMemberships(userId: string) {
        return redisClient.smembers(this._key(userId))
    }
}


