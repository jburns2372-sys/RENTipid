/**
 * RENTipid GLCC v1.0 — Feature Flags & Runtime Configuration
 *
 * Implements:
 * 1. Runtime feature flags backed by the existing RENTipid SystemSetting model.
 * 2. Strict FAIL-CLOSED evaluation: if a flag is absent or invalid, it evaluates to false.
 * 3. Flag set:
 *    - glcc_v1_enabled: Master switch gating preference API and GLCC resolution.
 *    - glcc_currency_override_enabled: Gates user display-currency overrides different from country default.
 *    - glcc_country_autodetect_enabled: Gates coarse request/header country suggestions (First-run only).
 * 4. Dependency-injected reader interface for 100% isolated unit and route testing.
 */

export const GLCC_FEATURE_FLAGS = Object.freeze({
  V1_ENABLED: 'glcc_v1_enabled',
  CURRENCY_OVERRIDE_ENABLED: 'glcc_currency_override_enabled',
  COUNTRY_AUTODETECT_ENABLED: 'glcc_country_autodetect_enabled',
  FX_DISPLAY_ENABLED: 'glcc_fx_display_enabled',
} as const);

export type GlccFeatureFlagKey = typeof GLCC_FEATURE_FLAGS[keyof typeof GLCC_FEATURE_FLAGS];

export interface GlccSystemSettingReader {
  readonly systemSetting: {
    findMany(args: {
      where: { setting_key: { in: readonly string[] } };
      select: { setting_key: true; setting_value: true };
    }): Promise<readonly { setting_key: string; setting_value: string }[]>;
    findUnique?(args: {
      where: { setting_key: string };
      select?: { setting_key: true; setting_value: true };
    }): Promise<{ setting_key: string; setting_value: string } | null>;
  };
}

export interface GlccFeatureFlagEvaluation {
  readonly v1Enabled: boolean;
  readonly currencyOverrideEnabled: boolean;
  readonly countryAutodetectEnabled: boolean;
  readonly fxDisplayEnabled: boolean;
  readonly flagStates: Readonly<Record<GlccFeatureFlagKey, boolean>>;
}

/**
 * Strict boolean parser: only trimmed, case-insensitive 'true' evaluates to true.
 * Any other value (undefined, null, 'false', '1', malformed string) returns false.
 */
export function parseStrictBooleanFlag(value: string | undefined | null): boolean {
  if (typeof value !== 'string') return false;
  return value.trim().toLowerCase() === 'true';
}

/**
 * Creates an in-memory SystemSetting reader for deterministic unit testing.
 */
export function createInMemorySystemSettingReader(
  initialSettings: Record<string, string> = {}
): GlccSystemSettingReader & { setFlag(key: string, value: string): void } {
  const settings = new Map<string, string>(Object.entries(initialSettings));

  return {
    systemSetting: {
      async findMany(args) {
        const results: { setting_key: string; setting_value: string }[] = [];
        for (const key of args.where.setting_key.in) {
          if (settings.has(key)) {
            results.push({ setting_key: key, setting_value: settings.get(key)! });
          }
        }
        return results;
      },
      async findUnique(args) {
        if (settings.has(args.where.setting_key)) {
          return { setting_key: args.where.setting_key, setting_value: settings.get(args.where.setting_key)! };
        }
        return null;
      },
    },
    setFlag(key: string, value: string) {
      settings.set(key, value);
    },
  };
}

let overrideSystemSettingReader: GlccSystemSettingReader | null = null;

export function setOverrideSystemSettingReader(reader: GlccSystemSettingReader | null): void {
  overrideSystemSettingReader = reader;
}

/**
 * Resolves the default Prisma reader if no explicit db reader is injected.
 */
async function resolveDefaultReader(): Promise<GlccSystemSettingReader> {
  const { prisma } = await import('../prisma');
  return prisma as unknown as GlccSystemSettingReader;
}

/**
 * Evaluates all GLCC feature flags against the SystemSetting authority.
 * Fails closed if flags are absent or database read errors occur.
 */
export async function evaluateGlccFeatureFlags(
  db?: GlccSystemSettingReader
): Promise<GlccFeatureFlagEvaluation> {
  try {
    const reader = db ?? overrideSystemSettingReader ?? (await resolveDefaultReader());
    const keys: readonly string[] = [
      GLCC_FEATURE_FLAGS.V1_ENABLED,
      GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED,
      GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED,
      GLCC_FEATURE_FLAGS.FX_DISPLAY_ENABLED,
    ];

    const records = await reader.systemSetting.findMany({
      where: { setting_key: { in: keys } },
      select: { setting_key: true, setting_value: true },
    });

    const map = new Map<string, string>(records.map(r => [r.setting_key, r.setting_value]));

    const v1Enabled = parseStrictBooleanFlag(map.get(GLCC_FEATURE_FLAGS.V1_ENABLED));
    const currencyOverrideEnabled = parseStrictBooleanFlag(map.get(GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED));
    const countryAutodetectEnabled = parseStrictBooleanFlag(map.get(GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED));
    const fxDisplayEnabled = parseStrictBooleanFlag(map.get(GLCC_FEATURE_FLAGS.FX_DISPLAY_ENABLED));

    const flagStates: Record<GlccFeatureFlagKey, boolean> = {
      [GLCC_FEATURE_FLAGS.V1_ENABLED]: v1Enabled,
      [GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED]: currencyOverrideEnabled,
      [GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED]: countryAutodetectEnabled,
      [GLCC_FEATURE_FLAGS.FX_DISPLAY_ENABLED]: fxDisplayEnabled,
    };

    return Object.freeze({
      v1Enabled,
      currencyOverrideEnabled,
      countryAutodetectEnabled,
      fxDisplayEnabled,
      flagStates: Object.freeze(flagStates),
    });
  } catch (error) {
    console.error('[GLCC] Feature flag evaluation error, failing closed:', error);
    return Object.freeze({
      v1Enabled: false,
      currencyOverrideEnabled: false,
      countryAutodetectEnabled: false,
      fxDisplayEnabled: false,
      flagStates: Object.freeze({
        [GLCC_FEATURE_FLAGS.V1_ENABLED]: false,
        [GLCC_FEATURE_FLAGS.CURRENCY_OVERRIDE_ENABLED]: false,
        [GLCC_FEATURE_FLAGS.COUNTRY_AUTODETECT_ENABLED]: false,
        [GLCC_FEATURE_FLAGS.FX_DISPLAY_ENABLED]: false,
      }),
    });
  }
}
