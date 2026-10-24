/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 Governance Artifacts Generator
 *
 * Generates the authoritative 46-country gap-closure governance artifacts:
 * 1. GM9A_C1_46_COUNTRY_FULL_FUNCTION_MATRIX.json & .md
 * 2. GM9A_C1_46_COUNTRY_PROVIDER_GAP_MATRIX.json & .md
 * 3. GM9A_C1_46_COUNTRY_LEGAL_COMPLIANCE_GAP_MATRIX.json & .md
 * 4. GM9A_C1_GLOBAL_MARKET_ACTIVATION_BATCH_PLAN.json & .md
 * 5. GM9A_C1_OWNER_EXTERNAL_ACTION_REGISTER.json & .md
 */

import * as fs from 'fs';
import * as path from 'path';
import { GLOBAL_COUNTRY_CATALOG } from '../src/lib/glcc/country/country-registry';
import { getAllMarketReadinessProfiles } from '../src/lib/global-market/compliance/registry/market-readiness-resolver';
import { getAllAuthoritativeComplianceProfiles } from '../src/lib/global-market/compliance/registry/jurisdiction-compliance-registry';
import { getAllAuthoritativeTaxProfiles } from '../src/lib/global-market/compliance/registry/jurisdiction-tax-registry';
import { getAllAuthoritativeProviderMappings } from '../src/lib/global-market/compliance/registry/provider-capability-registry';

const GOV_DIR = path.resolve(__dirname, '../docs/governance/global-mkt-v2.0');

