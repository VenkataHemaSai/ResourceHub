import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../config.js';

const connectionString = config.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Use a singleton pattern to prevent multiple instances in dev
const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (config.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
