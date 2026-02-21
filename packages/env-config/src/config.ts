import dotenv from "dotenv";
import path from "path";
import { z } from "zod";
import { envSchema, type EnvConfig } from "./schemas";

/**
 * Load environment variables from .env file
 */
export function loadEnv(envPath?: string): void {
    if (typeof window !== "undefined") return;

    // Priority 1: Provided path
    if (envPath) {
        dotenv.config({ path: envPath, override: false });
        return;
    }

    // Priority 2: Current working directory
    const cwPath = path.join(process.cwd(), ".env");
    const cwdResult = dotenv.config({ path: cwPath, override: false });

    if (!cwdResult.error) {
        return;
    }

    // Priority 3: Shared .env in package root
    const packagePath = path.resolve(__dirname, "..", ".env");
    dotenv.config({ path: packagePath, override: false });
}

/**
 * Validate environment variables.
 * Returns parsed config or throws and exits in Node.
 */
export function validateEnv(): EnvConfig {
    try {
        const parsed = envSchema.parse(process.env);
        return parsed;
    } catch (error) {
        if (typeof window === "undefined") {
            if (error instanceof z.ZodError) {
                console.error("❌ [ENV-CONFIG] Validation failed:");
                error.issues.forEach((issue) => {
                    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
                });
            }
            process.exit(1);
        }
        return process.env as unknown as EnvConfig;
    }
}

/**
 * Helper to initialize and validate
 */
export function initEnv(envPath?: string): EnvConfig {
    loadEnv(envPath);
    return validateEnv();
}

/**
 * The shared config object.
 * In Node, it auto-loads and validates if possible.
 * In Browser, it relies on Next.js/Vite environment variable substitution.
 */
export const config: EnvConfig = (function () {
    const isBrowser = typeof window !== "undefined";

    if (!isBrowser) {
        loadEnv();
        // We only perform strict validation if explicitly asked or in production
        // In local dev/build, we might have partial envs.
        if (process.env.NODE_ENV === "production") {
            try {
                return envSchema.parse(process.env);
            } catch (e) {
                // For production, we want to know if it's broken
                console.error("❌ [ENV-CONFIG] Production environment validation failed");
                return process.env as unknown as EnvConfig;
            }
        }
    }

    // For browser and non-production Node, we return proxy-safe process.env
    // We explicitly reference NEXT_PUBLIC vars so bundlers like Next.js can find and replace them.
    return {
        ...process.env,
        // Explicit references for bundler substitution
        NEXT_PUBLIC_SERVER_URI: process.env.NEXT_PUBLIC_SERVER_URI,
        NEXT_PUBLIC_WS_URI: process.env.NEXT_PUBLIC_WS_URI,
    } as unknown as EnvConfig;
})();

export default config;
