import { processAICommand } from '@/lib/ai/ai-command-layer';

describe('LOGIN / ACCOUNT SUPPORT INQUIRY AI QUALITY GATE', () => {
  const dummyContext = {
    botId: 'Concierge' as any,
    module: 'Help',
    channel: 'text' as const,
    clientContext: {},
  };

  test('Q1_LOGIN_INTENT and Q1_RESPONSE_QUALITY', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: "How do I log in?",
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('To log in, go to the /login page');
    expect(result.message).not.toContain('I don\'t have enough approved RENTipid information');
  });

  test('Q2_FORGOT_PASSWORD_INTENT and Q2_RESPONSE_QUALITY', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: "I forgot my password. What should I do?",
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('If you forgot your password');
    expect(result.message).toContain('/forgot-password');
    expect(result.message).not.toContain('I don\'t have enough approved RENTipid information');
  });

  test('Q3_RESET_PASSWORD_INTENT and Q3_RESPONSE_QUALITY', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: "How do I reset my password?",
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('single-use link');
    expect(result.message).not.toContain('I don\'t have enough approved RENTipid information');
  });

  test('Q4_LOGIN_TROUBLESHOOTING_INTENT and Q4_RESPONSE_QUALITY', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: "Why can't I log in?",
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('If you forgot your password');
    expect(result.message).not.toContain('I don\'t have enough approved RENTipid information');
  });

  test('Q5_ACCOUNT_VERIFICATION_INTENT and Q5_RESPONSE_QUALITY', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: "How do I verify my account?",
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('official verification workflows');
    expect(result.message).toContain('Know Your Customer (KYC)');
    expect(result.message).not.toContain('I don\'t have enough approved RENTipid information');
  });

  test('Q6_ACCOUNT_INFORMATION_INTENT and Q6_RESPONSE_QUALITY', async () => {
    const result = await processAICommand({
      ...dummyContext,
      prompt: "How do I change my account information?",
    });
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('Open your Profile and select');
    expect(result.message).toContain('Edit Profile');
    expect(result.message).not.toContain('I don\'t have enough approved RENTipid information');
  });
});
