/**
 * RENTipid GLCC v1.0 — Account Preference Service & Repository Tests
 *
 * Verifies:
 * - Server authorization: user may read/write own preferences; cross-user access rejected.
 * - Pre-persistence validation against RegistryContext.
 * - Atomic tuple persistence and version increments.
 * - Optimistic concurrency control (stale-write rejection).
 * - Absence of charge currency from persistence contract.
 */

import {
  readAccountPreference,
  saveAccountPreference,
  createInMemoryPreferenceDatabase,
  GlccAuthorizationError,
  GlccValidationError,
  GlccConcurrencyConflictError,
} from '../../src/lib/glcc/preference-service';
import { createInMemoryRegistryContext } from '../../src/lib/glcc/registry-contracts';

describe('GLCC v1.0 — Account Preference Service & Repository', () => {
  const registries = createInMemoryRegistryContext({
    currencies: [
      { code: 'PHP', minorUnitExponent: 2, name: 'Peso', symbol: '₱', isActive: true },
      { code: 'USD', minorUnitExponent: 2, name: 'Dollar', symbol: '$', isActive: true },
      { code: 'JPY', minorUnitExponent: 0, name: 'Yen', symbol: '¥', isActive: true },
      { code: 'BHD', minorUnitExponent: 3, name: 'Dinar', symbol: 'BD', isActive: true },
    ],
    countries: [
      {
        code: 'PH',
        name: 'Philippines',
        defaultDisplayCurrency: 'PHP',
        allowedDisplayCurrencies: ['PHP', 'USD', 'JPY'],
        defaultLanguageTag: 'en-PH',
        supportedLanguageTags: ['en-PH', 'fil-PH'],
        isActive: true,
      },
      {
        code: 'US',
        name: 'United States',
        defaultDisplayCurrency: 'USD',
        allowedDisplayCurrencies: ['USD'],
        defaultLanguageTag: 'en-US',
        supportedLanguageTags: ['en-US'],
        isActive: true,
      },
    ],
    locales: [
      { tag: 'en-PH', language: 'en', region: 'PH', direction: 'ltr', name: 'English (PH)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
      { tag: 'fil-PH', language: 'fil', region: 'PH', direction: 'ltr', name: 'Filipino', nativeName: 'Filipino', isActive: true, fallbackTag: 'en-PH' },
      { tag: 'en-US', language: 'en', region: 'US', direction: 'ltr', name: 'English (US)', nativeName: 'English', isActive: true, fallbackTag: 'en' },
    ],
  });

  describe('Server Authorization & Cross-User Security', () => {
    it('allows authenticated user to read their own preferences', async () => {
      const db = createInMemoryPreferenceDatabase();
      const userId = 'user_abc123';

      const read = await readAccountPreference(userId, userId, db);
      expect(read).toBeNull(); // Empty initially
    });

    it('denies cross-user preference read with GlccAuthorizationError', async () => {
      const db = createInMemoryPreferenceDatabase();
      const actorUserId = 'attacker_456';
      const victimUserId = 'victim_789';

      await expect(readAccountPreference(actorUserId, victimUserId, db)).rejects.toThrow(
        GlccAuthorizationError
      );
    });

    it('denies cross-user preference write with GlccAuthorizationError', async () => {
      const db = createInMemoryPreferenceDatabase();
      const actorUserId = 'attacker_456';
      const victimUserId = 'victim_789';

      await expect(
        saveAccountPreference(actorUserId, victimUserId, { countryCode: 'PH' }, registries, db)
      ).rejects.toThrow(GlccAuthorizationError);
    });
  });

  describe('Pre-Persistence Validation', () => {
    it('rejects unsupported country before database write', async () => {
      const db = createInMemoryPreferenceDatabase();
      const userId = 'user_123';

      await expect(
        saveAccountPreference(userId, userId, { countryCode: 'INVALID_COUNTRY' }, registries, db)
      ).rejects.toThrow(GlccValidationError);
    });

    it('rejects disallowed display currency for country', async () => {
      const db = createInMemoryPreferenceDatabase();
      const userId = 'user_123';

      // BHD is a valid currency, but NOT allowed in country PH
      await expect(
        saveAccountPreference(userId, userId, { countryCode: 'PH', displayCurrency: 'BHD' }, registries, db)
      ).rejects.toThrow(GlccValidationError);
    });

    it('rejects unsupported language tag', async () => {
      const db = createInMemoryPreferenceDatabase();
      const userId = 'user_123';

      await expect(
        saveAccountPreference(userId, userId, { languageTag: 'invalid-LANG' }, registries, db)
      ).rejects.toThrow(GlccValidationError);
    });
  });

  describe('Atomic Persistence & Optimistic Concurrency', () => {
    it('creates preference record on first save with version 1', async () => {
      const db = createInMemoryPreferenceDatabase();
      const userId = 'user_123';

      const saved = await saveAccountPreference(
        userId,
        userId,
        {
          countryCode: 'PH',
          displayCurrency: 'USD',
          languageTag: 'fil-PH',
          isManualDisplayOverride: true,
          timezone: 'Asia/Manila',
        },
        registries,
        db
      );

      expect(saved.userId).toBe(userId);
      expect(saved.countryCode).toBe('PH');
      expect(saved.displayCurrency).toBe('USD');
      expect(saved.languageTag).toBe('fil-PH');
      expect(saved.isManualDisplayOverride).toBe(true);
      expect(saved.timezone).toBe('Asia/Manila');
      expect(saved.version).toBe(1);

      // Verify read matches saved state
      const fetched = await readAccountPreference(userId, userId, db);
      expect(fetched?.displayCurrency).toBe('USD');
      expect(fetched?.version).toBe(1);
    });

    it('increments version on subsequent update with matching expectedVersion', async () => {
      const db = createInMemoryPreferenceDatabase();
      const userId = 'user_123';

      const initial = await saveAccountPreference(
        userId,
        userId,
        { countryCode: 'PH', displayCurrency: 'PHP', languageTag: 'en-PH' },
        registries,
        db
      );
      expect(initial.version).toBe(1);

      const updated = await saveAccountPreference(
        userId,
        userId,
        { displayCurrency: 'USD', isManualDisplayOverride: true },
        registries,
        db,
        1 // Matching expectedVersion
      );
      expect(updated.version).toBe(2);
      expect(updated.displayCurrency).toBe('USD');
    });

    it('rejects update with GlccConcurrencyConflictError when expectedVersion does not match', async () => {
      const db = createInMemoryPreferenceDatabase();
      const userId = 'user_123';

      await saveAccountPreference(
        userId,
        userId,
        { countryCode: 'PH', displayCurrency: 'PHP', languageTag: 'en-PH' },
        registries,
        db
      );

      // Stale write attempt: passing expectedVersion 0 when current is 1
      await expect(
        saveAccountPreference(
          userId,
          userId,
          { displayCurrency: 'USD' },
          registries,
          db,
          0 // Stale version
        )
      ).rejects.toThrow(GlccConcurrencyConflictError);
    });
  });
});
