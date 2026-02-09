import { z } from "zod";
import { MediaTypeEnum } from "../constants";

// Media upload schema
export const uploadMediaSchema = z.object({
    type: MediaTypeEnum,
    mimeType: z.string(),
    size: z.number().positive(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    duration: z.number().positive().optional(),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
