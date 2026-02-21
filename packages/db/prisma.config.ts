import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'
import { config } from '@repo/env-config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        url: config.DATABASE_URL,
    },
    migrations: {
        seed: 'npx tsx prisma/seed.ts',
    },
})