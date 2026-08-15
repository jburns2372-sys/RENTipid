import { RiskCeiling } from './registry';

export const revision2SpecialistIds = [
  'SupportSpecialist',
  'MarketplaceIntelligenceSpecialist',
  'GrowthContentSpecialist',
  'ProviderAcquisitionSpecialist',
  'FinanceReconciliationSpecialist',
  'IncidentRCASpecialist',
  'ContractPolicySpecialist',
  'ProductUXSpecialist',
] as const;

export type Revision2SpecialistId = (typeof revision2SpecialistIds)[number];

export type SpecialistMaturityLevel =
  | 'L1_OBSERVE_RECOMMEND'
  | 'L2_DRAFT'
  | 'L3_EXECUTE_LOW_RISK'
  | 'L4_EXECUTE_POLICY_APPROVED_OPERATIONAL';

export type SpecialistFeatureState = 'ENABLED' | 'DISABLED';

export interface Revision2SpecialistDefinition {
  id: Revision2SpecialistId;
  version: string;
  status: SpecialistFeatureState;
  featureFlag: string;
  maturityLevel: SpecialistMaturityLevel;
  allowedRoles: readonly string[];
  prohibitedRoles: readonly string[];
  allowedKnowledgeDomains: readonly string[];
  prohibitedKnowledgeDomains: readonly string[];
  allowedTools: readonly string[];
  prohibitedTools: readonly string[];
  riskCeiling: RiskCeiling;
}

const knownRoles = [
  'Guest',
  'Renter',
  'Provider',
  'Individual Provider',
  'Business Provider',
  'Finance Admin',
  'Admin',
  'Compliance Admin',
  'Super Admin',
  'Owner',
  'Reviewer',
] as const;

const alwaysProhibitedTools = [
  'approve_refund',
  'process_payout',
  'initiate_bank_transfer',
  'release_deposit',
  'override_finance_freeze',
  'execute_security_response',
  'issue_legal_decision',
] as const;

const disabledPlaceholder = (
  id: Exclude<Revision2SpecialistId, 'SupportSpecialist'>,
): Revision2SpecialistDefinition => ({
  id,
  version: '0.1',
  status: 'DISABLED',
  featureFlag: `ai_specialist_${id.replace(/Specialist$/, '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}_enabled`,
  maturityLevel: 'L1_OBSERVE_RECOMMEND',
  allowedRoles: [],
  prohibitedRoles: [],
  allowedKnowledgeDomains: [],
  prohibitedKnowledgeDomains: [],
  allowedTools: [],
  prohibitedTools: alwaysProhibitedTools,
  riskCeiling: 'INFORMATION',
});

