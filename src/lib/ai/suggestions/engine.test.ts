import { SupportSuggestionEngine } from './engine';

describe('SupportSuggestionEngine', () => {
  it('A-P2-03: returns deterministically ordered suggestions', () => {
    const result1 = SupportSuggestionEngine.getSuggestions({ userRole: 'Renter' });
    const result2 = SupportSuggestionEngine.getSuggestions({ userRole: 'Renter' });
    expect(result1.questions.map(q => q.id)).toEqual(result2.questions.map(q => q.id));
    expect(result1.topics.map(t => t.id)).toEqual(result2.topics.map(t => t.id));
  });

  it('A-P2-02: filters out disabled and unauthorized suggestions', () => {
    const guestResult = SupportSuggestionEngine.getSuggestions({ userRole: 'Guest' });
    const providerResult = SupportSuggestionEngine.getSuggestions({ userRole: 'Provider' });
    const renterResult = SupportSuggestionEngine.getSuggestions({ userRole: 'Renter' });
    
    // Deposit topic is Renter/Provider only
    expect(providerResult.topics.some(t => t.id === 't-deposit')).toBe(true);
    expect(guestResult.topics.some(t => t.id === 't-deposit')).toBe(false);

    // Renter specific question in top 4
    expect(renterResult.questions.some(q => q.id === 'q-booking-cancel')).toBe(true);
    expect(providerResult.questions.some(q => q.id === 'q-booking-cancel')).toBe(false);
  });

  it('A-P2-04: returns only presentation-safe DTO fields', () => {
    const result = SupportSuggestionEngine.getSuggestions({ userRole: 'Renter' });
    const question = result.questions[0];
    expect(question).toHaveProperty('id');
    expect(question).toHaveProperty('text');
    expect(question).toHaveProperty('type');
    expect(question).not.toHaveProperty('priority');
    expect(question).not.toHaveProperty('roleScope');
  });

  it('A-P2-05: provides a safe fallback for unknown/unauthenticated users', () => {
    const result = SupportSuggestionEngine.getSuggestions({ userRole: 'Guest' });
    expect(result.questions.length).toBeGreaterThan(0);
    // Guest should at least see login help
    expect(result.questions.some(q => q.id === 'q-login-issue')).toBe(true);
  });
});
