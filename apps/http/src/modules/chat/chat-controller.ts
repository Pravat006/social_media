import { asyncHandler } from "@/utils/async-handler";
import { ApiResponse } from "@/interface/api-response";
import chatService from "./chat-service";
import status from "http-status";
import {
    createChatSchema,
    deleteChatSchema,
    updateChatSchema,
    updateChatMemberSchema
} from "./chat-validation";

/**
 * Initialize a new chat (Direct or Group)
 */
export const initChat = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const validatedData = createChatSchema.parse(req.body);
    const result = await chatService.initChat(validatedData, userId);

    return res
        .status(status.CREATED)
        .json(new ApiResponse(status.CREATED, "Chat initialized successfully", result));
});

/**
 * Delete a chat
 */
export const deleteChat = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const { chatId } = req.params;
    const validatedData = deleteChatSchema.parse({ chatId, userId });
    const result = await chatService.deleteChat(validatedData);

    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, "Chat deleted/left successfully", result));
});

/**
 * Update chat details (e.g., name)
 */
export const updateChat = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const { chatId } = req.params;
    const validatedData = updateChatSchema.parse({ ...req.body, chatId, userId });
    const result = await chatService.updateChat(validatedData);

    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, "Chat updated successfully", result));
});

/**
 * Add or remove a member from a chat
 */
export const addOrRemoveMember = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
        throw new Error("User not authenticated");
    }

    const { chatId } = req.params;
    const validatedData = updateChatMemberSchema.parse({ ...req.body, chatId });
    const result = await chatService.addOrRemoveChatMember(validatedData, currentUserId);

    const message = validatedData.action === "ADD" ? "Member added successfully" : "Member removed successfully";

    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, message, result));
});

/**
 * Toggle between ADMIN and MEMBER roles
 */
export const toggleMemberRole = asyncHandler(async (req, res) => {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
        throw new Error("User not authenticated");
    }

    const { chatId, userId } = req.params;
    const validatedData = updateChatMemberSchema.parse({
        chatId,
        userId,
        role: "MEMBER",
        action: "ADD"
    });

    const result = await chatService.toggleChatMemberRole(validatedData, currentUserId);

    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, "Member role toggled successfully", result));
});

/**
 * Get details of a chat member
 */
export const getChatMember = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.params;
    const result = await chatService.getChatMember(chatId as string, userId as string);

    return res
        .status(status.OK)
        .json(new ApiResponse(status.OK, "Chat member retrieved successfully", result));
});
