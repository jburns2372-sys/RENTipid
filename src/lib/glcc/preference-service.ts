/**
 * RENTipid GLCC v1.0 — Account Preference Service & Repository
 *
 * Implements:
 * 1. Authenticated account preference read and save operations.
 * 2. Strict server-side authorization: Actor resolved from session; cross-user access denied.
 * 3. Pre-persistence validation against RegistryContext.
 * 4. Atomic tuple persistence and optimistic concurrency control (version).
 * 5. Dependency-injected database delegate supporting in-memory testing and Prisma execution.
 * 6. Financial boundary preservation: chargeCurrency is NEVER accepted or persisted.
 */

import type { RegistryContext } from './registry-contracts';
import { resolveEffectiveCountryProfile } from './country-policy';

export interface UserGlobalPreferenceRecord {
  readonly id: string;
  readonly userId: string;
  readonly languageTag: string;
  readonly countryCode: string;
  readonly displayCurrency: string;
  readonly isManualDisplayOverride: boolean;
  readonly timezone?: string | null;
  readonly version: number;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

export interface SaveAccountPreferenceInput {
  readonly languageTag?: string;
  readonly countryCode?: string;
  readonly displayCurrency?: string;
  readonly isManualDisplayOverride?: boolean;
  readonly timezone?: string | null;
}

export class GlccAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GlccAuthorizationError';
  }
}

export class GlccValidationError extends Error {
  readonly validationErrors: readonly string[];

  constructor(message: string, errors: readonly string[]) {
    super(`${message}: ${errors.join('; ')}`);
    this.name = 'GlccValidationError';
    this.validationErrors = Object.freeze([...errors]);
  }
}

export class GlccConcurrencyConflictError extends Error {
  readonly currentVersion: number;
  readonly expectedVersion: number;

  constructor(currentVersion: number, expectedVersion: number) {
    super(`Preference concurrency conflict: expected version ${expectedVersion}, but current is ${currentVersion}`);
    this.name = 'GlccConcurrencyConflictError';
    this.currentVersion = currentVersion;
    this.expectedVersion = expectedVersion;
  }
}

export interface PreferenceDatabaseDelegate {
  findUnique(args: { where: { user_id: string } }): Promise<UserGlobalPreferenceRecord | null>;
  upsert(args: {
    where: { user_id: string };
    create: {
      user_id: string;
      language_tag: string;
      country_code: string;
      display_currency: string;
      is_manual_display_override: boolean;
      timezone?: string | null;
      version: number;
    };
    update: {
      language_tag?: string;
      country_code?: string;
      display_currency?: string;
      is_manual_display_override?: boolean;
      timezone?: string | null;
      version?: { increment: 1 };
    };
  }): Promise<UserGlobalPreferenceRecord>;
}

/**
 * Creates an in-memory database delegate for isolated unit and integration testing.
 */
export function createInMemoryPreferenceDatabase(): PreferenceDatabaseDelegate {
  const store = new Map<string, UserGlobalPreferenceRecord>();

  return {
    async findUnique(args) {
      const record = store.get(args.where.user_id);
      return record ? Object.freeze({ ...record }) : null;
    },
    async upsert(args) {
      const existing = store.get(args.where.user_id);
      const now = new Date();

      if (existing) {
        const updated: UserGlobalPreferenceRecord = {
          ...existing,
          languageTag: args.update.language_tag ?? existing.languageTag,
          countryCode: args.update.country_code ?? existing.countryCode,
          displayCurrency: args.update.display_currency ?? existing.displayCurrency,
          isManualDisplayOverride: args.update.is_manual_display_override ?? existing.isManualDisplayOverride,
          timezone: args.update.timezone !== undefined ? args.update.timezone : existing.timezone,
          version: existing.version + 1,
          updatedAt: now,
        };
        store.set(args.where.user_id, updated);
        return Object.freeze({ ...updated });
      }

      const created: UserGlobalPreferenceRecord = {
        id: `pref_${Math.random().toString(36).slice(2, 11)}`,
        userId: args.create.user_id,
        languageTag: args.create.language_tag,
        countryCode: args.create.country_code,
        displayCurrency: args.create.display_currency,
        isManualDisplayOverride: args.create.is_manual_display_override,
        timezone: args.create.timezone ?? null,
        version: args.create.version,
        createdAt: now,
        updatedAt: now,
      };
      store.set(args.create.user_id, created);
      return Object.freeze({ ...created });
    },
  };
}

/**
 * Creates a Prisma-backed database delegate for runtime execution.
 */