export const revision2SpecialistRegistry: Readonly<Record<Revision2SpecialistId, Revision2SpecialistDefinition>> = {
  SupportSpecialist: {
    id: 'SupportSpecialist',
    version: '2.0',
    status: 'ENABLED',
    featureFlag: 'ai_specialist_support_enabled',
    maturityLevel: 'L4_EXECUTE_POLICY_APPROVED_OPERATIONAL',
    allowedRoles: knownRoles,
    prohibitedRoles: [],
    allowedKnowledgeDomains: [
      'general_faq',
      'platform_rules',
      'booking_policy',
      'financial_policy',
      'rental_rules',
      'dispute_policy',
      'insurance_terms',
      'account_policy',
      'provider_policy',
    ],
    prohibitedKnowledgeDomains: ['raw_kyc_documents', 'payment_credentials', 'security_secrets'],
    allowedTools: [
      'get_booking_status',
      'cancel_booking',
      'get_payment_status',
      'get_refund_status',
      'request_extension',
      'get_claim_status',
      'report_damage',
      'get_kyc_status',
      'get_listing_status',
      'get_payout_status',
    ],
    prohibitedTools: alwaysProhibitedTools,
    riskCeiling: 'ACTION',
  },
  MarketplaceIntelligenceSpecialist: {
    id: 'MarketplaceIntelligenceSpecialist',
    version: '1.0',
    status: 'ENABLED',
    featureFlag: 'ai_specialist_marketplace_intelligence_enabled',
    maturityLevel: 'L1_OBSERVE_RECOMMEND',
    allowedRoles: ['Admin', 'Super Admin'],
    prohibitedRoles: ['Guest', 'Renter', 'Provider', 'Individual Provider', 'Business Provider'],
    allowedKnowledgeDomains: ['marketplace_metrics', 'operational_analytics'],
    prohibitedKnowledgeDomains: ['raw_kyc_documents', 'payment_credentials', 'security_secrets', 'individual_pii'],
    allowedTools: ['execute_marketplace_analytics_query'],
    prohibitedTools: alwaysProhibitedTools,
    riskCeiling: 'INFORMATION',
  },
  GrowthContentSpecialist: {
    id: 'GrowthContentSpecialist',
    version: '1.0',
    status: 'ENABLED',
    featureFlag: 'ai_specialist_growth_content_enabled',
    maturityLevel: 'L2_DRAFT',
    allowedRoles: ['Admin', 'Super Admin'],
    prohibitedRoles: ['Guest', 'Renter', 'Provider', 'Individual Provider', 'Business Provider'],
    allowedKnowledgeDomains: ['campaign_context', 'brand_guidelines', 'product_facts'],
    prohibitedKnowledgeDomains: ['raw_kyc_documents', 'payment_credentials', 'security_secrets', 'individual_pii', 'support_conversations'],
    allowedTools: [
      'draftSocialContent',
      'rewriteSocialContent',
      'adaptContentForChannel',
      'suggestSocialHashtags',
      'suggestCTA',
      'suggestCampaignIdeas',
      'summarizeListingForPromotion',
      'summarizeCampaign'
    ],
    prohibitedTools: [...alwaysProhibitedTools, 'publish_campaign', 'schedule_campaign', 'approve_campaign', 'activate_campaign', 'override_anti_spam', 'override_consent'],
    riskCeiling: 'ACTION',
  },
  ProviderAcquisitionSpecialist: {
    id: 'ProviderAcquisitionSpecialist',
    version: '1.0',
    status: 'ENABLED',
    featureFlag: 'ai_specialist_provider_acquisition_enabled',
    maturityLevel: 'L2_DRAFT',
    allowedRoles: ['Admin', 'Super Admin'],
    prohibitedRoles: ['Guest', 'Renter', 'Provider', 'Individual Provider', 'Business Provider'],
    allowedKnowledgeDomains: ['provider_qualification_rules', 'onboarding_requirements', 'market_supply_gaps'],
    prohibitedKnowledgeDomains: ['raw_kyc_documents', 'payment_credentials', 'security_secrets', 'individual_pii', 'support_conversations'],
    allowedTools: [],
    prohibitedTools: [...alwaysProhibitedTools, 'override_anti_spam', 'override_consent', 'approve_kyc', 'activate_provider', 'send_mass_message'],
    riskCeiling: 'ACTION',
  },
  FinanceReconciliationSpecialist: {
    id: 'FinanceReconciliationSpecialist',
    version: '1.0',
    status: 'ENABLED',
    featureFlag: 'ai_specialist_finance_reconciliation_enabled',
    maturityLevel: 'L1_OBSERVE_RECOMMEND',
    allowedRoles: ['Admin', 'Super Admin', 'Finance Manager'],
    prohibitedRoles: ['Guest', 'Renter', 'Provider', 'Individual Provider', 'Business Provider'],
    allowedKnowledgeDomains: ['transaction_records', 'payout_records', 'refund_state', 'finance_policy', 'booking_pricing'],
    prohibitedKnowledgeDomains: ['raw_kyc_documents', 'security_secrets', 'individual_pii', 'support_conversations'],
    allowedTools: [],
    prohibitedTools: [...alwaysProhibitedTools, 'issue_refund', 'approve_payout', 'change_commission', 'mutate_balance', 'release_deposit', 'send_mass_message'],
    riskCeiling: 'INFORMATION',
  },
  IncidentRCASpecialist: disabledPlaceholder('IncidentRCASpecialist'),
  ContractPolicySpecialist: disabledPlaceholder('ContractPolicySpecialist'),
  ProductUXSpecialist: disabledPlaceholder('ProductUXSpecialist'),
};