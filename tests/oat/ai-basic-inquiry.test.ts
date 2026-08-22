import { describe, expect, test, beforeAll } from 'vitest';
import { processAICommand } from '../../src/lib/ai/ai-command-layer';

describe('AI Basic Inquiry Acceptance (Guest)', () => {
  const dummyContext = {
    botId: 'Concierge' as any,
    module: 'Help',
    channel: 'text' as const,
    clientContext: {},
  };

  test('Q1: How do I become a provider?', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: 'How do I become a provider?',
    });
    expect(result.message).toContain('Become a RENTipid Provider like this:');
    // Ensure it references core.registration-onboarding
  });

  test('Q2: How do I register?', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: 'How do I register?',
    });
    expect(result.message).toContain('Create a RENTipid account like this:');
    // It should not just assume provider, but explain renter registration too.
    expect(result.message).toContain('Register as Renter');
  });

  test('Q3: How do I add a new listing?', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: 'How do I add a new listing?',
    });
    // This should fetch listing workflow
    expect(result.message).toContain('Create a rental listing like this:');
  });
});