export function createPrismaPreferenceDatabase(client?: unknown): PreferenceDatabaseDelegate {
  return {
    async findUnique(args) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (client as any) ?? (await import('../prisma')).prisma;
      const rec = await p.userGlobalPreference.findUnique(args);
      if (!rec) return null;
      return {
        id: rec.id,
        userId: rec.user_id,
        languageTag: rec.language_tag,
        countryCode: rec.country_code,
        displayCurrency: rec.display_currency,
        isManualDisplayOverride: rec.is_manual_display_override,
        timezone: rec.timezone,
        version: rec.version,
        createdAt: rec.created_at,
        updatedAt: rec.updated_at,
      };
    },
    async upsert(args) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = (client as any) ?? (await import('../prisma')).prisma;
      const rec = await p.userGlobalPreference.upsert(args);
      return {
        id: rec.id,
        userId: rec.user_id,
        languageTag: rec.language_tag,
        countryCode: rec.country_code,
        displayCurrency: rec.display_currency,
        isManualDisplayOverride: rec.is_manual_display_override,
        timezone: rec.timezone,
        version: rec.version,
        createdAt: rec.created_at,
        updatedAt: rec.updated_at,
      };
    },
  };
}

/**
 * Reads the saved account preference for an authenticated user.
 * Enforces server authorization: actorUserId must match targetUserId.
 */
export async function readAccountPreference(
  actorUserId: string,
  targetUserId: string,
  db: PreferenceDatabaseDelegate
): Promise<UserGlobalPreferenceRecord | null> {
  if (!actorUserId || typeof actorUserId !== 'string') {
    throw new GlccAuthorizationError('Unauthorized: missing actor session identity');
  }
  if (actorUserId !== targetUserId) {
    throw new GlccAuthorizationError(`Forbidden: actor '${actorUserId}' cannot read preferences for target '${targetUserId}'`);
  }

  return db.findUnique({ where: { user_id: targetUserId } });
}

/**
 * Saves or updates account preference for an authenticated user.
 * Enforces server authorization, pre-persistence validation, and optimistic concurrency versioning.
 */
export async function saveAccountPreference(
  actorUserId: string,
  targetUserId: string,
  input: SaveAccountPreferenceInput,
  registries: RegistryContext,
  db: PreferenceDatabaseDelegate,
  expectedVersion?: number,
  asOf?: Date | string
): Promise<UserGlobalPreferenceRecord> {
  if (!actorUserId || typeof actorUserId !== 'string') {
    throw new GlccAuthorizationError('Unauthorized: missing actor session identity');
  }
  if (actorUserId !== targetUserId) {
    throw new GlccAuthorizationError(`Forbidden: actor '${actorUserId}' cannot write preferences for target '${targetUserId}'`);
  }

  // 1. Pre-persistence validation
  const errors: string[] = [];
  const existing = await db.findUnique({ where: { user_id: targetUserId } });

  const effectiveCountry = (input.countryCode ?? existing?.countryCode ?? 'PH').trim().toUpperCase();
  const effectiveDisplay = (input.displayCurrency ?? existing?.displayCurrency ?? 'PHP').trim().toUpperCase();
  const effectiveLang = (input.languageTag ?? existing?.languageTag ?? 'en-PH').trim();

  const profileRes = resolveEffectiveCountryProfile(effectiveCountry, registries.countries, asOf);
  if (!profileRes.success) {
    errors.push(profileRes.message);
  } else {
    const allowed = profileRes.countryProfile.allowedDisplayCurrencies;
    if (!allowed.includes(effectiveDisplay)) {
      errors.push(`Display currency '${effectiveDisplay}' is not allowed for country '${effectiveCountry}'`);
    }
  }

  if (!registries.currencies.isSupported(effectiveDisplay, asOf)) {
    errors.push(`Display currency '${effectiveDisplay}' is not supported in registry`);
  }

  if (!registries.locales.isSupported(effectiveLang, asOf)) {
    errors.push(`Language '${effectiveLang}' is not supported in registry`);
  }

  if (errors.length > 0) {
    throw new GlccValidationError('Cannot save invalid preference state', errors);
  }

  // 2. Optimistic concurrency check
  if (typeof expectedVersion === 'number' && existing) {
    if (existing.version !== expectedVersion) {
      throw new GlccConcurrencyConflictError(existing.version, expectedVersion);
    }
  }

  // 3. Atomically upsert record
  const result = await db.upsert({
    where: { user_id: targetUserId },
    create: {
      user_id: targetUserId,
      language_tag: effectiveLang,
      country_code: effectiveCountry,
      display_currency: effectiveDisplay,
      is_manual_display_override: input.isManualDisplayOverride ?? false,
      timezone: input.timezone ?? null,
      version: 1,
    },
    update: {
      language_tag: effectiveLang,
      country_code: effectiveCountry,
      display_currency: effectiveDisplay,
      is_manual_display_override: input.isManualDisplayOverride ?? existing?.isManualDisplayOverride ?? false,
      timezone: input.timezone !== undefined ? input.timezone : existing?.timezone ?? null,
      version: { increment: 1 },
    },
  });

  return result;
}
