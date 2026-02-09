import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';
export * from '../generated/prisma';
import { config } from "@repo/env-config";


const connectionString = `${config.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Simplified client without withAccelerate to avoid DNS issues in local dev
const prisma = new PrismaClient({ adapter });

export default prisma;