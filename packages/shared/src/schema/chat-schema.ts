import { z } from "zod";
import { ChatTypeEnum, MessageTypeEnum } from "../constants";

// Chat schemas
export const createChatSchema = z.object({
    type: ChatTypeEnum,
    name: z.string().min(1).max(100).optional(),
    memberIds: z.array(z.string()).min(1, "At least one member is required"),
});

export const sendMessageSchema = z.object({
    chatId: z.string(),
    content: z.string().max(5000).optional(),
    type: MessageTypeEnum.default("USER"),
    mediaIds: z.array(z.string()).optional(),
});

export const addReactionSchema = z.object({
    messageId: z.string(),
    reaction: z.string().min(1).max(10),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
