import api from "../axios";
import {
    ChatDTO,
    ChatMemberDTO,
    CreateChatInput,
    DeleteChatInput,
    UpdateChatInput,
    UpdateChatMemberInput
} from "@repo/shared";
import { ApiSuccessResponse } from "./user.service";

export class ChatService {
    /**
     * Get all chats for the current user
     */
    static async getUserChats(): Promise<ChatDTO[]> {
        const response = await api.get<ApiSuccessResponse<ChatDTO[]>>("/chat");
        return response.data.data;
    }

    /**
     * Initialize a chat (Direct or Group)
     */
    static async initChat(data: CreateChatInput): Promise<ChatDTO> {
        const response = await api.post<ApiSuccessResponse<ChatDTO>>("/chat", data);
        return response.data.data;
    }

    /**
     * Delete a chat or leave group
     */
    static async deleteChat(data: DeleteChatInput): Promise<ChatDTO | ChatMemberDTO> {
        const response = await api.delete<ApiSuccessResponse<ChatDTO | ChatMemberDTO>>(`/chat/${data.chatId}`);
        return response.data.data;
    }

    /**
     * Update chat details (Group only)
     */
    static async updateChat(data: UpdateChatInput): Promise<ChatDTO> {
        const response = await api.put<ApiSuccessResponse<ChatDTO>>(`/chat/${data.chatId}`, { name: data.name });
        return response.data.data;
    }

    /**
     * Add or remove a member from a group chat
     */
    static async updateChatMember(data: UpdateChatMemberInput): Promise<ChatMemberDTO> {
        const response = await api.post<ApiSuccessResponse<ChatMemberDTO>>(`/chat/${data.chatId}/members`, data);
        return response.data.data;
    }

    /**
     * Toggle a member's role in a group chat
     */
    static async toggleMemberRole(data: UpdateChatMemberInput): Promise<ChatMemberDTO> {
        const response = await api.post<ApiSuccessResponse<ChatMemberDTO>>(
            `/chat/${data.chatId}/members/${data.userId}/toggle-role`
        );
        return response.data.data;
    }

    /**
     * Get a specific chat member's details
     */
    static async getChatMember(chatId: string, userId: string): Promise<ChatMemberDTO> {
        const response = await api.get<ApiSuccessResponse<ChatMemberDTO>>(`/chat/${chatId}/members/${userId}`);
        return response.data.data;
    }
}
