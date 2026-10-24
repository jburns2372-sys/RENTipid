/**
 * RENTipid GLOBAL-MKT / v2.0 — Market Capability Framework & Activation Gate Test Suite
 *
 * Enforces all 19 mandatory criteria (A through S) specified in Section 28 of GM-1:
 *
 * A. 46 authoritative jurisdictions resolve.
 * B. No 47th invented jurisdiction appears.
 * C. All current jurisdictions are initially non-ACTIVE.
 * D. Language availability alone cannot activate a market.
 * E. Display-currency availability alone cannot activate a market.
 * F. GLCC Production availability alone cannot activate a market.
 * G. Payment READY + payout BLOCKED cannot activate.
 * H. Payment READY + payout NOT_CONFIGURED cannot activate.
 * I. KYC VALIDATION_REQUIRED prevents activation where mandatory.
 * J. Compliance BLOCKED prevents activation.
 * K. Restricted-category policy missing prevents activation if mandatory.
 * L. All mandatory capabilities READY may make activation technically eligible, but must still obey required acceptance state/owner gate.
 * M. SUSPENDED market cannot be ACTIVE.
 * N. BLOCKED market cannot be ACTIVE.
 * O. Unknown country fails closed.
 * P. Missing profile fails closed.
 * Q. China remains not commercially active.
 * R. Thailand remains not commercially active.
 * S. Philippines remains not commercially active.
 */

import {
  ALL_MARKET_CAPABILITIES,
  ALL_CAPABILITY_STATUSES,
  ALL_ACTIVATION_STATES,
  MANDATORY_MARKET_CAPABILITIES,
  OWNER_LIFECYCLE_MAPPING,
  type MarketCapability,
  type MarketCapabilityRecord,
  type JurisdictionProfile,
} from '@/lib/global-market/contracts';

import {
  evaluateJurisdictionActivation,
  canActivateJurisdiction,
  explainJurisdictionBlockers,
} from '@/lib/global-market/activation/market-activation-gate';

import {
  getJurisdictionProfile,
  getAllJurisdictionProfiles,
  getMarketCapability,
  getMarketCapabilities,
  getMarketActivationState,
  isCapabilityReady,
  getBlockingCapabilities,
  getValidationRequiredCapabilities,
  evaluateMarketActivation,
  canActivateMarket,
  explainMarketActivationBlockers,
  getAuthoritativeCountryCount,
  getCommerciallyActiveCountries,
  AUTHORITATIVE_COUNTRY_COUNT,
} from '@/lib/global-market/registry/market-capability-registry';

import { GLOBAL_COUNTRY_CATALOG } from '@/lib/glcc/country/country-registry';

