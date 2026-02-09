import { z } from "zod";

// Post schemas
export const createPostSchema = z.object({
    caption: z.string().max(2200).optional(),
    mediaIds: z.array(z.string()).min(1, "At least one media file is required").max(10, "Maximum 10 media files allowed"),
});

export const updatePostSchema = z.object({
    caption: z.string().max(2200).optional(),
});

export const createCommentSchema = z.object({
    postId: z.string(),
    content: z.string().min(1, "Comment cannot be empty").max(500),
    parentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty").max(500),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
