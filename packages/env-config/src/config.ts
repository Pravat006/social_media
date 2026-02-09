import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
import { envSchema, type EnvConfig } from "./schemas";

/**
 * Load environment variables from .env file
 */
export function loadEnv(envPath?: string): void {
    // Priority 1: Provided path
    if (envPath) {
        dotenv.config({ path: envPath, override: false });
        return;
    }

    // Priority 2: Current working directory (usually app root)
    const cwPath = path.join(process.cwd(), ".env");
    const cwdResult = dotenv.config({ path: cwPath, override: false });

    if (!cwdResult.error) {
        console.log(`[ENV-CONFIG] Loaded .env from: ${cwPath}`);
        return;
    }

    // Priority 3: Fallback to this package's root (where the shared .env is)
    // We assume this file is in dist/ or src/ so we go up one level
    const packagePath = path.resolve(__dirname, "..", ".env");
    const packageResult = dotenv.config({ path: packagePath, override: false });

    if (!packageResult.error) {
        console.log(`[ENV-CONFIG] Loaded .env from: ${packagePath}`);
    } else {
        console.warn(`[ENV-CONFIG] Failed to load .env from ${cwPath} or ${packagePath}`);
    }
}

/**
 * Validate and parse environment variables
 */
export function validateEnv(): EnvConfig {
    try {
        const parsed = envSchema.parse(process.env);
        console.info("✅ [ENV-CONFIG] Environment variables validated successfully");
        return parsed;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("❌ [ENV-CONFIG] Environment variable validation failed:");
            error.issues.forEach((issue) => {
                console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
            });
        } else {
            console.error("❌ [ENV-CONFIG] Unexpected error during validation:", error);
        }
        process.exit(1);
    }
}

/**
 * Initialize and return validated environment configuration
 */
export function initEnv(envPath?: string): EnvConfig {
    loadEnv(envPath);
    return validateEnv();
}

// Auto-initialize config on import
let config: EnvConfig;

try {
    loadEnv();
    config = validateEnv();
} catch (error) {
    // If validation fails, the process will exit in validateEnv
    throw error;
}

export { config };
export default config;
