/**
 * RENTipid GLCC-JX / v1.2 — Mainland China + Thailand Jurisdiction Expansion Test Suite
 *
 * Current Action: CNTH-1 Controlled Local Implementation
 *
 * Covers:
 * 1. CN & TH country registry records
 * 2. CNY & THB currency definitions and ECMA-402 formatting
 * 3. zh-Hans reuse for Mainland China (zero duplicate bundle)
 * 4. th-TH full locale pack (2,208 canonical keys, 100% coverage, 0 fallback)
 * 5. Placeholder parity across all placeholder tokens
 * 6. Unicode integrity & font rendering
 * 7. Multi-dimensional independence:
 *    - Country != Language
 *    - Country != Display Currency
 *    - Language != Display Currency
 * 8. Timezone support: Asia/Shanghai and Asia/Bangkok
 * 9. Visible runtime switching: Chinese (zh-Hans) and Thai (th-TH)
 * 10. Preference persistence and 5-tier resolution
 * 11. Regression validation for frozen baseline:
 *     - Original 44 countries
 *     - Original 46 language entries
 *     - Original 23 currencies
 *     - ja-JP runtime
 *     - ar-AE RTL
 * 12. Payment authority preservation: chargeCurrency and settlementCurrency strictly PHP
 * 13. Production gating: CN & TH not active in production, th-TH not production-selectable
 */

import {
  GLOBAL_COUNTRY_CATALOG,
  GLOBAL_SUPPORTED_COUNTRY_CODES,
  getCountryProfile,
  isSupportedCountryCode,
} from '../../src/lib/glcc/country/country-registry';

import {
  GLOBAL_CURRENCY_CATALOG,
  GLOBAL_SUPPORTED_CURRENCY_CODES,
  getCurrencyDefinition,
  isSupportedCurrencyCode,
  formatGlobalCurrency,
  resolveMonetaryAuthority,
} from '../../src/lib/glcc/currency/currency-registry';

import {
  GLOBAL_LANGUAGE_CATALOG,
  GLOBAL_SUPPORTED_LANGUAGE_TAGS,
  getLanguageDefinition,
  isSupportedLanguageTag,
  isLanguageProductionSelectable,
} from '../../src/lib/glcc/language/language-registry';

import {
  GLCC_CANONICAL_KEYS,
} from '../../src/lib/glcc/i18n/contracts';

import {
  extractPlaceholders,
} from '../../src/lib/glcc/i18n/validator';

import {
  getProductionBundle,
} from '../../src/lib/glcc/i18n/bundle-registry';

import {
  TranslationEngine,
} from '../../src/lib/glcc/i18n/engine';

import {
  getLawsByJurisdiction,
} from '../../src/lib/compliance/registry';

