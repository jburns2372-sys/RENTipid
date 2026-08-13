import { PrismaClient } from '@prisma/client';
import { AiHealthService } from '../ai-health';
import { aiEnv } from '../ai-env';
import { MockProviderAdapter } from '../adapters/MockProviderAdapter';
import { DigitalHumanProviderAdapter } from '../adapters/DigitalHumanProviderAdapter';

const prisma = new PrismaClient();

// In-memory state for limits, replays, and idle timeout
const usedNonces = new Set<string>();
const userDailyUsage = new Map<string, number>();
const activeSessionsByUser = new Map<string, Set<string>>();
const sessionLastActive = new Map<string, number>();

export class AiSessionBroker {
  private static instance = new AiSessionBroker();
  private readonly MAX_CONCURRENT = 3;
  private readonly DAILY_LIMIT = 50; // Max 50 sessions per day per user
  private readonly IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours

  static getInstance() {
    return this.instance;
  }

  async createSession(request: { userId: string, channel: string, nonce: string }) {
    const { userId, channel, nonce } = request;

    // 1. Replay Protection
    if (usedNonces.has(nonce)) {
      throw new Error('Replay attempt denied: Nonce already used');
    }
    usedNonces.add(nonce);

    // 2. Server Actor Binding & Suspension Check
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Unauthorized: User not found');
    }
    if (user.status === 'Suspended' || user.status === 'Blacklisted') {
      throw new Error(`Unauthorized: Account is ${user.status}`);
    }

    // 3. Feature Flag & Emergency Control
    if (aiEnv.AI_FALLBACK_MODE_ENABLED && channel === 'digital_human') {
      throw new Error('Digital Human is currently disabled due to fallback mode');
    }

    // 4. Provider Health
    const health = await AiHealthService.getInstance().checkProviderHealth();
    if (health === 'down' && channel === 'digital_human') {
      throw new Error('Provider is down. Please use text support.');
    }

    // 5. Daily Limit Enforcement
    const dailyCount = userDailyUsage.get(userId) || 0;
    if (dailyCount >= this.DAILY_LIMIT) {
      throw new Error('Daily usage limit exceeded');
    }

    // 6. Concurrent Session Enforcement
    const activeSessions = activeSessionsByUser.get(userId) || new Set<string>();
    if (activeSessions.size >= this.MAX_CONCURRENT) {
      throw new Error('Concurrent session limit exceeded');
    }

    // 7. Cleanup any idle/expired sessions before proceeding
    await this.cleanupIdleSessions(userId);

    // 8. Create DB Session (Minimum Persistence)
    const session = await prisma.aiServiceSession.create({
      data: {
        userId,
        channel,
        status: 'active',
        locale: 'en',
      }
    });

    // Initialize Provider if needed (e.g., Digital Human)
    let providerSessionId: string | null = null;
    let providerMetadata: any = null;
    let fallbackToText = false;

    if (channel === 'digital_human') {
      const adapter = aiEnv.AI_PROVIDER_MOCK_ENABLED 
        ? new MockProviderAdapter() 
        : new DigitalHumanProviderAdapter();
      
      try {
        const result = await adapter.initializeSession({
          userId,
          conversationId: 'pending', // Will be set later when conversation starts
          channel,
          locale: 'en'
        });
        providerSessionId = result.providerSessionId;
        providerMetadata = result.metadata;

        await prisma.aiServiceSession.update({
          where: { id: session.id },
          data: { providerSessionId }
        });
      } catch (err) {
        // Fallback to text
        fallbackToText = true;
      }
    }

    // Track state
    userDailyUsage.set(userId, dailyCount + 1);
    activeSessions.add(session.id);
    activeSessionsByUser.set(userId, activeSessions);
    sessionLastActive.set(session.id, Date.now());

    return {
      sessionId: session.id,
      providerSessionId: fallbackToText ? null : providerSessionId,
      fallbackToText,
      // We NEVER return real API keys to the client
      brokerToken: `broker_${session.id}_${Date.now()}` 
    };
  }

  async validateSession(sessionId: string, userId: string) {
    const lastActive = sessionLastActive.get(sessionId);
    if (!lastActive) {
      throw new Error('Session not found or expired');
    }

    const now = Date.now();
    // Expiry check
    if (now - lastActive > this.IDLE_TIMEOUT_MS) {
      await this.endSession(sessionId, userId);
      throw new Error('Session expired due to inactivity');
    }

    // Update activity
    sessionLastActive.set(sessionId, now);

    const session = await prisma.aiServiceSession.findUnique({
      where: { id: sessionId }
    });

    if (!session || session.userId !== userId || session.status !== 'active') {
      throw new Error('Invalid or unauthorized session');
    }

    return true;
  }

  async endSession(sessionId: string, userId: string) {
    // End provider session if any
    const session = await prisma.aiServiceSession.findUnique({ where: { id: sessionId } });
    if (session && session.providerSessionId) {
      const adapter = aiEnv.AI_PROVIDER_MOCK_ENABLED 
        ? new MockProviderAdapter() 
        : new DigitalHumanProviderAdapter();
      try {
        await adapter.closeSession(session.providerSessionId);
      } catch (e) {
        // Ignore provider close errors
      }
    }

    await prisma.aiServiceSession.updateMany({
      where: { id: sessionId, userId },
      data: { status: 'ended', endedAt: new Date() }
    });

    sessionLastActive.delete(sessionId);
    const activeSet = activeSessionsByUser.get(userId);
    if (activeSet) {
      activeSet.delete(sessionId);
    }
  }

  private async cleanupIdleSessions(userId: string) {
    const activeSet = activeSessionsByUser.get(userId);
    if (!activeSet) return;
    
    const now = Date.now();
    for (const sessionId of activeSet) {
      const lastActive = sessionLastActive.get(sessionId);
      if (lastActive && (now - lastActive > this.IDLE_TIMEOUT_MS)) {
        await this.endSession(sessionId, userId);
      }
    }
  }

  // Internal test helper
  _clearState() {
    usedNonces.clear();
    userDailyUsage.clear();
    activeSessionsByUser.clear();
    sessionLastActive.clear();
  }
}
