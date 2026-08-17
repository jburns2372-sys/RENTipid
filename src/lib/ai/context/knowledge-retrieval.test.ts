import { retrieveApprovedKnowledgeMatches } from './knowledge-retrieval';

describe('General Knowledge Retrieval Quality', () => {
  it('should correctly retrieve onboarding/registration knowledge', async () => {
    const queries = [
      'How to register?',
      'How do I join RENTipid?',
      'How can I create an account?',
      'What do I need to do to sign up?'
    ];
    for (const query of queries) {
      const matches = await retrieveApprovedKnowledgeMatches(query, undefined);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].sourceKey).toBe('core.registration-onboarding');
    }
  });

  it('should retrieve legal knowledge for legal queries', async () => {
    const queries = [
      'What laws govern RENTipid?',
      'What is RENTipid compliance position?'
    ];
    for (const query of queries) {
      const matches = await retrieveApprovedKnowledgeMatches(query, undefined);
      expect(matches.length).toBeGreaterThan(0);
      const validLegalKeys = ['compliance.global-legal-register', 'route.terms', 'route.privacy'];
      expect(validLegalKeys).toContain(matches[0].sourceKey);
    }
  });

  it('should not retrieve legal knowledge for non-legal queries', async () => {
    const queries = [
      'How to register?',
      'How do I create a listing?',
      'How do I pay?'
    ];
    for (const query of queries) {
      const matches = await retrieveApprovedKnowledgeMatches(query, undefined);
      if (matches.length > 0) {
        expect(matches[0].sourceKey).not.toBe('compliance.global-legal-register');
      }
    }
  });
});
