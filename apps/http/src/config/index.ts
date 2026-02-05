import dotenv from "dotenv";
import path from "path";
import z from "zod";
import { SignOptions } from "jsonwebtoken";
dotenv.config({
    path: path.join(process.cwd(), ".env"),
    quiet: true,
});


const envSchema = z.object({
    PORT: z.string().default("3000"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
    NODE_ENV: z.string().default("development"),
    JWT_ACCESS_TOKEN_SECRET: z.string().default("secret"),
    JWT_ACCESS_TOKEN_EXPIRY: z.string().default("20M").transform((val) => val as SignOptions['expiresIn']),
    JWT_REFRESH_TOKEN_SECRET: z.string().default("secret"),
    JWT_REFRESH_TOKEN_EXPIRY: z.string().default("7D").transform((val) => val as SignOptions['expiresIn']),
    AWS_REGION: z.string().default("ap-south-1"),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    S3_BUCKET_NAME: z.string(),
    REDIS_URL: z.string(),
    RAZORPAY_KEY_ID: z.string(),
    RAZORPAY_KEY_SECRET: z.string(),
    RAZORPAY_WEBHOOK_SECRET: z.string()
})

let envVars: z.infer<typeof envSchema>;
try {
    envVars = envSchema.parse(process.env);
    console.info("[ENV] Environment variables loaded.");
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error(
            "[ENV] Environment variable validation error:",
            error.issues.map((issue) => issue.message).join(", ")
        );
    } else {
        console.error(
            "[ENV] Unexpected error during environment variable validation:",
            error
        );
    }
    process.exit(1);
}

export default envVars;