describe('RENTipid GLOBAL-MKT / v2.0 — GM-1 Market Capability Framework & Activation Gate', () => {
  // Criterion A: 46 authoritative jurisdictions resolve
  test('Criterion A: exactly 46 authoritative jurisdictions resolve', () => {
    expect(AUTHORITATIVE_COUNTRY_COUNT).toBe(46);
    expect(getAuthoritativeCountryCount()).toBe(46);
    const profiles = getAllJurisdictionProfiles();
    expect(profiles.length).toBe(46);

    for (const country of GLOBAL_COUNTRY_CATALOG) {
      const profile = getJurisdictionProfile(country.code);
      expect(profile).not.toBeNull();
      expect(profile?.countryCode).toBe(country.code);
      expect(profile?.marketId).toBe(`MKT-${country.code}`);
    }
  });

  // Criterion B: No 47th invented jurisdiction appears
  test('Criterion B: no 47th invented jurisdiction appears', () => {
    const profiles = getAllJurisdictionProfiles();
    const profileCodes = profiles.map(p => p.countryCode);
    const catalogCodes = GLOBAL_COUNTRY_CATALOG.map(c => c.code);

    expect(profileCodes.sort()).toEqual(catalogCodes.sort());
    expect(profileCodes.length).toBe(46);
    expect(getJurisdictionProfile('XX')).toBeNull();
    expect(getJurisdictionProfile('ZZ')).toBeNull();
    expect(getJurisdictionProfile('FAKE')).toBeNull();
  });

  // Criterion C: All current jurisdictions are initially non-ACTIVE
  test('Criterion C: all current jurisdictions are initially non-ACTIVE', () => {
    const activeCountries = getCommerciallyActiveCountries();
    expect(activeCountries.length).toBe(0);

    const profiles = getAllJurisdictionProfiles();
    for (const profile of profiles) {
      expect(profile.activationState).not.toBe('ACTIVE');
      expect(canActivateMarket(profile.countryCode)).toBe(false);

      const evaluation = evaluateJurisdictionActivation(profile);
      expect(evaluation.isCommerciallyActive).toBe(false);
      expect(evaluation.eligibleForActivation).toBe(false);
      expect(evaluation.blockers.length).toBeGreaterThan(0);
    }
  });

  // Criterion D: Language availability alone cannot activate a market
  test('Criterion D: language availability alone cannot activate a market', () => {
    // Test on a market with full language localization (e.g., TH with th-TH, CN with zh-Hans, PH with en-PH/fil-PH)
    for (const code of ['TH', 'CN', 'PH']) {
      const profile = getJurisdictionProfile(code)!;
      expect(profile.capabilities.LOCALIZATION.status).toBe('READY');

      const evaluation = evaluateJurisdictionActivation(profile);
      expect(evaluation.isCommerciallyActive).toBe(false);
      expect(evaluation.eligibleForActivation).toBe(false);
    }

    // Synthetic profile with ONLY language ready
    const syntheticProfile: JurisdictionProfile = {
      countryCode: 'US',
      marketId: 'MKT-US',
      glccAvailable: true,
      complianceGroup: 'United States',
      operatingRegion: 'AMERICAS',
      activationState: 'FOUNDATION_READY',
      capabilities: Object.fromEntries(
        ALL_MARKET_CAPABILITIES.map(cap => [
          cap,
          {
            capability: cap,
            status: cap === 'LOCALIZATION' ? 'READY' : 'NOT_CONFIGURED',
            isMandatory: true,
          } as MarketCapabilityRecord,
        ])
      ) as Record<MarketCapability, MarketCapabilityRecord>,
      kycProfileRef: { status: 'NOT_CONFIGURED' },
      addressProfileRef: { refId: 'POL-US', status: 'NOT_CONFIGURED' },
      listingPolicyRef: { refId: 'POL-US', status: 'NOT_CONFIGURED' },
      paymentProfileRef: { status: 'NOT_CONFIGURED' },
      payoutProfileRef: { status: 'NOT_CONFIGURED' },
      taxProfileRef: { refId: 'POL-US', status: 'NOT_CONFIGURED' },
      categoryPolicyRef: { refId: 'POL-US', status: 'NOT_CONFIGURED' },
      bookingPolicyRef: { refId: 'POL-US', status: 'NOT_CONFIGURED' },
      refundDepositDisputePolicyRef: { refId: 'POL-US', status: 'NOT_CONFIGURED' },
      privacyDataPolicyRef: { refId: 'POL-US', status: 'NOT_CONFIGURED' },
      operationalRestrictions: [],
      knownBlockers: [],
      validationRequirements: [],
    };

    expect(canActivateJurisdiction(syntheticProfile)).toBe(false);
    const evalResult = evaluateJurisdictionActivation(syntheticProfile);
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(evalResult.isCommerciallyActive).toBe(false);
  });

  // Criterion E: Display-currency availability alone cannot activate a market
  test('Criterion E: display-currency availability alone cannot activate a market', () => {
    // US has USD quoting in GLCC, but pricing authority & payment collection are NOT configured
    const usProfile = getJurisdictionProfile('US')!;
    expect(usProfile.capabilities.DISPLAY_CURRENCY.status).toBe('READY');
    expect(usProfile.capabilities.PRICING.status).toBe('NOT_CONFIGURED');

    const evalResult = evaluateJurisdictionActivation(usProfile);
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(evalResult.isCommerciallyActive).toBe(false);
    expect(
      evalResult.blockers.some(b => b.code === 'DISPLAY_CURRENCY_WITHOUT_PRICING')
    ).toBe(true);
  });

  // Criterion F: GLCC Production availability alone cannot activate a market
  test('Criterion F: GLCC Production availability alone cannot activate a market', () => {
    const cnProfile = getJurisdictionProfile('CN')!;
    const thProfile = getJurisdictionProfile('TH')!;

    expect(cnProfile.glccAvailable).toBe(true);
    expect(thProfile.glccAvailable).toBe(true);

    expect(canActivateMarket('CN')).toBe(false);
    expect(canActivateMarket('TH')).toBe(false);
  });

  // Criterion G: Payment READY + payout BLOCKED cannot activate
  test('Criterion G: payment READY + payout BLOCKED cannot activate', () => {
    const baseProfile = getJurisdictionProfile('PH')!;
    const testProfile: JurisdictionProfile = {
      ...baseProfile,
      capabilities: {
        ...baseProfile.capabilities,
        PAYMENT_COLLECTION: {
          capability: 'PAYMENT_COLLECTION',
          status: 'READY',
          isMandatory: true,
        },
        PROVIDER_PAYOUT: {
          capability: 'PROVIDER_PAYOUT',
          status: 'BLOCKED',
          isMandatory: true,
          notes: 'Payout banking rail blocked by sanction or technical outage',
        },
      },
    };

    expect(canActivateJurisdiction(testProfile)).toBe(false);
    const evalResult = evaluateJurisdictionActivation(testProfile);
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(evalResult.blockers.some(b => b.code === 'PAYMENT_WITHOUT_PAYOUT')).toBe(true);
    expect(evalResult.blockers.some(b => b.code === 'CAPABILITY_BLOCKED')).toBe(true);
  });

  // Criterion H: Payment READY + payout NOT_CONFIGURED cannot activate
  test('Criterion H: payment READY + payout NOT_CONFIGURED cannot activate', () => {
    const phProfile = getJurisdictionProfile('PH')!;
    expect(phProfile.capabilities.PAYMENT_COLLECTION.status).toBe('READY');
    expect(phProfile.capabilities.PROVIDER_PAYOUT.status).toBe('NOT_CONFIGURED');

    expect(canActivateJurisdiction(phProfile)).toBe(false);
    const evalResult = evaluateJurisdictionActivation(phProfile);
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(evalResult.blockers.some(b => b.code === 'PAYMENT_WITHOUT_PAYOUT')).toBe(true);
  });

  // Criterion I: KYC VALIDATION_REQUIRED prevents activation where mandatory
  test('Criterion I: KYC VALIDATION_REQUIRED prevents activation where mandatory', () => {
    const baseProfile = getJurisdictionProfile('PH')!;
    expect(baseProfile.capabilities.KYC_VERIFICATION.status).toBe('VALIDATION_REQUIRED');

    const evalResult = evaluateJurisdictionActivation(baseProfile);
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(
      evalResult.blockers.some(
        b => b.code === 'CAPABILITY_VALIDATION_REQUIRED' && b.capability === 'KYC_VERIFICATION'
      )
    ).toBe(true);
    expect(evalResult.blockers.some(b => b.code === 'AUTH_WITHOUT_KYC')).toBe(true);
  });

  // Criterion J: Compliance BLOCKED prevents activation
  test('Criterion J: compliance BLOCKED prevents activation', () => {
    const cnProfile = getJurisdictionProfile('CN')!;
    expect(cnProfile.capabilities.COMPLIANCE.status).toBe('BLOCKED');

    const evalResult = evaluateJurisdictionActivation(cnProfile);
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(
      evalResult.blockers.some(
        b => b.code === 'CAPABILITY_BLOCKED' && b.capability === 'COMPLIANCE'
      )
    ).toBe(true);
  });

  // Criterion K: Restricted-category policy missing prevents activation if mandatory
  test('Criterion K: restricted-category policy missing prevents activation if mandatory', () => {
    const baseProfile = getJurisdictionProfile('US')!;
    expect(baseProfile.capabilities.RESTRICTED_CATEGORY_POLICY.status).not.toBe('READY');

    const evalResult = evaluateJurisdictionActivation(baseProfile);
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(
      evalResult.blockers.some(
        b => b.capability === 'RESTRICTED_CATEGORY_POLICY'
      )
    ).toBe(true);
  });

  // Criterion L: All mandatory capabilities READY may make activation technically eligible, but must still obey required acceptance state/owner gate
  test('Criterion L: all mandatory capabilities READY requires explicit owner gate to activate', () => {
    // Build a fully READY synthetic profile
    const allReadyCapabilities = Object.fromEntries(
      ALL_MARKET_CAPABILITIES.map(cap => [
        cap,
        {
          capability: cap,
          status: 'READY',
          isMandatory: true,
          notes: 'Fully verified under simulated acceptance gate',
        } as MarketCapabilityRecord,
      ])
    ) as Record<MarketCapability, MarketCapabilityRecord>;

    const syntheticReadyProfile: JurisdictionProfile = {
      countryCode: 'SG',
      marketId: 'MKT-SG',
      glccAvailable: true,
      complianceGroup: 'Singapore',
      operatingRegion: 'APAC',
      activationState: 'PRODUCTION_ACCEPTED',
      capabilities: allReadyCapabilities,
      kycProfileRef: { providerId: 'singpass', status: 'CONFIGURED' },
      addressProfileRef: { refId: 'POL-SG-ADDR', status: 'ACTIVE' },
      listingPolicyRef: { refId: 'POL-SG-LIST', status: 'ACTIVE' },
      paymentProfileRef: { providerId: 'stripe-sg', status: 'CONFIGURED' },
      payoutProfileRef: { providerId: 'paynow-sg', status: 'CONFIGURED' },
      taxProfileRef: { refId: 'POL-SG-TAX', status: 'ACTIVE' },
      categoryPolicyRef: { refId: 'POL-SG-CAT', status: 'ACTIVE' },
      bookingPolicyRef: { refId: 'POL-SG-BOOK', status: 'ACTIVE' },
      refundDepositDisputePolicyRef: { refId: 'POL-SG-REF', status: 'ACTIVE' },
      privacyDataPolicyRef: { refId: 'POL-SG-PDPA', status: 'ACTIVE' },
      operationalRestrictions: [],
      knownBlockers: [],
      validationRequirements: [],
    };

    // 1. Without Owner Gate: technically eligible, but cannot activate without owner gate
    const withoutOwner = evaluateJurisdictionActivation(syntheticReadyProfile);
    expect(withoutOwner.eligibleForActivation).toBe(true);
    expect(withoutOwner.isCommerciallyActive).toBe(false);
    expect(
      withoutOwner.blockers.some(b => b.code === 'OWNER_ACCEPTANCE_REQUIRED')
    ).toBe(true);
    expect(canActivateJurisdiction(syntheticReadyProfile)).toBe(false);

    // 2. With Owner Gate provided: can activate
    const withOwner = evaluateJurisdictionActivation(syntheticReadyProfile, {
      ownerApproved: true,
      approverName: 'Federico Diagono Jr.',
      approvalDate: '2026-10-07',
    });
    expect(withOwner.eligibleForActivation).toBe(true);
    expect(canActivateJurisdiction(syntheticReadyProfile, { ownerApproved: true })).toBe(true);

    // But isCommerciallyActive requires the profile state itself to transition to ACTIVE
    expect(withOwner.isCommerciallyActive).toBe(false);

    const activeProfile: JurisdictionProfile = {
      ...syntheticReadyProfile,
      activationState: 'ACTIVE',
    };
    const activeResult = evaluateJurisdictionActivation(activeProfile, {
      ownerApproved: true,
    });
    expect(activeResult.isCommerciallyActive).toBe(true);
  });

  // Criterion M: SUSPENDED market cannot be ACTIVE
  test('Criterion M: SUSPENDED market cannot be ACTIVE', () => {
    const allReadyCapabilities = Object.fromEntries(
      ALL_MARKET_CAPABILITIES.map(cap => [
        cap,
        { capability: cap, status: 'READY', isMandatory: true } as MarketCapabilityRecord,
      ])
    ) as Record<MarketCapability, MarketCapabilityRecord>;

    const suspendedProfile: JurisdictionProfile = {
      countryCode: 'SG',
      marketId: 'MKT-SG',
      glccAvailable: true,
      complianceGroup: 'Singapore',
      operatingRegion: 'APAC',
      activationState: 'SUSPENDED',
      capabilities: allReadyCapabilities,
      kycProfileRef: { status: 'CONFIGURED' },
      addressProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      listingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      paymentProfileRef: { status: 'CONFIGURED' },
      payoutProfileRef: { status: 'CONFIGURED' },
      taxProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      categoryPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      bookingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      refundDepositDisputePolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      privacyDataPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      operationalRestrictions: [],
      knownBlockers: [],
      validationRequirements: [],
    };

    const evalResult = evaluateJurisdictionActivation(suspendedProfile, { ownerApproved: true });
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(evalResult.isCommerciallyActive).toBe(false);
    expect(evalResult.blockers.some(b => b.code === 'STATE_SUSPENDED')).toBe(true);
    expect(canActivateJurisdiction(suspendedProfile, { ownerApproved: true })).toBe(false);
  });

  // Criterion N: BLOCKED market cannot be ACTIVE
  test('Criterion N: BLOCKED market cannot be ACTIVE', () => {
    const allReadyCapabilities = Object.fromEntries(
      ALL_MARKET_CAPABILITIES.map(cap => [
        cap,
        { capability: cap, status: 'READY', isMandatory: true } as MarketCapabilityRecord,
      ])
    ) as Record<MarketCapability, MarketCapabilityRecord>;

    const blockedProfile: JurisdictionProfile = {
      countryCode: 'SG',
      marketId: 'MKT-SG',
      glccAvailable: true,
      complianceGroup: 'Singapore',
      operatingRegion: 'APAC',
      activationState: 'BLOCKED',
      capabilities: allReadyCapabilities,
      kycProfileRef: { status: 'CONFIGURED' },
      addressProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      listingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      paymentProfileRef: { status: 'CONFIGURED' },
      payoutProfileRef: { status: 'CONFIGURED' },
      taxProfileRef: { refId: 'POL-SG', status: 'ACTIVE' },
      categoryPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      bookingPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      refundDepositDisputePolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      privacyDataPolicyRef: { refId: 'POL-SG', status: 'ACTIVE' },
      operationalRestrictions: [],
      knownBlockers: [],
      validationRequirements: [],
    };

    const evalResult = evaluateJurisdictionActivation(blockedProfile, { ownerApproved: true });
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(evalResult.isCommerciallyActive).toBe(false);
    expect(evalResult.blockers.some(b => b.code === 'STATE_BLOCKED')).toBe(true);
    expect(canActivateJurisdiction(blockedProfile, { ownerApproved: true })).toBe(false);
  });

  // Criterion O: Unknown country fails closed
  test('Criterion O: unknown country fails closed', () => {
    expect(getJurisdictionProfile('ZZ')).toBeNull();
    expect(canActivateMarket('ZZ')).toBe(false);
    expect(isCapabilityReady('ZZ', 'PAYMENT_COLLECTION')).toBe(false);
    expect(getBlockingCapabilities('ZZ')).toEqual([]);

    const evalResult = evaluateMarketActivation('ZZ');
    expect(evalResult.eligibleForActivation).toBe(false);
    expect(evalResult.isCommerciallyActive).toBe(false);
    expect(evalResult.failClosedReason).toBe('MISSING_OR_INVALID_PROFILE');
  });

  // Criterion P: Missing profile fails closed
  test('Criterion P: missing profile fails closed', () => {
    expect(canActivateJurisdiction(null)).toBe(false);
    expect(canActivateJurisdiction(undefined)).toBe(false);

    const evalNull = evaluateJurisdictionActivation(null);
    expect(evalNull.eligibleForActivation).toBe(false);
    expect(evalNull.isCommerciallyActive).toBe(false);
    expect(evalNull.failClosedReason).toBe('MISSING_OR_INVALID_PROFILE');

    const evalUndef = evaluateJurisdictionActivation(undefined);
    expect(evalUndef.eligibleForActivation).toBe(false);
    expect(evalUndef.isCommerciallyActive).toBe(false);
    expect(evalUndef.failClosedReason).toBe('MISSING_OR_INVALID_PROFILE');
  });

  // Criterion Q: China remains not commercially active
  test('Criterion Q: China remains not commercially active', () => {
    const cnProfile = getJurisdictionProfile('CN')!;
    expect(cnProfile).not.toBeNull();
    expect(cnProfile.glccAvailable).toBe(true);
    expect(cnProfile.activationState).toBe('FOUNDATION_READY');
    expect(canActivateMarket('CN')).toBe(false);

    const evalResult = evaluateJurisdictionActivation(cnProfile);
    expect(evalResult.isCommerciallyActive).toBe(false);
    expect(evalResult.eligibleForActivation).toBe(false);

    // Must carry forward exact two China deferred blockers
    expect(cnProfile.knownBlockers).toContain(
      'CN-BLK-001: ICP Filing / Commercial Telecommunications License Requirement (MIIT)'
    );
    expect(cnProfile.knownBlockers).toContain(
      'CN-BLK-002: Cross-Border Data Transfer / CAC Security Assessment Requirement'
    );
    expect(cnProfile.operationalRestrictions).toContain(
      'MAINLAND_CHINA_PUBLIC_NETWORK_OPERABILITY_NOT_CLAIMED'
    );
  });

  // Criterion R: Thailand remains not commercially active
  test('Criterion R: Thailand remains not commercially active', () => {
    const thProfile = getJurisdictionProfile('TH')!;
    expect(thProfile).not.toBeNull();
    expect(thProfile.glccAvailable).toBe(true);
    expect(thProfile.activationState).toBe('FOUNDATION_READY');
    expect(canActivateMarket('TH')).toBe(false);

    const evalResult = evaluateJurisdictionActivation(thProfile);
    expect(evalResult.isCommerciallyActive).toBe(false);
    expect(evalResult.eligibleForActivation).toBe(false);

    expect(thProfile.capabilities.PAYMENT_COLLECTION.status).toBe('NOT_CONFIGURED');
    expect(thProfile.capabilities.PROVIDER_PAYOUT.status).toBe('NOT_CONFIGURED');
    expect(thProfile.knownBlockers).toContain(
      'TH-BLK-001: Domestic payment gateway adapter not configured'
    );
    expect(thProfile.knownBlockers).toContain(
      'TH-BLK-002: Automated domestic payout rail not configured'
    );
  });

  // Criterion S: Philippines remains not commercially active
  test('Criterion S: Philippines remains not commercially active', () => {
    const phProfile = getJurisdictionProfile('PH')!;
    expect(phProfile).not.toBeNull();
    expect(phProfile.activationState).not.toBe('ACTIVE');
    expect(canActivateMarket('PH')).toBe(false);

    const evalResult = evaluateJurisdictionActivation(phProfile);
    expect(evalResult.isCommerciallyActive).toBe(false);
    expect(evalResult.eligibleForActivation).toBe(false);

    // PH has unconfigured provider payout rail and validation-required KYC
    expect(phProfile.capabilities.PROVIDER_PAYOUT.status).toBe('NOT_CONFIGURED');
    expect(phProfile.capabilities.KYC_VERIFICATION.status).toBe('VALIDATION_REQUIRED');
    expect(phProfile.knownBlockers).toContain(
      'PH-BLK-001: Automated domestic provider payout rail integration required for GLOBAL-MKT v2.0'
    );
  });

  // Additional Architectural Invariant Tests
  test('Architectural Invariant: 24 capabilities and 13-lifecycle mapping', () => {
    expect(ALL_MARKET_CAPABILITIES.length).toBe(24);
    expect(MANDATORY_MARKET_CAPABILITIES.length).toBe(24);
    expect(ALL_CAPABILITY_STATUSES.length).toBe(7);
    expect(ALL_ACTIVATION_STATES.length).toBe(14);

    // Every capability in ALL_MARKET_CAPABILITIES is mapped in OWNER_LIFECYCLE_MAPPING
    const allMappedCaps = new Set(
      Object.values(OWNER_LIFECYCLE_MAPPING).flatMap(caps => [...caps])
    );
    for (const cap of ALL_MARKET_CAPABILITIES) {
      expect(allMappedCaps.has(cap)).toBe(true);
    }
  });

  test('Security Invariant: client inputs cannot falsely activate market', () => {
    // Malformed/injected country codes
    const injectionCodes = [
      'PH; DROP TABLE users;',
      '<script>alert(1)</script>',
      'PH?active=true',
      'PH&admin=1',
      '../PH',
      'ACTIVE',
    ];
    for (const badCode of injectionCodes) {
      expect(canActivateMarket(badCode)).toBe(false);
      expect(getJurisdictionProfile(badCode)).toBeNull();
    }
  });
});
