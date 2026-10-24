import { classifyRentipidQuestion } from './question-classifier';

describe('RENTipid question classifier', () => {
  test.each([
    'How does booking work?',
    'How do refunds work?',
    'How does KYC work?',
    'How do I list an item?',
    'Where can I change notification preferences?',
  ])('classifies durable product guidance as static: %s', question => {
    expect(classifyRentipidQuestion(question).kind).toBe('STATIC_RENTIPID_KNOWLEDGE');
  });

  test.each([
    'What is my booking status?',
    'Has my refund been paid?',
    'Is my KYC approved?',
    'Where is my payout?',
    'What is the current state of transaction TX-123?',
  ])('classifies personalized state as live: %s', question => {
    expect(classifyRentipidQuestion(question).kind).toBe('LIVE_RENTIPID_STATE');
  });

  test('keeps an external question outside RENTipid factual authority', () => {
    expect(classifyRentipidQuestion('How do I bake sourdough bread?').kind)
      .toBe('OUT_OF_SCOPE_OR_UNSUPPORTED');
  });

  test('asks for clarification when a standalone question is ambiguous', () => {
    expect(classifyRentipidQuestion('What about that?').kind).toBe('AMBIGUOUS');
  });

  test.each([
    'What documents do I need?',
    'How long does it take?',
  ])('uses bounded prior user context for a follow-up: %s', followUp => {
    const result = classifyRentipidQuestion(followUp, [
      { role: 'user', content: 'How do I become a provider?' },
      { role: 'assistant', content: 'Use the approved provider onboarding process.' },
    ]);
    expect(result.kind).toBe('STATIC_RENTIPID_KNOWLEDGE');
    expect(result.usedConversationContext).toBe(true);
    expect(result.effectiveQuestion).toContain('How do I become a provider?');
  });
});
