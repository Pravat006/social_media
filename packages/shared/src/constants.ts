import z from "zod";

// Media types for social media
export const allowedImageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
] as const;

export const allowedVideoMimeTypes = [
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/x-msvideo", // .avi
] as const;

export const allowedAudioMimeTypes = [
    "audio/mpeg", // .mp3
    "audio/wav",
    "audio/ogg",
    "audio/aac",
] as const;

export const allowedMimeTypes = [
    ...allowedImageMimeTypes,
    ...allowedVideoMimeTypes,
    ...allowedAudioMimeTypes,
] as const;

// Enums matching Prisma schema
export const MediaTypeEnum = z.enum(["IMAGE", "VIDEO", "AUDIO"]);
export const ChatTypeEnum = z.enum(["DIRECT", "GROUP"]);
export const MessageTypeEnum = z.enum(["USER", "SYSTEM", "CALL"]);
export const CallTypeEnum = z.enum(["VIDEO", "AUDIO"]);
export const CallStatusEnum = z.enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELED", "ENDED", "MISSED"]);
export const StreamVisibilityEnum = z.enum(["PUBLIC", "PRIVATE", "FOLLOWERS_ONLY"]);

// Type exports
export type MediaType = z.infer<typeof MediaTypeEnum>;
export type ChatType = z.infer<typeof ChatTypeEnum>;
export type MessageType = z.infer<typeof MessageTypeEnum>;
export type CallType = z.infer<typeof CallTypeEnum>;
export type CallStatus = z.infer<typeof CallStatusEnum>;
export type StreamVisibility = z.infer<typeof StreamVisibilityEnum>;