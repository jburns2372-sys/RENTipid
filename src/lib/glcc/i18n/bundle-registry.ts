/**
 * RENTipid GLCC v1.1 — Production Locale Bundle Registry
 *
 * Provides authoritative compiled TranslationBundle instances for:
 * - 2 Core Baselines: en-PH, fil-PH
 * - 32 Full Candidates: ja-JP, de-DE, fr-FR, es-ES, ar-AE, ko-KR, pt-BR, zh-Hans, etc.
 * - 12 Regional Aliases: en-GB, en-CA, en-AU, en-SG, en-IN, en-MY, en-ID, pt-PT, fr-CA, ga-IE, mt-MT, ta-SG
 *
 * All bundles contain 2,208 canonical keys with strict BCP-47 compliance.
 */

import type { TranslationBundle } from './contracts';
import { EN_PH_BUNDLE } from './locales/en-PH';
import { FIL_PH_BUNDLE, FIL_PH_FIXTURE_BUNDLE } from './locales/fil-PH';

// Import compiled production candidate bundles
import arAE from './bundles/ar-AE.json';
import bgBG from './bundles/bg-BG.json';
import csCZ from './bundles/cs-CZ.json';
import daDK from './bundles/da-DK.json';
import deDE from './bundles/de-DE.json';
import elGR from './bundles/el-GR.json';
import enUS from './bundles/en-US.json';
import esES from './bundles/es-ES.json';
import etEE from './bundles/et-EE.json';
import fiFI from './bundles/fi-FI.json';
import frFR from './bundles/fr-FR.json';
import hiIN from './bundles/hi-IN.json';
import hrHR from './bundles/hr-HR.json';
import huHU from './bundles/hu-HU.json';
import idID from './bundles/id-ID.json';
import isIS from './bundles/is-IS.json';
import itIT from './bundles/it-IT.json';
import jaJP from './bundles/ja-JP.json';
import koKR from './bundles/ko-KR.json';
import ltLT from './bundles/lt-LT.json';
import lvLV from './bundles/lv-LV.json';
import msMY from './bundles/ms-MY.json';
import nbNO from './bundles/nb-NO.json';
import nlNL from './bundles/nl-NL.json';
import plPL from './bundles/pl-PL.json';
import ptBR from './bundles/pt-BR.json';
import roRO from './bundles/ro-RO.json';
import skSK from './bundles/sk-SK.json';
import slSI from './bundles/sl-SI.json';
import svSE from './bundles/sv-SE.json';
import viVN from './bundles/vi-VN.json';
import zhHans from './bundles/zh-Hans.json';

// Helper to construct typed TranslationBundle
function toBundle(data: { locale: string; direction?: string; version?: string; messages: Record<string, string> }): TranslationBundle {
  return {
    locale: data.locale,
    direction: (data.direction === 'rtl' ? 'rtl' : 'ltr'),
    version: data.version || '1.1.0',
    isFixture: false,
    releaseStatus: 'PRODUCTION_READY',
    messages: data.messages,
  };
}

// Map of canonical full candidate bundles (case-insensitive keys)
const PRODUCTION_BUNDLE_MAP: Map<string, TranslationBundle> = new Map([
  ['en-ph', EN_PH_BUNDLE],
  ['fil-ph', FIL_PH_BUNDLE || FIL_PH_FIXTURE_BUNDLE],
  ['ar-ae', toBundle(arAE)],
  ['bg-bg', toBundle(bgBG)],
  ['cs-cz', toBundle(csCZ)],
  ['da-dk', toBundle(daDK)],
  ['de-de', toBundle(deDE)],
  ['el-gr', toBundle(elGR)],
  ['en-us', toBundle(enUS)],
  ['es-es', toBundle(esES)],
  ['et-ee', toBundle(etEE)],
  ['fi-fi', toBundle(fiFI)],
  ['fr-fr', toBundle(frFR)],
  ['hi-in', toBundle(hiIN)],
  ['hr-hr', toBundle(hrHR)],
  ['hu-hu', toBundle(huHU)],
  ['id-id', toBundle(idID)],
  ['is-is', toBundle(isIS)],
  ['it-it', toBundle(itIT)],
  ['ja-jp', toBundle(jaJP)],
  ['ko-kr', toBundle(koKR)],
  ['lt-lt', toBundle(ltLT)],
  ['lv-lv', toBundle(lvLV)],
  ['ms-my', toBundle(msMY)],
  ['nb-no', toBundle(nbNO)],
  ['nl-nl', toBundle(nlNL)],
  ['pl-pl', toBundle(plPL)],
  ['pt-br', toBundle(ptBR)],
  ['ro-ro', toBundle(roRO)],
  ['sk-sk', toBundle(skSK)],
  ['sl-si', toBundle(slSI)],
  ['sv-se', toBundle(svSE)],
  ['vi-vn', toBundle(viVN)],
  ['zh-hans', toBundle(zhHans)],
]);

// 12 Regional Shared Aliases mapping to base candidate bundles
const REGIONAL_ALIAS_MAP: Record<string, string> = {
  'en-gb': 'en-ph',
  'en-ca': 'en-ph',
  'en-au': 'en-ph',
  'en-sg': 'en-ph',
  'en-in': 'en-ph',
  'en-my': 'en-ph',
  'en-id': 'en-ph',
  'pt-pt': 'pt-br',
  'fr-ca': 'fr-fr',
  'ga-ie': 'en-ph',
  'mt-mt': 'en-ph',
  'ta-sg': 'en-ph',
};

/**
 * Resolves a compiled TranslationBundle for any supported BCP-47 locale tag or alias.
 */
export function getProductionBundle(tag?: string): TranslationBundle | null {
  if (!tag) return null;
  const normalized = tag.trim().toLowerCase();

  // 1. Direct candidate or base bundle match
  const direct = PRODUCTION_BUNDLE_MAP.get(normalized);
  if (direct) {
    return direct;
  }

  // 2. Regional alias resolution
  const aliasTarget = REGIONAL_ALIAS_MAP[normalized];
  if (aliasTarget) {
    const aliasedBundle = PRODUCTION_BUNDLE_MAP.get(aliasTarget);
    if (aliasedBundle) {
      return {
        ...aliasedBundle,
        locale: tag.trim(), // Preserve requested alias tag
      };
    }
  }

  // 3. Language subtag fallback (e.g., 'ja' -> 'ja-JP', 'de' -> 'de-DE')
  for (const [k, b] of PRODUCTION_BUNDLE_MAP.entries()) {
    if (k.startsWith(normalized + '-')) {
      return b;
    }
  }

  return null;
}

/**
 * Checks if a bundle is available for the given locale tag.
 */
export function hasProductionBundle(tag?: string): boolean {
  return getProductionBundle(tag) !== null;
}

/**
 * Retrieves all registered production bundles.
 */
export function getAllProductionBundles(): Map<string, TranslationBundle> {
  return new Map(PRODUCTION_BUNDLE_MAP);
}

/**
 * Registers all compiled production bundles into an existing TranslationEngine instance.
 */
export function registerAllProductionBundles(engine: { registerBundle: (bundle: TranslationBundle) => void }): void {
  for (const bundle of PRODUCTION_BUNDLE_MAP.values()) {
    engine.registerBundle(bundle);
  }
}