export function generateAllGm9aC1Artifacts() {
  if (!fs.existsSync(GOV_DIR)) {
    fs.mkdirSync(GOV_DIR, { recursive: true });
  }

  const readinessProfiles = getAllMarketReadinessProfiles();
  const complianceProfiles = getAllAuthoritativeComplianceProfiles();
  const taxProfiles = getAllAuthoritativeTaxProfiles();
  const providerMappings = getAllAuthoritativeProviderMappings();

  console.log(`Generating GM-9A-C1 artifacts for ${readinessProfiles.length} authoritative jurisdictions...`);

  // ==========================================
  // 1. FULL FUNCTION MATRIX
  // ==========================================
  const fullFunctionMatrix = readinessProfiles.map((p) => {
    const isPH = p.jurisdictionCode === 'PH';
    const comp = complianceProfiles.find((c) => c.jurisdictionCode === p.jurisdictionCode);
    const tax = taxProfiles.find((t) => t.jurisdictionCode === p.jurisdictionCode);
    const country = GLOBAL_COUNTRY_CATALOG.find((c) => c.code === p.jurisdictionCode);

    return {
      countryCode: p.jurisdictionCode,
      countryName: p.countryName,
      account: p.accountReady,
      renter: p.renterReady,
      provider: p.providerReady,
      KYC: p.kycReady,
      businessVerification: p.businessVerificationReady,
      address: p.addressReady,
      listingCreate: p.listingCreateReady,
      listingPublish: p.listingPublishReady,
      search: p.searchDiscoveryReady,
      internationalDiscovery: p.internationalDiscoveryReady,
      messaging: p.messagingReady,
      booking: p.bookingReady,
      payment: p.paymentReady,
      payout: p.payoutReady,
      deposit: p.depositReady,
      cancellation: p.cancellationReady,
      refund: p.refundReady,
      claim: p.claimReady,
      dispute: p.disputeReady,
      review: p.reviewReady,
      tax: p.taxReady,
      invoice: p.invoiceReady,
      categoryPolicy: p.categoryPolicyReady,
      compliance: p.complianceReady,
      transactionCurrency: isPH ? 'PHP' : country?.defaultDisplayCurrency || 'USD',
      settlementCurrency: isPH ? 'PHP' : country?.defaultDisplayCurrency || 'USD',
      localAccepted: isPH,
      previewAccepted: false,
      productionAccepted: false,
      fullyActive: false,
      requiresGapClosure: p.requiresGapClosure,
      remainingBlockers: p.blockers.map((b) => b.code),
      blockerTypes: Array.from(new Set(p.blockers.map((b) => b.blockerType || 'TECHNICAL_VALIDATION'))),
      ownerDecisionRequired: !isPH,
      externalVendorRequired: !isPH,
    };
  });

  fs.writeFileSync(
    path.join(GOV_DIR, 'GM9A_C1_46_COUNTRY_FULL_FUNCTION_MATRIX.json'),
    JSON.stringify(fullFunctionMatrix, null, 2)
  );

  let fullFuncMd = `# RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 46-Country Full-Function Matrix\n\n`;
  fullFuncMd += `| Country | Code | Account | Listing | Search | Messaging | KYC | Booking | Payment | Payout | Tax/Inv | Local Accepted | Gap Closure Required |\n`;
  fullFuncMd += `|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;
  for (const m of fullFunctionMatrix) {
    fullFuncMd += `| ${m.countryName} | \`${m.countryCode}\` | ${m.account ? '✅' : '❌'} | ${m.listingPublish ? '✅' : '❌'} | ${m.search ? '✅' : '❌'} | ${m.messaging ? '✅' : '❌'} | ${m.KYC ? '✅' : '⚠️'} | ${m.booking ? '✅' : '⏳'} | ${m.payment ? '✅' : '⏳'} | ${m.payout ? '✅' : '⏳'} | ${m.tax ? '✅' : '⏳'} | ${m.localAccepted ? '✅ PASS' : '⏳ PENDING'} | ${m.requiresGapClosure ? 'YES' : 'NO (Accepted)'} |\n`;
  }
  fs.writeFileSync(path.join(GOV_DIR, 'GM9A_C1_46_COUNTRY_FULL_FUNCTION_MATRIX.md'), fullFuncMd);

  // ==========================================
  // 2. PROVIDER GAP MATRIX
  // ==========================================
  const providerGapMatrix = readinessProfiles.map((p) => {
    const isPH = p.jurisdictionCode === 'PH';
    const isTH = p.jurisdictionCode === 'TH';
    const isCN = p.jurisdictionCode === 'CN';

    return {
      countryCode: p.jurisdictionCode,
      countryName: p.countryName,
      kycProvider: {
        currentStatus: isPH ? 'MANUAL_INTERNAL (READY)' : 'NOT_CONFIGURED',
        candidateResolution: isPH ? 'Internal compliance verification' : 'Global KYC Vendor (e.g. Veriff, Sumsub, Stripe Identity)',
        sandboxRequirement: isPH ? 'N/A' : 'API sandbox credentials',
        productionRequirement: isPH ? 'Standard operating procedure' : 'Enterprise verification contract',
        commercialAgreementRequirement: isPH ? 'None' : 'Required',
        externalDependency: isPH ? 'None' : 'KYC vendor selection by Project Owner',
      },
      paymentProvider: {
        currentStatus: isPH ? 'paymongo_global (VERIFIED)' : 'NOT_CONFIGURED',
        candidateResolution: isPH ? 'PayMongo Domestic Rails' : isTH ? 'PromptPay / Stripe APAC / 2C2P' : isCN ? 'WeChat Pay / Alipay' : 'Stripe / Adyen Global Gateway',
        supportedPaymentMethods: isPH ? ['GCash', 'Maya', 'Cards', 'Direct Bank'] : isTH ? ['PromptPay', 'Cards'] : isCN ? ['Alipay', 'WeChat Pay'] : ['Cards', 'Local Direct Debit', 'Wallets'],
        transactionCurrencies: isPH ? ['PHP'] : isTH ? ['THB'] : isCN ? ['CNY'] : ['EUR', 'USD', 'GBP', 'Local'],
        sandboxAvailability: isPH ? 'ACTIVE' : 'Pending vendor onboarding',
        productionRequirement: isPH ? 'Verified' : 'Production acquiring account',
        refundCapability: isPH ? 'Supported' : 'Standard API refund rail',
        webhookCapability: isPH ? 'Verified' : 'Signed webhook listener',
        reconciliationCapability: isPH ? 'Verified' : 'Authoritative settlement ledger',
        evidenceStatus: isPH ? 'VERIFIED' : 'GAP_IDENTIFIED',
      },
      payoutProvider: {
        currentStatus: isPH ? 'Manual batch payout (READY)' : 'NOT_CONFIGURED',
        candidateResolution: isPH ? 'Automated PayMongo / Direct Bank Rail' : isTH ? 'Local Thai Bank Disbursement / PromptPay' : isCN ? 'Domestic China Settlement' : 'Stripe Connect / Wise / Local Rails',
        payoutMethods: isPH ? ['PESONet', 'InstaPay'] : ['Local Bank Direct', 'SEPA', 'ACH'],
        settlementCurrency: isPH ? 'PHP' : isTH ? 'THB' : isCN ? 'CNY' : 'Local Currency',
        sandboxRequirement: isPH ? 'Mocked in GM-6A' : 'Sandbox disbursement API',
        productionRequirement: isPH ? 'Automated rail integration' : 'Licensed disbursement entity',
        commercialAgreementRequirement: isPH ? 'Existing' : 'Required',
      },
      geocodingProvider: {
        currentStatus: isPH ? 'PSGC Domestic Hierarchy (VERIFIED)' : 'NOT_CONFIGURED (Haversine active)',
        candidateResolution: 'Google Maps / Mapbox / OpenStreetMap Nominatim',
      },
      notificationProvider: {
        currentStatus: 'Core In-App Notification Engine (VERIFIED)',
        candidateResolution: 'Twilio SMS / SendGrid Email / FCM Push',
      },
      taxProvider: {
        currentStatus: isPH ? 'Domestic 12% VAT Engine (VERIFIED)' : 'NOT_CONFIGURED (Suppressed)',
        candidateResolution: isPH ? 'BIR CAS Integration' : 'Stripe Tax / Avalara / TaxJar',
      },
    };
  });

  fs.writeFileSync(
    path.join(GOV_DIR, 'GM9A_C1_46_COUNTRY_PROVIDER_GAP_MATRIX.json'),
    JSON.stringify(providerGapMatrix, null, 2)
  );

  let provGapMd = `# RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 46-Country Provider Gap Matrix\n\n`;
  provGapMd += `| Country | Code | Payment Provider Status | Candidate Payment | Payout Status | Candidate Payout | KYC Status | External Dependency |\n`;
  provGapMd += `|---|---|---|---|---|---|---|---|\n`;
  for (const m of providerGapMatrix) {
    provGapMd += `| ${m.countryName} | \`${m.countryCode}\` | ${m.paymentProvider.currentStatus} | ${m.paymentProvider.candidateResolution} | ${m.payoutProvider.currentStatus} | ${m.payoutProvider.candidateResolution} | ${m.kycProvider.currentStatus} | ${m.kycProvider.externalDependency} |\n`;
  }
  fs.writeFileSync(path.join(GOV_DIR, 'GM9A_C1_46_COUNTRY_PROVIDER_GAP_MATRIX.md'), provGapMd);

  // ==========================================
  // 3. LEGAL / COMPLIANCE GAP MATRIX
  // ==========================================
  const legalComplianceMatrix = readinessProfiles.map((p) => {
    const comp = complianceProfiles.find((c) => c.jurisdictionCode === p.jurisdictionCode);
    const isPH = p.jurisdictionCode === 'PH';
    const isCN = p.jurisdictionCode === 'CN';
    const isTH = p.jurisdictionCode === 'TH';

    return {
      countryCode: p.jurisdictionCode,
      countryName: p.countryName,
      marketplaceOperation: comp?.rentalMarketplaceStatus || 'RESTRICTED',
      consumerProtection: comp?.consumerProtectionStatus || 'VALIDATION_REQUIRED',
      privacyData: isCN ? 'PIPL (LOCALIZATION MANDATORY)' : isTH ? 'PDPA (VALIDATION REQUIRED)' : comp?.privacyDataProtectionStatus || 'VALIDATION_REQUIRED',
      KYC: comp?.identityKycStatus || 'VALIDATION_REQUIRED',
      payment: comp?.paymentRegulatoryStatus || 'VALIDATION_REQUIRED',
      payout: comp?.payoutRegulatoryStatus || 'VALIDATION_REQUIRED',
      tax: comp?.taxStatus || 'VALIDATION_REQUIRED',
      invoice: comp?.invoiceStatus || 'VALIDATION_REQUIRED',
      categories: comp?.categoryPolicyStatus || 'VALIDATION_REQUIRED',
      crossBorder: comp?.crossBorderStatus || 'RESTRICTED',
      networkDataResidency: isCN ? 'Mainland In-Country Residency Required' : 'Standard AWS/Vercel Cloud Tier',
      humanLegalReviewRequirements: isPH
        ? ['BIR Withholding Tax Opinion on Marketplace Operators']
        : isCN
        ? [
            'MIIT Commercial ICP License joint venture evaluation',
            'CAC PIPL Cross-Border Data Transfer compliance assessment',
          ]
        : isTH
        ? [
            'Thai Department of Business Development (DBD) E-Commerce Registration',
            'PDPA cross-border processing review',
          ]
        : [
            `Statutory consumer protection & rental liability opinion for ${p.countryName}`,
            `Digital marketplace tax reporting reconciliation (e.g. DAC7 for EU, 1099-K for US)`,
          ],
    };
  });

  fs.writeFileSync(
    path.join(GOV_DIR, 'GM9A_C1_46_COUNTRY_LEGAL_COMPLIANCE_GAP_MATRIX.json'),
    JSON.stringify(legalComplianceMatrix, null, 2)
  );

  let legalMd = `# RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 46-Country Legal & Compliance Gap Matrix\n\n`;
  legalMd += `| Country | Code | Consumer Protection | Privacy / Data | Tax Regime | Human Legal Review Requirements |\n`;
  legalMd += `|---|---|---|---|---|---|\n`;
  for (const m of legalComplianceMatrix) {
    legalMd += `| ${m.countryName} | \`${m.countryCode}\` | ${m.consumerProtection} | ${m.privacyData} | ${m.tax} | ${m.humanLegalReviewRequirements.join('; ')} |\n`;
  }
  fs.writeFileSync(path.join(GOV_DIR, 'GM9A_C1_46_COUNTRY_LEGAL_COMPLIANCE_GAP_MATRIX.md'), legalMd);

  // ==========================================
  // 4. GLOBAL ACTIVATION BATCH PLAN
  // ==========================================
  const batchPlan = {
    workstream: 'RENTipid GLOBAL-MKT / v2.0 — Global Marketplace Activation',
    objective: 'Full End-to-End Operation across ALL 46 Authoritative Jurisdictions',
    controllingRule: 'NO country is permanently listing-only or permanently excluded. All batches advance to full transaction operation.',
    totalAuthoritativeCountries: 46,
    batches: [
      {
        batchId: 'BATCH_1',
        title: 'Batch 1: Domestic Core (Philippines)',
        jurisdictionCount: 1,
        jurisdictions: ['PH'],
        currentStatus: 'LOCAL_ACCEPTED (PASS)',
        sharedBlockers: [
          'AUTOMATED_PAYOUT_RAIL_MISSING',
          'LOCAL_TAX_CLEARANCE_REQUIRED',
        ],
        providerDependencies: ['PayMongo Global Integration', 'Automated Direct Bank Payout Rail'],
        legalDependencies: ['BIR Internet Transactions Act Review'],
        codeWork: 'Automated payout webhook listener and disbursement reconciliation',
        externalActions: ['Verify PayMongo production disbursement sub-account'],
        localAcceptanceRequirement: 'COMPLETED (GM-9A PASS)',
        previewRequirement: 'GM-10A Preview Acceptance',
        productionRequirement: 'GM-11A Production Activation',
      },
      {
        batchId: 'BATCH_2',
        title: 'Batch 2: Southeast Asia Regional Expansion',
        jurisdictionCount: 5,
        jurisdictions: ['TH', 'SG', 'MY', 'VN', 'ID'],
        currentStatus: 'GAP_CLOSURE_REQUIRED',
        sharedBlockers: [
          'REGIONAL_APAC_PAYMENT_GATEWAY_MISSING',
          'LOCAL_CURRENCY_PAYOUT_RAILS_MISSING',
          'REGIONAL_CONSUMER_PROTECTION_REVIEW',
        ],
        providerDependencies: ['Stripe APAC / 2C2P / Adyen', 'Wise Platform / Local Bank Direct'],
        legalDependencies: ['Thai DBD registration, Singapore MAS exemption review, Malaysian MDEC review'],
        codeWork: 'Adapter for APAC multi-currency acquiring (THB, SGD, MYR, VND, IDR) & PromptPay/PayNow QR rails',
        externalActions: ['Project Owner selection of APAC payment/payout vendor and merchant agreement execution'],
        localAcceptanceRequirement: 'GM-9A-B2 Local Acceptance',
        previewRequirement: 'GM-10A-B2 Preview Acceptance',
        productionRequirement: 'GM-11A-B2 Production Activation',
      },
      {
        batchId: 'BATCH_3',
        title: 'Batch 3: Anglo-American & Developed APAC',
        jurisdictionCount: 6,
        jurisdictions: ['US', 'GB', 'CA', 'AU', 'JP', 'KR'],
        currentStatus: 'GAP_CLOSURE_REQUIRED',
        sharedBlockers: [
          'INTERNATIONAL_CREDIT_CARD_GATEWAY_MISSING',
          'CROSS_BORDER_DISBURSEMENT_RAILS_MISSING',
          'SUB_NATIONAL_TAX_COMPLIANCE_REQUIRED',
        ],
        providerDependencies: ['Stripe Global / Adyen', 'Stripe Connect / Wise'],
        legalDependencies: ['US state sales tax nexus review, UK Consumer Rights Act, Australian Consumer Law'],
        codeWork: 'Multi-currency settlement engine for USD, GBP, CAD, AUD, JPY, KRW and automated 1099-K reporting hooks',
        externalActions: ['Stripe Global merchant underwriting and API credential provisioning'],
        localAcceptanceRequirement: 'GM-9A-B3 Local Acceptance',
        previewRequirement: 'GM-10A-B3 Preview Acceptance',
        productionRequirement: 'GM-11A-B3 Production Activation',
      },
      {
        batchId: 'BATCH_4',
        title: 'Batch 4: European Union / EEA Single Market',
        jurisdictionCount: 30,
        jurisdictions: [
          'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK',
          'NO', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'BG', 'HR',
          'SK', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT', 'IS', 'LI',
        ],
        currentStatus: 'GAP_CLOSURE_REQUIRED',
        sharedBlockers: [
          'EUR_SEPA_ACQUIRING_AND_DISBURSEMENT_MISSING',
          'DAC7_DIGITAL_PLATFORM_REPORTING_INTEGRATION',
          'GDPR_CROSS_BORDER_PROCESSING_REVIEW',
        ],
        providerDependencies: ['Stripe Europe (SEPA Direct Debit / iDEAL / Bancontact / Klarna)', 'SEPA Instant Payout Rail'],
        legalDependencies: ['DAC7 EU tax reporting compliance, GDPR legal representative appointment'],
        codeWork: 'Unified SEPA payment & payout adapter, EUR minor unit calculations, DAC7 annual reporting schema',
        externalActions: ['EU merchant account registration and DAC7 platform reporting configuration'],
        localAcceptanceRequirement: 'GM-9A-B4 Local Acceptance',
        previewRequirement: 'GM-10A-B4 Preview Acceptance',
        productionRequirement: 'GM-11A-B4 Production Activation',
      },
      {
        batchId: 'BATCH_5',
        title: 'Batch 5: Emerging Major Markets (LATAM, Middle East & South Asia)',
        jurisdictionCount: 3,
        jurisdictions: ['BR', 'AE', 'IN'],
        currentStatus: 'GAP_CLOSURE_REQUIRED',
        sharedBlockers: [
          'LOCAL_DOMESTIC_PAYMENT_METHODS_MISSING',
          'CROSS_BORDER_EXCHANGE_CONTROLS',
        ],
        providerDependencies: ['Local payment adapters (Brazil Pix, UAE Cards/Wallets, India UPI/Razorpay)'],
        legalDependencies: ['Brazil LGPD, UAE Central Bank Stored Value Facility, India RBI Cross-Border Master Direction'],
        codeWork: 'Pix instant payment adapter (BRL), AED direct acquiring, UPI integration (INR)',
        externalActions: ['In-country merchant entity or cross-border payment merchant agreement'],
        localAcceptanceRequirement: 'GM-9A-B5 Local Acceptance',
        previewRequirement: 'GM-10A-B5 Preview Acceptance',
        productionRequirement: 'GM-11A-B5 Production Activation',
      },
      {
        batchId: 'BATCH_6',
        title: 'Batch 6: Mainland China Special Regulatory Market',
        jurisdictionCount: 1,
        jurisdictions: ['CN'],
        currentStatus: 'GAP_CLOSURE_REQUIRED (2 DEFERRED BLOCKERS)',
        sharedBlockers: [
          'ICP_LICENSE_REQUIRED',
          'PIPL_DATA_LOCALIZATION_COMPLIANCE',
          'MAINLAND_CHINA_WECHAT_ALIPAY_ACQUIRING',
        ],
        providerDependencies: ['WeChat Pay / Alipay Cross-Border / In-Country Gateway'],
        legalDependencies: ['MIIT ICP commercial telecom license, CAC personal information localization compliance'],
        codeWork: 'Alipay/WeChat Pay QR scanner, CNY minor unit settlement, dedicated data isolation partition',
        externalActions: [
          'Commercial partner joint venture in mainland China for ICP application',
          'CAC data transfer filing and server localization setup',
        ],
        localAcceptanceRequirement: 'GM-9A-B6 Local Acceptance',
        previewRequirement: 'GM-10A-B6 Preview Acceptance',
        productionRequirement: 'GM-11A-B6 Production Activation',
      },
    ],
  };

  fs.writeFileSync(
    path.join(GOV_DIR, 'GM9A_C1_GLOBAL_MARKET_ACTIVATION_BATCH_PLAN.json'),
    JSON.stringify(batchPlan, null, 2)
  );

  let batchMd = `# RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 Global Market Activation Batch Plan\n\n`;
  batchMd += `**Controlling Objective:** ONE global platform supporting full end-to-end rental operation across ALL 46 authoritative jurisdictions.\n\n`;
  for (const b of batchPlan.batches) {
    batchMd += `### ${b.title}\n`;
    batchMd += `- **Jurisdictions (${b.jurisdictionCount}):** \`${b.jurisdictions.join('`, `')}\`\n`;
    batchMd += `- **Current Status:** ${b.currentStatus}\n`;
    batchMd += `- **Shared Blockers:** ${b.sharedBlockers.join(', ')}\n`;
    batchMd += `- **Provider Dependencies:** ${b.providerDependencies.join('; ')}\n`;
    batchMd += `- **Legal Dependencies:** ${b.legalDependencies.join('; ')}\n`;
    batchMd += `- **Required Code Work:** ${b.codeWork}\n`;
    batchMd += `- **Owner / External Action Required:** ${b.externalActions.join('; ')}\n`;
    batchMd += `- **Promotion Milestones:** Local (${b.localAcceptanceRequirement}) ➔ Preview (${b.previewRequirement}) ➔ Production (${b.productionRequirement})\n\n`;
  }
  fs.writeFileSync(path.join(GOV_DIR, 'GM9A_C1_GLOBAL_MARKET_ACTIVATION_BATCH_PLAN.md'), batchMd);

  // ==========================================
  // 5. OWNER / EXTERNAL ACTION REGISTER
  // ==========================================
  const externalActions = [
    {
      actionId: 'ACT-001',
      title: 'Global Multi-Currency Payment Gateway Vendor Selection & Contracting',
      affectedCountries: [
        'US', 'GB', 'CA', 'AU', 'JP', 'KR', 'DE', 'FR', 'IT', 'ES',
        'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'NO', 'FI', 'IE', 'PT',
        'GR', 'CZ', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV',
        'EE', 'CY', 'LU', 'MT', 'IS', 'LI', 'SG', 'MY', 'VN', 'ID',
      ],
      affectedCapability: 'PAYMENT_COLLECTION',
      actionRequired: 'Select and execute commercial acquiring agreement with global payment provider (Stripe / Adyen / 2C2P) supporting international credit cards and European/Asian local payment methods.',
      whyAutonomousAgentCannotComplete: 'Requires corporate legal signature, corporate bank account linkage, and commercial liability commitment.',
      blockingStage: 'GM-9A-B2 through GM-9A-B4 Local & Preview Acceptance',
    },
    {
      actionId: 'ACT-002',
      title: 'International Provider Payout Rail Selection & Account Onboarding',
      affectedCountries: [
        'US', 'GB', 'CA', 'AU', 'JP', 'KR', 'DE', 'FR', 'IT', 'ES',
        'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'NO', 'FI', 'IE', 'PT',
        'GR', 'CZ', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV',
        'EE', 'CY', 'LU', 'MT', 'IS', 'LI', 'TH', 'SG', 'MY', 'VN',
        'ID', 'BR', 'AE', 'IN',
      ],
      affectedCapability: 'PROVIDER_PAYOUT',
      actionRequired: 'Establish enterprise disbursement account (e.g. Stripe Connect, Wise Platform, or regional bank disbursement partners) for automated provider settlements.',
      whyAutonomousAgentCannotComplete: 'Requires corporate banking verification, regulatory anti-money laundering (AML) onboarding, and treasury deposit authorization.',
      blockingStage: 'GM-9A-B2 through GM-9A-B5 Payout Automation',
    },
    {
      actionId: 'ACT-003',
      title: 'Automated Global Identity / KYC Vendor Contracting',
      affectedCountries: [
        'US', 'GB', 'CA', 'AU', 'JP', 'KR', 'DE', 'FR', 'IT', 'ES',
        'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'NO', 'FI', 'IE', 'PT',
        'GR', 'CZ', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV',
        'EE', 'CY', 'LU', 'MT', 'IS', 'LI', 'TH', 'SG', 'MY', 'VN',
        'ID', 'BR', 'AE', 'IN', 'CN',
      ],
      affectedCapability: 'KYC_VERIFICATION',
      actionRequired: 'Contract an automated international identity verification service (e.g. Veriff, Sumsub, Stripe Identity) for optical document verification and facial biometric liveness checks across 46 countries.',
      whyAutonomousAgentCannotComplete: 'Requires vendor agreement, billing contract, and data privacy processing agreement (DPA).',
      blockingStage: 'GM-9A-B2 through GM-9A-B6 Provider Automated KYC',
    },
    {
      actionId: 'ACT-004',
      title: 'European Union DAC7 and Digital Platform Tax Governance Sign-Off',
      affectedCountries: [
        'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK',
        'NO', 'FI', 'IE', 'PT', 'GR', 'CZ', 'RO', 'HU', 'BG', 'HR',
        'SK', 'SI', 'LT', 'LV', 'EE', 'CY', 'LU', 'MT', 'IS', 'LI',
      ],
      affectedCapability: 'TAX_INVOICE',
      actionRequired: 'Obtain European tax counsel opinion on DAC7 annual platform reporting requirements, VAT liability on platform commission, and appointing an EU fiscal representative.',
      whyAutonomousAgentCannotComplete: 'Statutory compliance sign-off requires qualified legal counsel or licensed tax advisor.',
      blockingStage: 'GM-9A-B4 Production Activation',
    },
    {
      actionId: 'ACT-005',
      title: 'Thailand DBD E-Commerce Business Registration Filing',
      affectedCountries: ['TH'],
      affectedCapability: 'MARKETPLACE_LICENSING',
      actionRequired: 'Submit e-commerce registration under Thai Department of Business Development (DBD) for online rental marketplace operations.',
      whyAutonomousAgentCannotComplete: 'Requires corporate government filing with the Thai Ministry of Commerce.',
      blockingStage: 'GM-9A-B2 Production Activation',
    },
    {
      actionId: 'ACT-006',
      title: 'China In-Country Partnership & Commercial MIIT ICP License Application',
      affectedCountries: ['CN'],
      affectedCapability: 'MARKETPLACE_LICENSING',
      actionRequired: 'Engage domestic China joint venture entity or operating partner to apply for commercial telecommunications service license (ICP) and CAC data transfer assessment.',
      whyAutonomousAgentCannotComplete: 'Chinese telecom law strictly limits ICP commercial licensing to qualifying domestic entities.',
      blockingStage: 'GM-9A-B6 Production Activation',
    },
  ];

  fs.writeFileSync(
    path.join(GOV_DIR, 'GM9A_C1_OWNER_EXTERNAL_ACTION_REGISTER.json'),
    JSON.stringify(externalActions, null, 2)
  );

  let ownerMd = `# RENTipid GLOBAL-MKT / v2.0 — GM-9A-C1 Project Owner & External Action Register\n\n`;
  ownerMd += `This register records only real-world actions requiring Project Owner authorization, commercial vendor contracts, legal counsel reviews, or government filings.\n\n`;
  ownerMd += `| Action ID | Title | Affected Countries | Capability | Action Required | Why External / Owner Action Required | Blocking Stage |\n`;
  ownerMd += `|---|---|---|---|---|---|---|\n`;
  for (const a of externalActions) {
    ownerMd += `| **${a.actionId}** | ${a.title} | ${a.affectedCountries.length} jurisdictions | \`${a.affectedCapability}\` | ${a.actionRequired} | ${a.whyAutonomousAgentCannotComplete} | ${a.blockingStage} |\n`;
  }
  fs.writeFileSync(path.join(GOV_DIR, 'GM9A_C1_OWNER_EXTERNAL_ACTION_REGISTER.md'), ownerMd);

  console.log('Successfully generated all 10 GM-9A-C1 governance artifacts!');
}

if (require.main === module || process.argv[1]?.endsWith('generate-gm9a-c1-governance.ts')) {
  generateAllGm9aC1Artifacts();
}
