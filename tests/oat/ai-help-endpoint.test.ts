import { POST } from '../../src/app/api/ai/chat/route';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { OAT_SHARED_USERS } from '../../src/lib/oat/oat-shared-users';
import { seedCanonicalIntents } from '../../src/lib/ai/context/canonical-intent-registry';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

const prisma = new PrismaClient();
const mockedGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
let ownerId: string;

describe('AI-OAT-HELP-ENDPOINT-001', () => {
  beforeAll(async () => {
    await seedCanonicalIntents();
    const renter = await prisma.user.upsert({
      where: { email: OAT_SHARED_USERS.RENTER.email },
      update: {
        role: OAT_SHARED_USERS.RENTER.role,
        status: 'Active'
      },
      create: {
        email: OAT_SHARED_USERS.RENTER.email,
        password_hash: 'oat-test-only',
        full_name: 'OAT Renter',
        account_type: 'Individual',
        role: OAT_SHARED_USERS.RENTER.role,
        status: 'Active'
      }
    });

    mockedGetServerSession.mockResolvedValue({
      user: {
        id: renter.id,
        role: OAT_SHARED_USERS.RESTRICTED.role
      }
    } as any);

    const owner = await prisma.user.upsert({
      where: { email: OAT_SHARED_USERS.OWNER.email },
      update: {
        role: OAT_SHARED_USERS.OWNER.role,
        status: 'Active',
      },
      create: {
        email: OAT_SHARED_USERS.OWNER.email,
        password_hash: 'oat-test-only',
        full_name: 'OAT Owner',
        account_type: 'Individual',
        role: OAT_SHARED_USERS.OWNER.role,
        status: 'Active',
      },
    });
    ownerId = owner.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reach the real Unified AI handler and not return the Azure migration stub', async () => {
    const mockRequest = new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'Concierge',
        prompt: 'How does RENTipid work?',
        module: 'Help'
      })
    });

    const response = await POST(mockRequest);
    const data = await response.json();
    
    // 2. Response is not "Endpoint migrated to Azure Backend"
    expect(data.error).not.toBe('Endpoint migrated to Azure Backend');
    expect(data.message).not.toBe('Endpoint migrated to Azure Backend');

    // 4. Response contains a meaningful customer-facing RENTipid explanation.
    // The mock/real handler should return a valid string message.
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
    
    // We expect a 200 OK status from the AI Command Layer
    expect(response.status).toBe(200);
  });

  it('keeps an ambiguous follow-up grounded in the owned conversation topic', async () => {
    const firstResponse = await POST(new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'Concierge',
        prompt: 'How do I become a provider?',
        module: 'Help',
      }),
    }));
    const first = await firstResponse.json();
    expect(firstResponse.status).toBe(200);
    expect(typeof first.conversationId).toBe('string');

    const followUpResponse = await POST(new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'Concierge',
        prompt: 'What documents do I need?',
        module: 'Help',
        conversationId: first.conversationId,
      }),
    }));
    const followUp = await followUpResponse.json();

    expect(followUpResponse.status).toBe(200);
    expect(followUp.conversationId).toBe(first.conversationId);
    expect(followUp.message).toMatch(/identity verification|business documentation|provider/i);
    expect(followUp.message).not.toMatch(/source key|chunk id|registry|mock ai/i);
  });

  it('returns a verified taxonomy answer for an authenticated Owner canonical question', async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: { id: ownerId, role: OAT_SHARED_USERS.OWNER.role },
    } as any);

    const response = await POST(new Request('http://localhost/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: 'Concierge',
        prompt: 'Can I list a condominium on RENTipid?',
        module: 'Help',
        channel: 'help',
      }),
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.isBlocked).toBe(false);
    expect(data.message).toMatch(/condominiums? is a supported rentipid rental category/i);
    expect(data.message).toMatch(/admin approval|permit documentation/i);
    expect(data.message).not.toMatch(/not sufficient to answer|could you be more specific/i);
  });
});
