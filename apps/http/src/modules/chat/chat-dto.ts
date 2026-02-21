import { ChatDTO, ChatMemberDTO, ChatMessageDTO } from "@repo/shared";
import { toUserDTO } from "../user/user-dto";

export const toChatDTO = (chat: any): ChatDTO => {
    return {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        directKey: chat.directKey,
        members: chat.members ? chat.members.map(toChatMemberDTO) : undefined,
        lastMessage: chat.messages && chat.messages.length > 0
            ? toChatMessageDTO(chat.messages[0])
            : undefined,
    };
};

export const toChatMessageDTO = (message: any): ChatMessageDTO => {
    return {
        id: message.id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        senderUsername: message.sender?.username || "Unknown",
        senderName: message.sender?.name,
        senderAvatar: message.sender?.profilePicture?.url,
    };
};

export const toChatMemberDTO = (member: any): ChatMemberDTO => {
    return {
        chatId: member.chatId,
        userId: member.userId,
        joinedAt: member.joinedAt.toISOString(),
        role: member.role,
        lastDeletedAt: member.lastDeletedAt?.toISOString(),
        user: member.user ? toUserDTO(member.user) : undefined
    };
};
