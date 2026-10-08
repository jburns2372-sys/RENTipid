import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SumsubKycProviderAdapter } from '../../src/lib/global-market/trust/adapters/sumsub-kyc-adapter';
import { getKycProviderAdapter,registerKycProviderAdapter,resolveJurisdictionKycAdapter } from '../../src/lib/global-market/trust/adapters/external-provider-stubs';
import { getJurisdictionKycProfile,getAuthoritativeKycProfileCount } from '../../src/lib/global-market/trust/registry/jurisdiction-kyc-registry';
import { resolveJurisdictionPaymentProfile,AUTHORITATIVE_PAYMENT_PROFILE_COUNT } from '../../src/lib/global-market/financial/registry/jurisdiction-payment-registry';
import { resolveJurisdictionPayoutProfile,AUTHORITATIVE_PAYOUT_PROFILE_COUNT } from '../../src/lib/global-market/financial/registry/jurisdiction-payout-registry';
import { financialProviderRegistry } from '../../src/lib/global-market/financial/registry/payment-provider-registry';
import { XenditPaymentProviderAdapter } from '../../src/lib/global-market/financial/adapters/xendit-payment-adapter';
import { XenditPayoutProviderAdapter } from '../../src/lib/global-market/financial/adapters/xendit-payout-adapter';
import { PROVIDER_ENVIRONMENT_STATUSES } from '../../src/lib/global-market/trust/contracts/provider-environment-status';
import { kycConfig } from './fixtures/sumsub-kyc-data';
test('shared five-country provider resolution is explicit and preserves the 46-country denominator',() => {
  assert.equal(getAuthoritativeKycProfileCount(),46); assert.equal(AUTHORITATIVE_PAYMENT_PROFILE_COUNT,46); assert.equal(AUTHORITATIVE_PAYOUT_PROFILE_COUNT,46);
  // Explicitly absent credentials prevent dependence on a developer machine environment.
  const missing = new SumsubKycProviderAdapter({ appToken:'',secretKey:'',webhookSecret:'',environment:'sandbox' });
  registerKycProviderAdapter(missing);
  const payment = new XenditPaymentProviderAdapter({ secretKey:'',webhookToken:'' });
  const payout = new XenditPayoutProviderAdapter({ secretKey:'',webhookToken:'' });
  assert.equal(payment.isConfigured,false); assert.equal(payout.isConfigured,false);
  const configured = new SumsubKycProviderAdapter(kycConfig(join(mkdtempSync(join(tmpdir(),'rentipid-routing-')),'.rentipid-sandbox','sumsub-kyc-sandbox.sqlite')));
  for (const [country,currency] of [['TH','THB'],['SG','SGD'],['MY','MYR'],['VN','VND'],['ID','IDR']]) {
    const kyc = getJurisdictionKycProfile(country)!; const collection = resolveJurisdictionPaymentProfile(country)!; const settlement = resolveJurisdictionPayoutProfile(country)!;
    assert.equal(kyc.providerAdapter,'SUMSUB'); assert.equal(kyc.status,'VALIDATION_REQUIRED');
    assert.deepEqual(collection.approvedProviderIds,['xendit']); assert.deepEqual(settlement.approvedProviderIds,['xendit_payout']);
    assert.deepEqual(collection.supportedTransactionCurrencies,[currency]); assert.deepEqual(settlement.supportedSettlementCurrencies,[currency]);
    assert.equal(collection.collectionStatus,'NOT_CONFIGURED'); assert.equal(settlement.payoutStatus,'NOT_CONFIGURED');
    assert.throws(() => resolveJurisdictionKycAdapter(country),/NOT_CONFIGURED/);
    for (const forbidden of ['MANUAL_INTERNAL','INTERNAL','MOCK','PAYMONGO','MANNYPAY','VERIFF']) assert.throws(() => resolveJurisdictionKycAdapter(country,forbidden),/MISMATCH/);
    for (const forbidden of ['paymongo','mannypay','mock','mock_payout_rail','manual_ph_bank']) {
      assert.equal(collection.approvedProviderIds.includes(forbidden),false); assert.equal(settlement.approvedProviderIds.includes(forbidden),false);
    }
    assert.equal(financialProviderRegistry.getPaymentAdapter(collection.approvedProviderIds[0])?.providerId,'xendit');
    assert.equal(financialProviderRegistry.getPayoutAdapter(settlement.approvedProviderIds[0])?.providerId,'xendit_payout');
    assert.equal(financialProviderRegistry.getPaymentAdapter('xendit_payout'),null); assert.equal(financialProviderRegistry.getPayoutAdapter('xendit'),null);
  }
  registerKycProviderAdapter(configured);
  for (const country of ['TH','SG','MY','VN','ID']) assert.equal(resolveJurisdictionKycAdapter(country,'SUMSUB'),configured);
  assert.equal(getKycProviderAdapter('SUMSUB'),configured); assert.equal(getKycProviderAdapter('MOCK').isConfigured,false);
  assert.equal(getJurisdictionKycProfile('PH')!.providerAdapter,'MANUAL_INTERNAL');
  assert.deepEqual(resolveJurisdictionPaymentProfile('PH')!.approvedProviderIds,['paymongo']);
  assert.deepEqual(resolveJurisdictionPayoutProfile('PH')!.approvedProviderIds,['manual_ph_bank']);
  assert.equal(financialProviderRegistry.getPaymentAdapter('mannypay'),null);
  for (const country of ['ZZ','']) {
    assert.throws(() => resolveJurisdictionKycAdapter(country),/MISMATCH/); assert.equal(resolveJurisdictionPaymentProfile(country),null); assert.equal(resolveJurisdictionPayoutProfile(country),null);
  }
  for (const state of ['DOCUMENTATION_VERIFIED','SANDBOX_CREDENTIALS_REQUIRED','SANDBOX_CONFIGURED','SANDBOX_VERIFIED','PRODUCTION_ONBOARDING_REQUIRED','PRODUCTION_CREDENTIALS_REQUIRED','PRODUCTION_READY'] as const) assert.ok(PROVIDER_ENVIRONMENT_STATUSES.includes(state));
  assert.notEqual(configured.getEnvironmentStatus(),'SANDBOX_VERIFIED'); assert.notEqual(payment.getEnvironmentStatus(),'SANDBOX_VERIFIED'); assert.notEqual(payout.getEnvironmentStatus(),'SANDBOX_VERIFIED');
  configured.close(); registerKycProviderAdapter(missing);
});
