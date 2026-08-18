import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export type HealthDatabase = Pick<PrismaClient, '$queryRaw'>;

const responseHeaders = {
  'Cache-Control': 'no-store',
};

export async function getHealthResponse(database: HealthDatabase): Promise<Response> {
  try {
    await database.$queryRaw`SELECT 1`;
    return Response.json(
      { status: 'ready', database: 'connected' },
      { status: 200, headers: responseHeaders },
    );
  } catch {
    console.error('Application database readiness check failed.');
    return Response.json(
      { status: 'not_ready', database: 'unavailable' },
      { status: 503, headers: responseHeaders },
    );
  }
}

export async function GET() {
  return getHealthResponse(prisma);
}
