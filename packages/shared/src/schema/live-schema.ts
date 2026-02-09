import { z } from "zod";
import { StreamVisibilityEnum } from "../constants";

// Live stream schemas
export const createLiveStreamSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    thumbnailId: z.string().optional(),
    category: z.string().max(50).optional(),
    tags: z.array(z.string().max(30)).max(10).default([]),
    visibility: StreamVisibilityEnum.default("PUBLIC"),
});

export const updateLiveStreamSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    thumbnailId: z.string().optional(),
    category: z.string().max(50).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    visibility: StreamVisibilityEnum.optional(),
});

export const sendLiveMessageSchema = z.object({
    streamId: z.string(),
    content: z.string().min(1).max(500),
});

export const sendLiveReactionSchema = z.object({
    streamId: z.string(),
    emoji: z.string().min(1).max(10),
});

export type CreateLiveStreamInput = z.infer<typeof createLiveStreamSchema>;
export type UpdateLiveStreamInput = z.infer<typeof updateLiveStreamSchema>;
export type SendLiveMessageInput = z.infer<typeof sendLiveMessageSchema>;
export type SendLiveReactionInput = z.infer<typeof sendLiveReactionSchema>;
