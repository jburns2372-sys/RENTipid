import { prisma } from '@/lib/prisma';
import { getHealthResponse } from '@/lib/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  return getHealthResponse(prisma);
}

