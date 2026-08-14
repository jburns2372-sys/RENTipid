import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AiHealthService } from '../ai-health';
import { aiEnv } from '../ai-env';
import { MockProviderAdapter } from '../adapters/MockProviderAdapter';
import { DigitalHumanProviderAdapter } from '../adapters/DigitalHumanProviderAdapter';

function isPrismaCode(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export class AiSessionBroker {
  private static instance = new AiSessionBroker();
  private readonly MAX_CONCURRENT = 3;
  private readonly DAILY_LIMIT = 50;
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000;
  private readonly ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;

  constructor(private readonly db: PrismaClient = prisma) {}

  static getInstance() {
    return this.instance;
  }

  async createSession(request: { userId: string; channel: string; nonce: string }) {
    const { userId, channel, nonce } = request;
    if (!nonce.trim()) throw new Error('Nonce is required');

    const user = await this.db.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
    if (!user) throw new Error('Unauthorized: User not found');
    if (user.status === 'Suspended' || user.status === 'Blacklisted') {
      throw new Error(`Unauthorized: Account is ${user.status}`);
    }
    if (aiEnv.AI_FALLBACK_MODE_ENABLED && channel === 'digital_human') {
      throw new Error('Digital Human is currently disabled due to fallback mode');
    }

    const health = await AiHealthService.getInstance().checkProviderHealth();
    if (health === 'down' && channel === 'digital_human') {
      throw new Error('Provider is down. Please use text support.');
    }

    const session = await this.createDurableSession(userId, channel, nonce);
    let providerSessionId: string | null = null;
    let fallbackToText = false;

    if (channel === 'digital_human') {
      const adapter = aiEnv.AI_PROVIDER_MOCK_ENABLED ? new MockProviderAdapter() : new DigitalHumanProviderAdapter();
      try {
        const result = await adapter.initializeSession({
          userId,
          conversationId: session.conversationId ?? 'pending',
          channel,
          locale: session.locale,
        });
        providerSessionId = result.providerSessionId;
        await this.db.aiServiceSession.update({ where: { id: session.id }, data: { providerSessionId } });
      } catch {
        fallbackToText = true;
      }
    }

    return {
      sessionId: session.id,
      providerSessionId: fallbackToText ? null : providerSessionId,
      fallbackToText,
      brokerToken: `broker_${session.id}_${Date.now()}`,
    };
  }

  async validateSession(sessionId: string, userId: string) {
    const actor = await this.db.user.findUnique({ where: { id: userId }, select: { status: true } });
    if (!actor || actor.status === 'Suspended' || actor.status === 'Blacklisted') {
      throw new Error('Invalid or unauthorized session');
    }

    const session = await this.db.aiServiceSession.findFirst({
      where: { id: sessionId, userId, status: 'active' },
    });
    if (!session) throw new Error('Invalid or unauthorized session');

    const now = new Date();
    if (
      now.getTime() - session.lastActiveAt.getTime() > this.IDLE_TIMEOUT_MS ||
      now.getTime() - session.startedAt.getTime() > this.ABSOLUTE_TIMEOUT_MS
    ) {
      await this.endSession(sessionId, userId);
      throw new Error('Session expired');
    }

    const updated = await this.db.aiServiceSession.updateMany({
      where: { id: sessionId, userId, status: 'active' },
      data: { lastActiveAt: now },
    });
    if (updated.count !== 1) throw new Error('Invalid or unauthorized session');
    return true;
  }

  async endSession(sessionId: string, userId: string) {
    const session = await this.db.aiServiceSession.findFirst({ where: { id: sessionId, userId } });
    if (session?.providerSessionId) {
      const adapter = aiEnv.AI_PROVIDER_MOCK_ENABLED ? new MockProviderAdapter() : new DigitalHumanProviderAdapter();
      try {
        await adapter.closeSession(session.providerSessionId);
      } catch {
        // The durable session still ends if an external provider close is unavailable.
      }
    }

    await this.db.aiServiceSession.updateMany({
      where: { id: sessionId, userId, status: 'active' },
      data: { status: 'ended', endedAt: new Date() },
    });
  }

  private async createDurableSession(userId: string, channel: string, nonce: string) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.db.$transaction(async tx => {
          const now = new Date();
          const idleCutoff = new Date(now.getTime() - this.IDLE_TIMEOUT_MS);
          const absoluteCutoff = new Date(now.getTime() - this.ABSOLUTE_TIMEOUT_MS);
          await tx.aiServiceSession.updateMany({
            where: {
              userId,
              status: 'active',
              OR: [{ lastActiveAt: { lt: idleCutoff } }, { startedAt: { lt: absoluteCutoff } }],
            },
            data: { status: 'ended', endedAt: now },
          });

          const startOfUtcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
          const [dailyCount, activeCount] = await Promise.all([
            tx.aiServiceSession.count({ where: { userId, startedAt: { gte: startOfUtcDay } } }),
            tx.aiServiceSession.count({ where: { userId, status: 'active' } }),
          ]);
          if (dailyCount >= this.DAILY_LIMIT) throw new Error('Daily usage limit exceeded');
          if (activeCount >= this.MAX_CONCURRENT) throw new Error('Concurrent session limit exceeded');

          return tx.aiServiceSession.create({
            data: { userId, channel, nonce, status: 'active', locale: 'en', lastActiveAt: now },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (isPrismaCode(error, 'P2002')) throw new Error('Replay attempt denied: Nonce already used');
        if (isPrismaCode(error, 'P2034') && attempt < 2) continue;
        throw error;
      }
    }
    throw new Error('Unable to create session safely');
  }

  // Kept only for compatibility with older local tests. Correctness no longer
  // depends on process-local state, so there is nothing to clear.
  _clearState() {}
}
