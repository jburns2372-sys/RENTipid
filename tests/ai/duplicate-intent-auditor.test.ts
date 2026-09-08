import { seedCanonicalIntents } from '../../src/lib/ai/context/canonical-intent-registry';
import { runDuplicateIntentAudit } from '../../src/lib/ai/knowledge/duplicate-intent-auditor';

describe('Duplicate Intent Auditor', () => {
  beforeAll(async () => {
    await seedCanonicalIntents();
  });

  test('enforces zero-duplication metrics across all intents and aliases', async () => {
    const audit = await runDuplicateIntentAudit();

    expect(audit.CANONICAL_INTENT_DUPLICATES).toBe(0);
    expect(audit.CANONICAL_QUESTION_DUPLICATES).toBe(0);
    expect(audit.NORMALIZED_QUESTION_DUPLICATES).toBe(0);
    expect(audit.ALIAS_DUPLICATES).toBe(0);
    expect(audit.CANONICAL_ALIAS_COLLISIONS).toBe(0);
    expect(audit.UNJUSTIFIED_ROLE_DUPLICATES).toBe(0);
    expect(audit.UNJUSTIFIED_AUTHORITY_DUPLICATES).toBe(0);
    expect(audit.UNJUSTIFIED_ANSWER_COPIES).toBe(0);
    expect(audit.OUT_OF_SCOPE_QUESTIONS).toBe(0);
    expect(audit.passed).toBe(true);
    expect(audit.issues).toEqual([]);
  });
});
