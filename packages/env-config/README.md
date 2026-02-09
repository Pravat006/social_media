# @repo/env-config

Centralized environment configuration package for the social-media monorepo.

## Features

- ✅ **Type-safe** environment variables with Zod validation
- ✅ **Centralized** configuration management
- ✅ **Modular** schemas for different services (JWT, Redis, Kafka, etc.)
- ✅ **Auto-validation** on import with clear error messages
- ✅ **Default values** for development

## Installation

This package is already part of the monorepo workspace. Add it to your app's dependencies:

```json
{
  "dependencies": {
    "@repo/env-config": "workspace:*"
  }
}
```

## Usage

### Basic Usage

```typescript
import { config } from "@repo/env-config";

// Access environment variables with full type safety
console.log(config.PORT); // number
console.log(config.JWT_ACCESS_TOKEN_SECRET); // string
console.log(config.REDIS_HOST); // string
```

### Custom Initialization

```typescript
import { initEnv } from "@repo/env-config";

// Load from a custom .env file
const config = initEnv("/path/to/custom/.env");
```

### Using Specific Schemas

If you only need a subset of environment variables:

```typescript
import { redisEnvSchema } from "@repo/env-config";

const redisConfig = redisEnvSchema.parse(process.env);
```

## Environment Variables

See `.env.example` for all available environment variables and their default values.

### Required Variables

- `JWT_ACCESS_TOKEN_SECRET`
- `JWT_REFRESH_TOKEN_SECRET`
- `DATABASE_URL`

### Optional Variables (with defaults)

All other variables have sensible defaults for development.

## Validation

The package automatically validates environment variables on import. If validation fails:

1. Clear error messages are logged to the console
2. The process exits with code 1
3. Missing required variables are highlighted

## Type Safety

All environment variables are fully typed:

```typescript
import type { EnvConfig, RedisEnvConfig } from "@repo/env-config";

function useConfig(config: EnvConfig) {
  // config.PORT is typed as number
  // config.REDIS_HOST is typed as string
}
```

## Migration Guide

### From @repo/shared

Replace:

```typescript
import { config } from "@repo/shared";
```

With:

```typescript
import { config } from "@repo/env-config";
```

The API remains the same, but you get better type safety and validation.
