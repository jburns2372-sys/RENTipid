/**
 * RENTipid GLOBAL-MKT / v2.0 — GM-7A Post-Transaction Snapshot Generator
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getAllAuthoritativePostTransactionProfiles,
  AUTHORITATIVE_POST_TRANSACTION_PROFILE_COUNT,
  getJurisdictionProfile,
} from '../src/lib/global-market';

interface MarketSnapshotEntry {
  readonly jurisdictionCode: string;
  readonly countryName: string;
  readonly depositPolicyStatus: string;
  readonly cancellationPolicyStatus: string;
  readonly refundPolicyStatus: string;
  readonly claimPolicyStatus: string;
  readonly disputePolicyStatus: string;
  readonly reviewPolicyStatus: string;
  readonly defaultCancellationTier: string;
  readonly defaultDepositModel: string;
  readonly providerRefundCapability: string;
  readonly providerDepositCapability: string;
  readonly payoutHoldDependency: string;
  readonly validationRequiredItems: readonly string[];
  readonly blockers: readonly string[];
  readonly commerciallyActive: boolean;
}

function generateSnapshot() {
  const profiles = getAllAuthoritativePostTransactionProfiles();
  const snapshotEntries: MarketSnapshotEntry[] = profiles.map((p) => {
    const jurProfile = getJurisdictionProfile(p.jurisdictionCode);
    const isDomesticPH = p.jurisdictionCode === 'PH';
    const isConfigured = p.validationStatus === 'CONFIGURED';

    return {
      jurisdictionCode: p.jurisdictionCode,
      countryName: p.countryName,
      depositPolicyStatus: isConfigured ? 'RESOLVED_DOMESTIC' : 'RESOLVED_CONSERVATIVE',
      cancellationPolicyStatus: isConfigured ? 'RESOLVED_DOMESTIC' : 'RESOLVED_CONSERVATIVE',
      refundPolicyStatus: isConfigured ? 'RESOLVED_DOMESTIC' : 'RESOLVED_CONSERVATIVE',
      claimPolicyStatus: isConfigured ? 'RESOLVED_DOMESTIC' : 'RESOLVED_CONSERVATIVE',
      disputePolicyStatus: isConfigured ? 'RESOLVED_DOMESTIC' : 'RESOLVED_CONSERVATIVE',
      reviewPolicyStatus: isConfigured ? 'RESOLVED_DOMESTIC' : 'RESOLVED_CONSERVATIVE',
      defaultCancellationTier: p.defaultCancellationTier,
      defaultDepositModel: p.defaultDepositModel,
      providerRefundCapability: isDomesticPH ? 'SUPPORTED_PAYMONGO_MANUAL' : 'TEST_MOCK_ONLY_UNCONFIGURED',
      providerDepositCapability: isDomesticPH ? 'PAYMENT_COLLECTED_SUPPORTED' : 'UNCONFIGURED',
      payoutHoldDependency: p.payoutHoldOnOpenClaim || p.payoutHoldOnOpenDispute ? 'MANDATORY_ON_ACTIVE_CLAIM_OR_DISPUTE' : 'NONE',
      validationRequiredItems: isDomesticPH
        ? ['LOCAL_CONSUMER_PROTECTION_ACT_RECONCILIATION']
        : [
            'LOCAL_STATUTORY_COOLING_OFF_PERIOD',
            'CROSS_BORDER_REFUND_FEE_ALLOCATION',
            'LOCAL_DEPOSIT_REGULATORY_CAPS',
          ],
      blockers: jurProfile?.knownBlockers || p.knownBlockers || [],
      commerciallyActive: false,
    };
  });

  const targetDir = path.resolve(__dirname, '../docs/governance/global-mkt-v2.0');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const jsonPath = path.join(targetDir, 'GM7A_POST_TRANSACTION_MARKET_SNAPSHOT.json');
  fs.writeFileSync(jsonPath, JSON.stringify(snapshotEntries, null, 2), 'utf-8');
  console.log(`[GENERATED] ${jsonPath}`);

  // Generate Markdown
  let mdContent = `# RENTipid GLOBAL-MKT / v2.0 — GM-7A Post-Transaction Market Snapshot
**Action:** GM-7A Global Deposits / Cancellations / Refunds / Claims / Disputes / Reviews  
**Authoritative Countries:** ${profiles.length}  
**Commercially Active Countries:** 0  
**Snapshot Timestamp:** ${new Date().toISOString()}  

---

## 1. Executive Summary
This snapshot captures the post-transaction profile state across all 46 authoritative jurisdictions recognized by RENTipid GLCC v1.2 and the Market Capability Framework. In accordance with the accelerated execution plan:
- **One Global Deposit Engine**
- **One Global Cancellation Engine**
- **One Global Refund Entitlement Engine**
- **One Global Claim Engine**
- **One Global Dispute Engine**
- **One Global Review / Reputation Engine**
- **Commercially Active Markets:** 0 (Zero false readiness).
- **China Deferred Blockers:** 2 (ICP_LICENSE_REQUIRED, PIPL_DATA_LOCALIZATION_COMPLIANCE).

---

## 2. 46-Country Post-Transaction Resolution Matrix

| # | Code | Country Name | Deposit Policy | Cancellation Policy | Refund Policy | Claim Policy | Dispute Policy | Review Policy | Provider Refund | Provider Deposit | Commercially Active |
|---|------|--------------|----------------|---------------------|---------------|--------------|----------------|---------------|-----------------|------------------|---------------------|
`;

  snapshotEntries.forEach((entry, idx) => {
    mdContent += `| ${idx + 1} | \`${entry.jurisdictionCode}\` | ${entry.countryName} | ${entry.depositPolicyStatus} | ${entry.cancellationPolicyStatus} | ${entry.refundPolicyStatus} | ${entry.claimPolicyStatus} | ${entry.disputePolicyStatus} | ${entry.reviewPolicyStatus} | ${entry.providerRefundCapability} | ${entry.providerDepositCapability} | **${entry.commerciallyActive ? 'YES' : 'NO'}** |\n`;
  });

  mdContent += `
---

## 3. Policy & Guard Invariants
1. **Separation Invariant:** \`BOOKING CANCELLED != MONEY REFUNDED\`. Cancellation transitions booking state; refund entitlement is calculated separately by \`RefundEngine\`.
2. **Authority Invariant:** \`CLAIMED AMOUNT != APPROVED FINANCIAL LIABILITY\`. Claims isolate user request from platform-adjudicated liability.
3. **Refund Authority Invariant:** Client cannot dictate authoritative refund amount. Server calculation bounds all refunds.
4. **Cumulative Over-Refund Guard:** Sum of approved refunds cannot exceed total captured amount on payment attempt.
5. **Ordinary User Adjudication Prohibition:** Ordinary users cannot adjudicate or approve their own claims or disputes.
6. **Verified Review Precondition:** Reviews can only be submitted for completed bookings by authorized participants. Provider self-reviews on own listings are strictly prohibited.
7. **Payout Hold Impact:** Active claims or disputes automatically hold provider payout.
`;

  const mdPath = path.join(targetDir, 'GM7A_POST_TRANSACTION_MARKET_SNAPSHOT.md');
  fs.writeFileSync(mdPath, mdContent, 'utf-8');
  console.log(`[GENERATED] ${mdPath}`);
}

generateSnapshot();
