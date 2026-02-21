import { ApiError } from "@/interface";
import { CreateChatInput, DeleteChatInput, UpdateChatInput, UpdateChatMemberInput } from "./chat-validation";
import db from "@/services/db";
import status from "http-status";
import { logger } from "@repo/logger";
import { ChatRole } from "@repo/shared";


import { toChatDTO, toChatMemberDTO } from "./chat-dto";


class ChatService {

    async getUserChats(userId: string) {
        try {
            const chats = await db.chat.findMany({
                where: {
                    members: {
                        some: { userId }
                    }
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    name: true,
                                    email: true,
                                    bio: true,
                                    profilePictureId: true,
                                    isVerified: true,
                                    isPrivate: true,
                                    lastSeen: true,
                                    createdAt: true,
                                    updatedAt: true,
                                    profilePicture: {
                                        select: {
                                            id: true,
                                            url: true,
                                            type: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                    name: true,
                                    profilePicture: {
                                        select: {
                                            id: true,
                                            url: true,
                                            type: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });

            return chats.map(toChatDTO);
        } catch (error) {
            logger.error("Failed to get user chats", error, "ChatService:getUserChats");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to get user chats");
        }
    }

    async initChat(data: CreateChatInput, creatorId: string) {
        try {
            const { memberIds: rawMemberIds, name, type } = data;
            const memberIds = Array.from(new Set(rawMemberIds)); // Deduplicate

            if (type === "DIRECT") {
                if (memberIds.length === 1 && memberIds[0] === creatorId) {
                    throw new ApiError(status.BAD_REQUEST, "You cannot start a direct chat with yourself");
                }
                if (memberIds.length !== 2) {
                    throw new ApiError(status.BAD_REQUEST, "Direct chat requires exactly two unique users");
                }

                const sortedIds = [...memberIds].sort();
                const directKey = sortedIds.join("-");
                const existingChat = await db.chat.findUnique({
                    where: { directKey },
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        email: true,
                                        bio: true,
                                        profilePictureId: true,
                                        isVerified: true,
                                        isPrivate: true,
                                        lastSeen: true,
                                        createdAt: true,
                                        updatedAt: true,
                                    }
                                }
                            }
                        }
                    }
                });

                if (existingChat) return toChatDTO(existingChat);

                const newChat = await db.chat.create({
                    data: {
                        type: "DIRECT",
                        directKey,
                        members: {
                            create: memberIds.map((id) => ({
                                userId: id,
                                role: "MEMBER" as ChatRole
                            }))
                        }
                    },
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        email: true,
                                        bio: true,
                                        profilePictureId: true,
                                        isVerified: true,
                                        isPrivate: true,
                                        lastSeen: true,
                                        createdAt: true,
                                        updatedAt: true,
                                    }
                                }
                            }
                        }
                    }
                });
                return toChatDTO(newChat);
            } else {
                const newChat = await db.chat.create({
                    data: {
                        type: "GROUP",
                        name: name,
                        members: {
                            create: [
                                { userId: creatorId, role: "ADMIN" as ChatRole },
                                ...memberIds.filter(id => id !== creatorId).map((id) => ({
                                    userId: id,
                                    role: "MEMBER" as ChatRole
                                }))
                            ]
                        }
                    },
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        email: true,
                                        bio: true,
                                        profilePictureId: true,
                                        isVerified: true,
                                        isPrivate: true,
                                        lastSeen: true,
                                        createdAt: true,
                                        updatedAt: true,
                                    }
                                }
                            }
                        }
                    }
                });
                return toChatDTO(newChat);
            }
        } catch (error: any) {
            if (error instanceof ApiError) throw error;

            // Catch Prisma unique constraint violations (P2002)
            if (error.code === 'P2002') {
                throw new ApiError(status.CONFLICT, "Chat or membership already exists");
            }

            logger.error("Failed to create chat", { error: error.message, stack: error.stack }, "ChatService:initChat");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to create chat");
        }
    }

    async deleteChat(data: DeleteChatInput) {
        try {
            const { chatId, userId } = data;
            const chat = await db.chat.findUnique({
                where: { id: chatId },
                include: { members: true }
            });

            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");

            const member = chat.members.find((m) => m.userId === userId);
            if (!member) throw new ApiError(status.FORBIDDEN, "You are not a member of this chat");

            if (chat.type === "DIRECT") {
                const result = await db.chatMember.update({
                    where: { chatId_userId: { chatId, userId } },
                    data: { lastDeletedAt: new Date() }
                });
                return toChatMemberDTO(result);
            } else {
                if (member.role === "ADMIN") {
                    const result = await db.chat.delete({ where: { id: chatId } });
                    return toChatDTO(result);
                } else {
                    const result = await db.chatMember.delete({
                        where: { chatId_userId: { chatId, userId } }
                    });
                    return toChatMemberDTO(result);
                }
            }
        } catch (error) {
            if (error instanceof ApiError) throw error;
            logger.error("Failed to delete chat", error, "ChatService:deleteChat");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to delete chat");
        }
    }

    async updateChat(data: UpdateChatInput) {
        const { chatId, name, userId } = data;
        try {
            const chat = await db.chat.findUnique({
                where: { id: chatId },
                include: { members: true }
            });
            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");
            if (chat.type === "DIRECT") throw new ApiError(status.BAD_REQUEST, "Direct chat cannot be updated");
            if (chat.members.find((member) => member.userId === userId)?.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "User is not admin of the chat");

            const result = await db.chat.update({
                where: { id: chatId },
                data: { name }
            });
            return toChatDTO(result);
        } catch (error) {
            logger.error("Failed to update chat", error, "ChatService:updateChat");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to update chat");
        }
    }

    async addOrRemoveChatMember(data: UpdateChatMemberInput, currentUserId: string) {
        const { chatId, userId, role, action } = data;
        try {
            const chat = await db.chat.findUnique({
                where: { id: chatId },
                include: { members: true }
            });
            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");
            if (chat.type === "DIRECT") throw new ApiError(status.BAD_REQUEST, "Direct chat cannot be updated");
            if (chat.members.find((member) => member.userId === currentUserId)?.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "User is not admin of the chat");

            if (action === "ADD") {
                const result = await db.chatMember.create({
                    data: {
                        chatId,
                        userId,
                        role: (role === "ADMIN" ? "ADMIN" : "MEMBER") as ChatRole
                    }
                });
                return toChatMemberDTO(result);
            } else {
                const result = await db.chatMember.delete({
                    where: { chatId_userId: { chatId, userId } }
                });
                return toChatMemberDTO(result);
            }
        } catch (error) {
            logger.error("Failed to add chat member", error, "ChatService:addChatMember");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to add chat member");
        }
    }

    async toggleChatMemberRole(data: UpdateChatMemberInput, currentUserId: string) {
        const { chatId, userId } = data;
        try {
            const chat = await db.chat.findUnique({
                where: { id: chatId },
                include: { members: true }
            });
            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");
            if (chat.type === "DIRECT") throw new ApiError(status.BAD_REQUEST, "Direct chat cannot be updated");
            if (chat.members.find((member) => member.userId === currentUserId)?.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Only admin can change the role of a member", "UNAUTHORIZED");

            const targetMember = chat.members.find((member) => member.userId === userId);
            const newRole: ChatRole = targetMember?.role === "ADMIN" ? "MEMBER" : "ADMIN";

            const result = await db.chatMember.update({
                where: { chatId_userId: { chatId, userId } },
                data: { role: newRole }
            });
            return toChatMemberDTO(result);
        } catch (error) {
            logger.error("Failed to toggle chat member role", error, "ChatService:toggleChatMemberRole");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to toggle chat member role");
        }
    }

    async getChatMember(chatId: string, userId: string) {
        try {
            const chatMember = await db.chatMember.findUnique({
                where: { chatId_userId: { chatId, userId } }
            });
            if (!chatMember) throw new ApiError(status.NOT_FOUND, "Chat member not found");
            return toChatMemberDTO(chatMember);
        } catch (error) {
            logger.error("Failed to get chat member", error, "ChatService:getChatMember");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to get chat member");
        }
    }
}

const chatService = new ChatService();
export default chatService;
