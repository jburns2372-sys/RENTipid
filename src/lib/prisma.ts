import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import { WebSocket } from 'ws';

neonConfig.webSocketConstructor = WebSocket;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL || '';
const isLocalTest = connectionString.includes('127.0.0.1') || connectionString.includes('localhost');

const adapter = isLocalTest ? null : new PrismaNeon({
  connectionString: connectionString
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adapter ? ({ adapter, log: [] } as any) : { log: [] }
  );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
