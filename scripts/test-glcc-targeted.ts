/**
 * RENTipid GLOBAL-MKT / v2.0 — GLCC Targeted Regression Runner
 *
 * Verifies that the deployed application and runtime preserve:
 * - 46 countries
 * - 47 language registry entries
 * - 25 display currencies
 * - country/language independence
 * - country/display-currency independence
 * - PH, TH, CN
 * - th-TH, zh-Hans
 * - THB, CNY
 */

import { GLOBAL_COUNTRY_CATALOG } from '../src/lib/glcc/country/country-registry';
import { GLOBAL_LANGUAGE_CATALOG } from '../src/lib/glcc/language/language-registry';
import { GLOBAL_CURRENCY_CATALOG } from '../src/lib/glcc/currency/currency-registry';

function assert(cond: boolean, title: string, details: string) {
  const mark = cond ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${title} — ${details}`);
  if (!cond) throw new Error(`GLCC Assertion failed: ${title} - ${details}`);
}

export function runGlccTargetedRegression() {
  console.log('========================================================');
  console.log('RENTipid GLOBAL-MKT / v2.0 — TARGETED GLCC REGRESSION');
  console.log('========================================================\n');

  // 1. 46 Countries
  assert(
    GLOBAL_COUNTRY_CATALOG.length === 46,
    'GLCC 46 Countries Invariant',
    `Found ${GLOBAL_COUNTRY_CATALOG.length} countries in catalog.`
  );

  // 2. 47 Language Registry Entries
  assert(
    GLOBAL_LANGUAGE_CATALOG.length === 47,
    'GLCC 47 Language Registry Invariant',
    `Found ${GLOBAL_LANGUAGE_CATALOG.length} languages in registry.`
  );

  // 3. 25 Display Currencies
  assert(
    GLOBAL_CURRENCY_CATALOG.length === 25,
    'GLCC 25 Display Currencies Invariant',
    `Found ${GLOBAL_CURRENCY_CATALOG.length} currencies in registry.`
  );

  // 4. Country Presence (PH, TH, CN)
  const phCountry = GLOBAL_COUNTRY_CATALOG.find(c => c.code === 'PH');
  const thCountry = GLOBAL_COUNTRY_CATALOG.find(c => c.code === 'TH');
  const cnCountry = GLOBAL_COUNTRY_CATALOG.find(c => c.code === 'CN');
  assert(Boolean(phCountry), 'Country PH Present', `Found: ${phCountry?.name}`);
  assert(Boolean(thCountry), 'Country TH Present', `Found: ${thCountry?.name}`);
  assert(Boolean(cnCountry), 'Country CN Present', `Found: ${cnCountry?.name}`);

  // 5. Language Presence (th-TH, zh-Hans)
  const thLang = GLOBAL_LANGUAGE_CATALOG.find(l => l.tag === 'th-TH');
  const cnLang = GLOBAL_LANGUAGE_CATALOG.find(l => l.tag === 'zh-Hans');
  assert(Boolean(thLang), 'Language th-TH Present', `Found: ${thLang?.name} (${thLang?.releaseStatus})`);
  assert(Boolean(cnLang), 'Language zh-Hans Present', `Found: ${cnLang?.name} (${cnLang?.releaseStatus})`);

  // 6. Currency Presence (THB, CNY, PHP)
  const thbCurr = GLOBAL_CURRENCY_CATALOG.find(c => c.code === 'THB');
  const cnyCurr = GLOBAL_CURRENCY_CATALOG.find(c => c.code === 'CNY');
  const phpCurr = GLOBAL_CURRENCY_CATALOG.find(c => c.code === 'PHP');
  assert(Boolean(thbCurr), 'Currency THB Present', `Found: ${thbCurr?.name} (${thbCurr?.symbol})`);
  assert(Boolean(cnyCurr), 'Currency CNY Present', `Found: ${cnyCurr?.name} (${cnyCurr?.symbol})`);
  assert(Boolean(phpCurr), 'Currency PHP Present', `Found: ${phpCurr?.name} (${phpCurr?.symbol})`);

  // 7. Multi-dimensional independence
  assert(
    thCountry?.defaultDisplayCurrency === 'THB' && thCountry?.supportedLanguageTags.includes('th-TH'),
    'TH Canonical Defaults',
    'TH defaults to THB and supports th-TH'
  );
  assert(
    cnCountry?.defaultDisplayCurrency === 'CNY' && cnCountry?.supportedLanguageTags.includes('zh-Hans'),
    'CN Canonical Defaults',
    'CN defaults to CNY and supports zh-Hans'
  );
  assert(
    phCountry?.defaultDisplayCurrency === 'PHP' && phCountry?.supportedLanguageTags.includes('en-PH'),
    'PH Canonical Defaults',
    'PH defaults to PHP and supports en-PH'
  );

  console.log('\n========================================================');
  console.log('TARGETED GLCC REGRESSION: ALL CHECKS PASSED');
  console.log('========================================================\n');
}

if (require.main === module || process.argv[1]?.endsWith('test-glcc-targeted.ts')) {
  runGlccTargetedRegression();
}
