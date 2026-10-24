/**
 * RENTipid GLOBAL-MKT / v2.0 — International Phone Normalization Service
 *
 * Implements country-aware E.164 phone normalization across all 46 authoritative
 * jurisdictions while preserving 100% backward compatibility for existing Philippine numbers.
 */

export const COUNTRY_CALLING_CODES: Readonly<Record<string, string>> = Object.freeze({
  // Direct Compliance Jurisdictions
  PH: '63',
  US: '1',
  GB: '44',
  CA: '1',
  AU: '61',
  SG: '65',
  MY: '60',
  ID: '62',
  VN: '84',
  JP: '81',
  KR: '82',
  IN: '91',
  CN: '86',
  TH: '66',
  AE: '971',
  BR: '55',

  // EU / EEA Jurisdictions
  DE: '49',
  FR: '33',
  IT: '39',
  ES: '34',
  NL: '31',
  BE: '32',
  AT: '43',
  IE: '353',
  PT: '351',
  PL: '48',
  SE: '46',
  DK: '45',
  FI: '358',
  GR: '30',
  CZ: '420',
  RO: '40',
  HU: '36',
  NO: '47',
  IS: '354',
  LU: '352',
  BG: '359',
  HR: '385',
  CY: '357',
  EE: '372',
  LV: '371',
  LT: '370',
  MT: '356',
  SK: '421',
  SI: '386',
  LI: '423',
});

const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

export interface PhoneNormalizationResult {
  readonly valid: boolean;
  readonly e164?: string;
  readonly reason?: string;
}

/**
 * Normalizes a phone number to standard E.164 format.
 * Preserves existing Philippine format (09xxxxxxxxx, 9xxxxxxxxx, +639xxxxxxxxx).
 */
export function normalizeInternationalPhone(
  input: string | null | undefined,
  countryCode: string = 'PH'
): PhoneNormalizationResult {
  if (!input || typeof input !== 'string') {
    return { valid: false, reason: 'EMPTY_PHONE_NUMBER' };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { valid: false, reason: 'EMPTY_PHONE_NUMBER' };
  }

  const compact = trimmed.replace(/[\s().-]/g, '');

  // 1. Explicit E.164 international format (+...)
  if (compact.startsWith('+')) {
    const digits = compact.slice(1);
    if (!/^\d+$/.test(digits)) {
      return { valid: false, reason: 'NON_NUMERIC_DIGITS' };
    }
    if (digits.length < MIN_E164_DIGITS || digits.length > MAX_E164_DIGITS || digits.startsWith('0')) {
      return { valid: false, reason: 'INVALID_E164_LENGTH' };
    }
    return { valid: true, e164: `+${digits}` };
  }

  // 2. Domestic/national input needing country-code resolution
  const digits = compact.replace(/\D/g, '');
  if (!digits) {
    return { valid: false, reason: 'NO_DIGITS_FOUND' };
  }

  const upperCountry = countryCode.trim().toUpperCase();

  // Philippine-specific legacy handling
  if (upperCountry === 'PH') {
    if (/^09\d{9}$/.test(digits)) {
      return { valid: true, e164: `+63${digits.slice(1)}` };
    }
    if (/^9\d{9}$/.test(digits)) {
      return { valid: true, e164: `+63${digits}` };
    }
    if (/^639\d{9}$/.test(digits)) {
      return { valid: true, e164: `+${digits}` };
    }
  }

  const callingCode = COUNTRY_CALLING_CODES[upperCountry];
  if (!callingCode) {
    // If unknown country code, fail closed
    return { valid: false, reason: `UNSUPPORTED_CALLING_COUNTRY_${upperCountry}` };
  }

  // If already starts with the calling code
  if (digits.startsWith(callingCode) && digits.length >= MIN_E164_DIGITS && digits.length <= MAX_E164_DIGITS) {
    return { valid: true, e164: `+${digits}` };
  }

  // Strip leading national trunk prefix (e.g. '0' in 0812345678)
  const nationalSignificantDigits = digits.startsWith('0') ? digits.slice(1) : digits;
  const candidateE164 = `+${callingCode}${nationalSignificantDigits}`;
  const totalDigits = candidateE164.slice(1);

  if (totalDigits.length < MIN_E164_DIGITS || totalDigits.length > MAX_E164_DIGITS) {
    return { valid: false, reason: 'INVALID_DIGIT_COUNT' };
  }

  return { valid: true, e164: candidateE164 };
}

/**
 * Validates whether an input phone number can be normalized to valid E.164.
 */
export function isValidInternationalPhone(
  input: string | null | undefined,
  countryCode: string = 'PH'
): boolean {
  return normalizeInternationalPhone(input, countryCode).valid;
}

