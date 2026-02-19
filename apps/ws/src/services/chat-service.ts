import db from "@/config/db";

class ChatService {

    async getChatMembers(chatId: string) {
        const chat = await db.chat.findUnique({
            where: { id: chatId },
            select: { members: true }
        });
        return chat?.members || [];
    }

    async checkChatMembership(chatId: string, userId: string): Promise<boolean> {
        const membership = await db.chatMember.findUnique({
            where: {
                chatId_userId: {
                    chatId,
                    userId
                }
            }
        });
        return !!membership;
    }

    async joinChat(chatId: string, userId: string) {
        const chat = await db.chat.findUnique({
            where: { id: chatId },
            select: { type: true }
        });

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.type === "DIRECT") {
            const isMember = await this.checkChatMembership(chatId, userId);
            if (!isMember) {
                throw new Error("User is not a member of this direct chat");
            }
            return { chatId, userId, status: "already_member" };
        }

        return await db.chatMember.upsert({
            where: {
                chatId_userId: {
                    chatId,
                    userId
                }
            },
            update: {}, // Already a member, do nothing
            create: {
                chatId,
                userId
            }
        });
    }
}

export const chatService = new ChatService()