import { z } from "zod";

// Story schema
export const createStorySchema = z.object({
    mediaIds: z.array(z.string()).min(1, "At least one media file is required").max(5, "Maximum 5 media files allowed"),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
