import { PrismaClient } from '@prisma/client';
import { diffKnowledge } from '../../src/lib/ai/knowledge/synchronizer';
import { adaptStructuredProvider } from '../../src/lib/ai/knowledge/adapters/structured-provider-adapter';

const prisma = new PrismaClient();

describe('Targeted Empty Structured Provider Test', () => {
  beforeAll(async () => {
    // Ensure zero active prohibited policies
    await prisma.prohibitedItemPolicy.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. zero active prohibited policies does not crash knowledge sync', async () => {
    // If it crashes, this will throw
    const { items, prepared } = await diffKnowledge(prisma);
    
    // 2. no synthetic chunk is created
    const providerItem = prepared.find(p => p.entry.sourceKey === 'provider.prohibited-items');
    expect(providerItem).toBeDefined();
    // It should have 0 chunks
    expect(providerItem?.chunks.length).toBe(0);
    // It should be marked as omitted in metadata
    expect(providerItem?.adapted.metadata?.omitted).toBe(true);

    // 3. other canonical knowledge sources continue syncing
    const onboardingItem = prepared.find(p => p.entry.sourceKey === 'core.registration-onboarding');
    expect(onboardingItem).toBeDefined();
    expect(onboardingItem!.chunks.length).toBeGreaterThan(0);
  });

  it('4. actual provider errors other than legitimate EMPTY remain visible/failing as appropriate', async () => {
    // Manually call the adapter with an unregistered provider to force a generic error
    await expect(
      adaptStructuredProvider({ adapter: 'structured:invalid-provider-that-does-not-exist' } as any, prisma)
    ).rejects.toThrow('STRUCTURED_PROVIDER_NOT_REGISTERED:structured:invalid-provider-that-does-not-exist');
  });
});
