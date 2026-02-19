import { ApiError } from "@/interface";
import { CreateChatInput, DeleteChatInput, UpdateChatInput, UpdateChatMemberInput } from "./chat-validation";
import db from "@/services/db";
import status from "http-status";
import { logger } from "@repo/logger";


class ChatService {

    /**
     * create a chat between two users or multiple users
     * @param data 
     * @param creatorId 
     * @returns 
     */
    async initChat(data: CreateChatInput, creatorId: string) {
        try {

            const { memberIds, name, type } = data;
            //  if the type is direct then create a chat between two users
            // else if there is multiple user ids or member ids then it will be a group chat


            // check if there is already a deirect chat between the two users

            if (type === "DIRECT") {
                if (memberIds.length !== 2) {
                    throw new ApiError(status.BAD_REQUEST, "Direct chat can only be created between two users");
                }

                const sortedIds = [...memberIds].sort();
                const directKey = sortedIds.join("-");
                const existingChat = await db.chat.findUnique({
                    where: {
                        directKey: directKey
                    },
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        name: true,
                                        profilePicture: true,
                                    }
                                }
                            }
                        }
                    }
                })

                if (existingChat) return existingChat;

                return await db.chat.create({
                    data: {
                        type: "DIRECT",
                        directKey: directKey,
                        members: {
                            create: memberIds.map((memberId) => ({
                                userId: memberId,
                            })),
                        },
                    }
                })
            }

            return await db.chat.create({
                data: {
                    type: "GROUP",
                    name: name,
                    members: {
                        create: memberIds.map((memberId) => ({
                            userId: memberId,
                            role: memberId === creatorId ? "ADMIN" : "MEMBER"
                        })),
                    },
                }
            })
        } catch (error) {
            logger.error("Failed to create chat", error, "ChatService:initChat");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to create chat");
        }
    }

    async deleteChat(data: DeleteChatInput) {
        try {
            const { chatId, userId } = data;

            const chat = await db.chat.findUnique({
                where: { id: chatId },
                include: {
                    members: true
                }
            });

            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");

            const member = chat.members.find((m) => m.userId === userId);
            if (!member) throw new ApiError(status.FORBIDDEN, "You are not a member of this chat");

            if (chat.type === "DIRECT") {
                //  for direct chats , ! don't delete the chat
                // instead mark the time the user deleted it
                // to keep the messages visible for the other person
                return await db.chatMember.update({
                    where: {
                        chatId_userId: {
                            chatId: chatId,
                            userId: userId
                        }
                    },
                    data: {
                        lastDeletedAt: new Date(),
                    }
                });
            } else {
                // For group chats:
                // If the user is the admin, delete the entire chat
                // If not, just leave the group (delete member record)
                if (member.role === "ADMIN") {
                    return await db.chat.delete({
                        where: { id: chatId },
                    });
                } else {
                    return await db.chatMember.delete({
                        where: {
                            chatId_userId: {
                                chatId: chatId,
                                userId: userId
                            }
                        }
                    });
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
                where: {
                    id: chatId,
                },
                include: {
                    members: true
                }
            });
            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");
            if (chat.type === "DIRECT") throw new ApiError(status.BAD_REQUEST, "Direct chat cannot be updated");
            // check if the user is admin of the chat
            if (chat.members.find((member) => member.userId === userId)?.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "User is not admin of the chat");
            return await db.chat.update({
                where: {
                    id: chatId,
                },
                data: {
                    name: name,
                },
            });
        } catch (error) {
            logger.error("Failed to update chat", error, "ChatService:updateChat");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to update chat");
        }
    }

    async addOrRemoveChatMember(data: UpdateChatMemberInput, currentUserId: string) {
        const { chatId, userId, role, action } = data
        try {
            const chat = await db.chat.findUnique({
                where: {
                    id: chatId,
                },
                include: {
                    members: true
                }
            });
            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");
            if (chat.type === "DIRECT") throw new ApiError(status.BAD_REQUEST, "Direct chat cannot be updated");
            // check if the user is admin of the chat
            if (chat.members.find((member) => member.userId === currentUserId)?.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "User is not admin of the chat");
            if (action === "ADD") {
                return await db.chatMember.create({
                    data: {
                        chatId: chatId,
                        userId: userId,
                        role: role === "ADMIN" ? "ADMIN" : "MEMBER",
                    }
                });
            } else {
                return await db.chatMember.delete({
                    where: {
                        chatId_userId: {
                            chatId: chatId,
                            userId: userId
                        }
                    },
                });
            }
        } catch (error) {
            logger.error("Failed to add chat member", error, "ChatService:addChatMember");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to add chat member");
        }
    }

    async toggleChatMemberRole(data: UpdateChatMemberInput, currentUserId: string) {
        const { chatId, userId } = data
        try {
            const chat = await db.chat.findUnique({
                where: {
                    id: chatId,
                },
                include: {
                    members: true
                }
            });
            if (!chat) throw new ApiError(status.NOT_FOUND, "Chat not found");
            if (chat.type === "DIRECT") throw new ApiError(status.BAD_REQUEST, "Direct chat cannot be updated");
            // check if the user is admin of the chat
            if (chat.members.find((member) => member.userId === currentUserId)?.role !== "ADMIN") throw new ApiError(status.FORBIDDEN, "Only admin can change the role of a member", "UNAUTHORIZED");
            if (chat.members.find((member) => member.userId === userId)?.role === "ADMIN") {
                //  if the user is admin then demote him to member
                return await db.chatMember.update({
                    where: {
                        chatId_userId: {
                            chatId: chatId,
                            userId: userId
                        }
                    },
                    data: {
                        role: "MEMBER",
                    }
                });
            } else {
                //  if the user is member then promote him to admin
                return await db.chatMember.update({
                    where: {
                        chatId_userId: {
                            chatId: chatId,
                            userId: userId
                        }
                    },
                    data: {
                        role: "ADMIN",
                    }
                });
            }
        } catch (error) {
            logger.error("Failed to toggle chat member role", error, "ChatService:toggleChatMemberRole");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to toggle chat member role");
        }
    }

    async getChatMember(chatId: string, userId: string) {
        try {
            const chatMember = await db.chatMember.findUnique({
                where: {
                    chatId_userId: {
                        chatId: chatId,
                        userId: userId
                    }
                }
            });
            if (!chatMember) throw new ApiError(status.NOT_FOUND, "Chat member not found");
            return chatMember;
        } catch (error) {
            logger.error("Failed to get chat member", error, "ChatService:getChatMember");
            throw new ApiError(status.INTERNAL_SERVER_ERROR, "Failed to get chat member");
        }
    }
    /**
     * TODO: update chat icon
     */
}

const chatService = new ChatService();
export default chatService;
