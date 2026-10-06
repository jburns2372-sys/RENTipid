/**
 * RENTipid GLCC v1.1 — QA Candidate Locale Pack Runtime Loader
 *
 * Implements controlled runtime integration for compiled CANDIDATE_FOR_QA locale packs:
 * - Deterministic loading of sealed locale packs from governance pack storage
 * - Conversion of LocalePack messages into lightweight TranslationBundle instances
 * - TranslationEngine registration for local development, automated testing, and linguistic QA
 * - Strict isolation: Candidate packs are accessible only via controlled QA/test resolution
 *   and NEVER exposed as production-selectable options to standard end-users.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TranslationBundle } from './contracts';
import { TranslationEngine } from './engine';

export interface LocalePackMessageItem {
  value: string;
  [key: string]: unknown;
}

export interface LocalePack {
  packVersion: string;
  localeTag: string;
  workflowState: string;
  releaseCandidateState: string;
  localeMetadata: {
    tag: string;
    direction: 'ltr' | 'rtl';
    [key: string]: unknown;
  };
  messages: Record<string, LocalePackMessageItem>;
  [key: string]: unknown;
}

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const LANG_DIR = path.join(REPO_ROOT, 'docs/governance/glcc-v1.1/languages');

// In-memory cache for loaded candidate bundles
const bundleCache: Map<string, TranslationBundle> = new Map();
const packCache: Map<string, LocalePack> = new Map();

/**
 * Loads a sealed LocalePack release candidate for a given locale tag.
 */
export function getQaCandidateLocalePack(tag: string): LocalePack | null {
  if (!tag) return null;
  const normalized = tag.trim();

  if (packCache.has(normalized)) {
    return packCache.get(normalized)!;
  }

  const packPath = path.join(LANG_DIR, normalized, 'pack', `${normalized}-locale-pack.json`);
  if (!fs.existsSync(packPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(packPath, 'utf-8');
    const pack = JSON.parse(raw) as LocalePack;
    packCache.set(normalized, pack);
    return pack;
  } catch (err) {
    console.error(`Failed to load QA candidate pack for ${normalized}:`, err);
    return null;
  }
}

/**
 * Converts a compiled LocalePack into a runtime TranslationBundle.
 */
export function convertLocalePackToBundle(pack: LocalePack): TranslationBundle {
  const messages: Record<string, string> = {};
  for (const [key, item] of Object.entries(pack.messages)) {
    messages[key] = item.value;
  }

  return {
    locale: pack.localeTag,
    messages,
    version: pack.packVersion,
    direction: pack.localeMetadata.direction,
  };
}

/**
 * Retrieves a runtime TranslationBundle for a QA candidate locale.
 */
export function getQaCandidateBundle(tag: string): TranslationBundle | null {
  if (!tag) return null;
  const normalized = tag.trim();

  if (bundleCache.has(normalized)) {
    return bundleCache.get(normalized)!;
  }

  const pack = getQaCandidateLocalePack(normalized);
  if (!pack) return null;

  const bundle = convertLocalePackToBundle(pack);
  bundleCache.set(normalized, bundle);
  return bundle;
}

/**
 * Loads and caches all available QA candidate bundles.
 */
export function loadAllQaCandidateBundles(): Map<string, TranslationBundle> {
  if (!fs.existsSync(LANG_DIR)) return bundleCache;

  const entries = fs.readdirSync(LANG_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      getQaCandidateBundle(entry.name);
    }
  }

  return bundleCache;
}

/**
 * Registers all available QA candidate bundles into an existing TranslationEngine.
 */
export function registerQaCandidateBundlesIntoEngine(engine: TranslationEngine): number {
  const bundles = loadAllQaCandidateBundles();
  let count = 0;
  for (const bundle of bundles.values()) {
    engine.registerBundle(bundle);
    count++;
  }
  return count;
}

/**
 * Verifies resolution of representative keys across all 9 core functional domains.
 */
export function verifyRepresentativeKeysResolution(
  localeTag: string,
  bundle: TranslationBundle
): {
  success: boolean;
  testedKeysCount: number;
  failedKeys: string[];
  resolvedMessages: Record<string, string>;
} {
  const representativeKeys = [
    'common.save',
    'navigation.dashboard',
    'auth.termsOfService',
    'listingWizard.declarationBody',
    'booking.agreementDisclosure',
    'fx.checkout.chargeNotice',
    'trustSafety.neverPayOutsideThe',
    'legalCompliance.paymentsAreHeldIn',
    'admin.jurisdiction',
  ];

  const failedKeys: string[] = [];
  const resolvedMessages: Record<string, string> = {};

  for (const key of representativeKeys) {
    const val = bundle.messages[key];
    if (!val || typeof val !== 'string' || val.trim() === '' || val === key) {
      failedKeys.push(key);
    } else {
      resolvedMessages[key] = val;
    }
  }

  return {
    success: failedKeys.length === 0,
    testedKeysCount: representativeKeys.length,
    failedKeys,
    resolvedMessages,
  };
}