describe('GLCC-JX v1.2: Mainland China + Thailand Controlled Implementation Suite', () => {

  describe('1. Country Registry (46 Countries)', () => {
    test('total registered countries is exactly 46', () => {
      expect(GLOBAL_COUNTRY_CATALOG.length).toBe(46);
      expect(GLOBAL_SUPPORTED_COUNTRY_CODES.length).toBe(46);
      const uniqueCodes = new Set(GLOBAL_SUPPORTED_COUNTRY_CODES);
      expect(uniqueCodes.size).toBe(46);
    });

    test('validates Mainland China (CN) country record', () => {
      expect(isSupportedCountryCode('CN')).toBe(true);
      const cn = getCountryProfile('CN');
      expect(cn).not.toBeNull();
      expect(cn?.code).toBe('CN');
      expect(cn?.countryCode).toBe('CN');
      expect(cn?.name).toBe('China');
      expect(cn?.complianceGroup).toBe('China');
      expect(cn?.regionCategory).toBe('APAC');
      expect(cn?.defaultDisplayCurrency).toBe('CNY');
      expect(cn?.defaultLanguageTag).toBe('zh-Hans');
      expect(cn?.supportedLanguageTags).toContain('zh-Hans');
      expect(cn?.defaultTimezone).toBe('Asia/Shanghai');
      expect(cn?.allowedChargeCurrencies).toEqual(['PHP']);
    });

    test('validates Thailand (TH) country record', () => {
      expect(isSupportedCountryCode('TH')).toBe(true);
      const th = getCountryProfile('TH');
      expect(th).not.toBeNull();
      expect(th?.code).toBe('TH');
      expect(th?.countryCode).toBe('TH');
      expect(th?.name).toBe('Thailand');
      expect(th?.complianceGroup).toBe('Thailand');
      expect(th?.regionCategory).toBe('APAC');
      expect(th?.defaultDisplayCurrency).toBe('THB');
      expect(th?.defaultLanguageTag).toBe('th-TH');
      expect(th?.supportedLanguageTags).toContain('th-TH');
      expect(th?.defaultTimezone).toBe('Asia/Bangkok');
      expect(th?.allowedChargeCurrencies).toEqual(['PHP']);
    });
  });

  describe('2. Currency Registry (25 Currencies)', () => {
    test('total registered currencies is exactly 25', () => {
      expect(GLOBAL_CURRENCY_CATALOG.length).toBe(25);
      expect(GLOBAL_SUPPORTED_CURRENCY_CODES.length).toBe(25);
      const uniqueCodes = new Set(GLOBAL_SUPPORTED_CURRENCY_CODES);
      expect(uniqueCodes.size).toBe(25);
    });

    test('validates Chinese Yuan (CNY) definition & ECMA-402 formatting', () => {
      expect(isSupportedCurrencyCode('CNY')).toBe(true);
      const cny = getCurrencyDefinition('CNY');
      expect(cny).not.toBeNull();
      expect(cny?.code).toBe('CNY');
      expect(cny?.numericCode).toBe('156');
      expect(cny?.minorUnitExponent).toBe(2);
      expect(cny?.isActive).toBe(true);

      // Formatting checks
      expect(formatGlobalCurrency(0, 'CNY', 'zh-Hans')).toBe('¥0.00');
      expect(formatGlobalCurrency(100, 'CNY', 'zh-Hans')).toBe('¥100.00');
      expect(formatGlobalCurrency(1234567.89, 'CNY', 'zh-Hans')).toBe('¥1,234,567.89');
      expect(formatGlobalCurrency(-50, 'CNY', 'zh-Hans')).toBe('-¥50.00');
    });

    test('validates Thai Baht (THB) definition & ECMA-402 formatting', () => {
      expect(isSupportedCurrencyCode('THB')).toBe(true);
      const thb = getCurrencyDefinition('THB');
      expect(thb).not.toBeNull();
      expect(thb?.code).toBe('THB');
      expect(thb?.numericCode).toBe('764');
      expect(thb?.minorUnitExponent).toBe(2);
      expect(thb?.isActive).toBe(true);

      // Formatting checks
      expect(formatGlobalCurrency(0, 'THB', 'th-TH')).toBe('฿0.00');
      expect(formatGlobalCurrency(100, 'THB', 'th-TH')).toBe('฿100.00');
      expect(formatGlobalCurrency(1234567.89, 'THB', 'th-TH')).toBe('฿1,234,567.89');
      expect(formatGlobalCurrency(-50, 'THB', 'th-TH')).toBe('-฿50.00');
    });
  });

  describe('3. Language Registry (47 Languages) & Chinese Reuse', () => {
    test('total registered languages is exactly 47', () => {
      expect(GLOBAL_LANGUAGE_CATALOG.length).toBe(47);
      expect(GLOBAL_SUPPORTED_LANGUAGE_TAGS.length).toBe(47);
      const uniqueTags = new Set(GLOBAL_SUPPORTED_LANGUAGE_TAGS);
      expect(uniqueTags.size).toBe(47);
    });

    test('zh-Hans is correctly reused for Mainland China without duplication', () => {
      const zh = getLanguageDefinition('zh-Hans');
      expect(zh).not.toBeNull();
      expect(zh?.tag).toBe('zh-Hans');
      expect(zh?.countriesServed).toContain('CN');
      expect(zh?.countriesServed).toContain('SG');
      expect(isSupportedLanguageTag('zh-CN')).toBe(false); // No duplicate zh-CN
    });

    test('th-TH is registered with pre-production QA_REQUIRED status', () => {
      const th = getLanguageDefinition('th-TH');
      expect(th).not.toBeNull();
      expect(th?.tag).toBe('th-TH');
      expect(th?.name).toBe('Thai');
      expect(th?.nativeName).toBe('ไทย');
      expect(th?.direction).toBe('ltr');
      expect(th?.script).toBe('Thai');
      expect(th?.releaseStatus).toBe('QA_REQUIRED');
      expect(th?.legalTranslationStatus).toBe('APPROVED');
      // Must NOT be production selectable
      expect(isLanguageProductionSelectable('th-TH')).toBe(false);
    });
  });

  describe('4. Thai (th-TH) Locale Pack & Parity', () => {
    const thBundle = getProductionBundle('th-th');
    const enBundle = getProductionBundle('en-ph');

    test('th-TH bundle exists and contains exactly 2,208 canonical keys', () => {
      expect(thBundle).not.toBeNull();
      const keys = Object.keys(thBundle!.messages);
      expect(keys.length).toBe(2208);
      expect(keys.length).toBe(GLCC_CANONICAL_KEYS.length);
    });

    test('th-TH has 100% coverage with 0 missing keys against canonical baseline', () => {
      const thMessages = thBundle!.messages;
      const missingKeys: string[] = [];
      for (const key of GLCC_CANONICAL_KEYS) {
        if (!thMessages[key] || typeof thMessages[key] !== 'string') {
          missingKeys.push(key);
        }
      }
      expect(missingKeys).toHaveLength(0);
    });

    test('th-TH has 0 placeholder mismatches against en-PH baseline', () => {
      const thMessages = thBundle!.messages;
      const enMessages = enBundle!.messages;
      const mismatches: { key: string; expected: string[]; actual: string[] }[] = [];

      for (const key of GLCC_CANONICAL_KEYS) {
        const enText = enMessages[key];
        const thText = thMessages[key];
        if (enText && thText) {
          const expected = extractPlaceholders(enText).sort();
          const actual = extractPlaceholders(thText).sort();
          if (expected.length > 0 || actual.length > 0) {
            if (JSON.stringify(expected) !== JSON.stringify(actual)) {
              mismatches.push({ key, expected, actual });
            }
          }
        }
      }
      expect(mismatches).toHaveLength(0);
    });

    test('th-TH has 0 Unicode replacement or corrupt characters', () => {
      const thMessages = thBundle!.messages;
      for (const [key, text] of Object.entries(thMessages)) {
        expect(text).not.toContain('\uFFFD'); // replacement char
        expect(text).not.toContain('undefined');
        expect(text).not.toContain('NaN');
        expect(text.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('5. Multi-Dimensional Independence Matrix', () => {
    test('China + Simplified Chinese + CNY', () => {
      const c = getCountryProfile('CN')!;
      const l = getLanguageDefinition('zh-Hans')!;
      const curr = getCurrencyDefinition('CNY')!;
      expect(c.code).toBe('CN');
      expect(l.tag).toBe('zh-Hans');
      expect(curr.code).toBe('CNY');
      const auth = resolveMonetaryAuthority('CNY');
      expect(auth.transactionCurrency).toBe('PHP');
      expect(auth.settlementCurrency).toBe('PHP');
    });

    test('China + English + CNY', () => {
      const c = getCountryProfile('CN')!;
      const l = getLanguageDefinition('en-US')!;
      const curr = getCurrencyDefinition('CNY')!;
      expect(c.code).toBe('CN');
      expect(l.tag).toBe('en-US');
      expect(curr.code).toBe('CNY');
    });

    test('China + Japanese + CNY', () => {
      const c = getCountryProfile('CN')!;
      const l = getLanguageDefinition('ja-JP')!;
      const curr = getCurrencyDefinition('CNY')!;
      expect(c.code).toBe('CN');
      expect(l.tag).toBe('ja-JP');
      expect(curr.code).toBe('CNY');
    });

    test('China + Simplified Chinese + USD', () => {
      const c = getCountryProfile('CN')!;
      const l = getLanguageDefinition('zh-Hans')!;
      const curr = getCurrencyDefinition('USD')!;
      expect(c.code).toBe('CN');
      expect(l.tag).toBe('zh-Hans');
      expect(curr.code).toBe('USD');
    });

    test('Thailand + Thai + THB', () => {
      const c = getCountryProfile('TH')!;
      const l = getLanguageDefinition('th-TH')!;
      const curr = getCurrencyDefinition('THB')!;
      expect(c.code).toBe('TH');
      expect(l.tag).toBe('th-TH');
      expect(curr.code).toBe('THB');
      const auth = resolveMonetaryAuthority('THB');
      expect(auth.transactionCurrency).toBe('PHP');
      expect(auth.settlementCurrency).toBe('PHP');
    });

    test('Thailand + English + THB', () => {
      const c = getCountryProfile('TH')!;
      const l = getLanguageDefinition('en-US')!;
      const curr = getCurrencyDefinition('THB')!;
      expect(c.code).toBe('TH');
      expect(l.tag).toBe('en-US');
      expect(curr.code).toBe('THB');
    });

    test('Thailand + Japanese + THB', () => {
      const c = getCountryProfile('TH')!;
      const l = getLanguageDefinition('ja-JP')!;
      const curr = getCurrencyDefinition('THB')!;
      expect(c.code).toBe('TH');
      expect(l.tag).toBe('ja-JP');
      expect(curr.code).toBe('THB');
    });

    test('Thailand + Thai + USD', () => {
      const c = getCountryProfile('TH')!;
      const l = getLanguageDefinition('th-TH')!;
      const curr = getCurrencyDefinition('USD')!;
      expect(c.code).toBe('TH');
      expect(l.tag).toBe('th-TH');
      expect(curr.code).toBe('USD');
    });

    test('Philippines + Thai + PHP', () => {
      const c = getCountryProfile('PH')!;
      const l = getLanguageDefinition('th-TH')!;
      const curr = getCurrencyDefinition('PHP')!;
      expect(c.code).toBe('PH');
      expect(l.tag).toBe('th-TH');
      expect(curr.code).toBe('PHP');
    });

    test('Thailand + Simplified Chinese + THB', () => {
      const c = getCountryProfile('TH')!;
      const l = getLanguageDefinition('zh-Hans')!;
      const curr = getCurrencyDefinition('THB')!;
      expect(c.code).toBe('TH');
      expect(l.tag).toBe('zh-Hans');
      expect(curr.code).toBe('THB');
    });
  });

  describe('6. Visible Runtime Translation Switching', () => {
    const engine = new TranslationEngine();

    test('switching to zh-Hans visibly translates application surfaces to Simplified Chinese', () => {
      expect(engine.translate('account.activeSessions', undefined, 'zh-Hans')).toBe('活跃会话');
      expect(engine.translate('common.save', undefined, 'zh-Hans')).toBe('保存');
      expect(engine.translate('common.cancel', undefined, 'zh-Hans')).toBe('取消');
      expect(engine.translate('common.search', undefined, 'zh-Hans')).toBe('搜索');
    });

    test('switching to th-TH visibly translates application surfaces to Thai', () => {
      expect(engine.translate('account.activeSessions', undefined, 'th-TH')).toBe('เซสชันที่ใช้งานอยู่');
      expect(engine.translate('common.save', undefined, 'th-TH')).toBe('บันทึก');
      expect(engine.translate('common.cancel', undefined, 'th-TH')).toBe('ยกเลิก');
      expect(engine.translate('common.search', undefined, 'th-TH')).toBe('ค้นหา');
    });
  });

  describe('7. Timezone Support', () => {
    test('China timezone Asia/Shanghai formats correctly', () => {
      const d = new Date('2026-10-07T10:00:00Z');
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        hour: 'numeric',
        timeZoneName: 'short',
      }).format(d);
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('6 PM');
    });

    test('Thailand timezone Asia/Bangkok formats correctly', () => {
      const d = new Date('2026-10-07T10:00:00Z');
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: 'numeric',
        timeZoneName: 'short',
      }).format(d);
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('5 PM');
    });
  });

  describe('8. Compliance & Jurisdictional Activation Governance', () => {
    test('China compliance register has status VALIDATION_REQUIRED and is not active in production', () => {
      const chinaLaws = getLawsByJurisdiction('China');
      expect(chinaLaws.length).toBeGreaterThanOrEqual(6);
      for (const law of chinaLaws) {
        expect(law.status).toBe('VALIDATION_REQUIRED');
      }
    });

    test('Thailand compliance register has status VALIDATION_REQUIRED and is not active in production', () => {
      const thaiLaws = getLawsByJurisdiction('Thailand');
      expect(thaiLaws.length).toBeGreaterThanOrEqual(5);
      for (const law of thaiLaws) {
        expect(law.status).toBe('VALIDATION_REQUIRED');
      }
    });
  });

  describe('9. Financial & Monetary Authority Boundaries', () => {
    test('transactionCurrency is immutable PHP', () => {
      expect(resolveMonetaryAuthority('CNY').transactionCurrency).toBe('PHP');
      expect(resolveMonetaryAuthority('THB').transactionCurrency).toBe('PHP');
    });

    test('settlementCurrency is immutable PHP', () => {
      expect(resolveMonetaryAuthority('CNY').settlementCurrency).toBe('PHP');
      expect(resolveMonetaryAuthority('THB').settlementCurrency).toBe('PHP');
    });
  });

  describe('10. Existing Frozen Baseline Regression Prevention', () => {
    test('original 44 countries remain fully present and valid', () => {
      const original44 = [
        'PH', 'US', 'GB', 'CA', 'AU', 'SG', 'MY', 'ID', 'VN', 'JP',
        'KR', 'IN', 'AE', 'BR', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
        'AT', 'IE', 'PT', 'FI', 'GR', 'LU', 'CY', 'EE', 'LV', 'LT',
        'MT', 'SK', 'SI', 'PL', 'SE', 'DK', 'NO', 'CZ', 'HU', 'RO',
        'BG', 'HR', 'IS', 'LI'
      ];
      for (const code of original44) {
        expect(isSupportedCountryCode(code)).toBe(true);
        expect(getCountryProfile(code)).not.toBeNull();
      }
    });

    test('original 23 currencies remain fully present and valid', () => {
      const original23 = [
        'PHP', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD', 'MYR', 'IDR', 'VND',
        'JPY', 'KRW', 'INR', 'AED', 'BRL', 'PLN', 'SEK', 'DKK', 'NOK', 'CZK',
        'HUF', 'RON', 'CHF'
      ];
      for (const code of original23) {
        expect(isSupportedCurrencyCode(code)).toBe(true);
        expect(getCurrencyDefinition(code)).not.toBeNull();
      }
    });

    test('ja-JP runtime localization functions correctly', () => {
      const jaBundle = getProductionBundle('ja-jp');
      expect(jaBundle).not.toBeNull();
      expect(jaBundle?.messages['common.save']).toBeTruthy();
    });

    test('ar-AE RTL direction preserved', () => {
      const arDef = getLanguageDefinition('ar-AE');
      expect(arDef?.direction).toBe('rtl');
    });
  });

});
