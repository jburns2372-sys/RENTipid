import { prisma } from '@/lib/prisma';

export class AiAuthorizationError extends Error {
  constructor(message: string, readonly code: 'UNAUTHENTICATED' | 'UNAUTHORIZED') {
    super(message);
    this.name = 'AiAuthorizationError';
  }
}

export async function resolveCurrentAiActor(userId: string) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!actor) {
    throw new AiAuthorizationError('Authenticated actor no longer exists', 'UNAUTHENTICATED');
  }

  if (actor.status === 'Suspended' || actor.status === 'Blacklisted') {
    throw new AiAuthorizationError(`Account is ${actor.status}`, 'UNAUTHORIZED');
  }

  return actor;
}
