import { revision2SpecialistRegistry, Revision2SpecialistDefinition, Revision2SpecialistId } from './framework-registry';
import { aiSpecialistRegistry, SupportSubdomainId, supportSubdomainIds } from './registry';

export const controlledSupportIntents = [
  'login_help', 'support_info',
  'booking_help', 'booking_status', 'booking_acceptance', 'cancellation', 'booking_cancel', 'modification', 'booking_change',
  'payment_problem', 'payment_inquiry', 'payment_issue', 'refund_status', 'refund_request', 'deposit_status',
  'rental_support', 'rental_extend',
  'claim', 'claim_status', 'damage', 'damage_report',
  'insurance_support', 'insurance_info',
  'kyc_account_support', 'kyc_status',
  'provider_operational_support', 'listing_status', 'payout_status',
] as const;

export type ControlledSupportIntent = (typeof controlledSupportIntents)[number];

export interface SpecialistFallback {
  primarySpecialistId: Revision2SpecialistId;
  supportSubdomainId?: SupportSubdomainId;
}

export interface IntentOwnershipDefinition {
  intent: string;
  primarySpecialistId: Revision2SpecialistId;
  supportSubdomainId?: SupportSubdomainId;
  consultedSpecialists: readonly Revision2SpecialistId[];
  fallback?: SpecialistFallback;
  version: string;
  status: 'ENABLED' | 'DISABLED';
}

export class IntentOwnershipRegistryError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'IntentOwnershipRegistryError';
  }
}

const supportSubdomainByIntent: Readonly<Record<ControlledSupportIntent, SupportSubdomainId>> = {
  login_help: 'GENERAL_SUPPORT',
  support_info: 'GENERAL_SUPPORT',
  booking_help: 'BOOKING',
  booking_status: 'BOOKING',
  booking_acceptance: 'BOOKING',
  cancellation: 'BOOKING',
  booking_cancel: 'BOOKING',
  modification: 'BOOKING',
  booking_change: 'BOOKING',
  payment_problem: 'PAYMENT_REFUND_DEPOSIT',
  payment_inquiry: 'PAYMENT_REFUND_DEPOSIT',
  payment_issue: 'PAYMENT_REFUND_DEPOSIT',
  refund_status: 'PAYMENT_REFUND_DEPOSIT',
  refund_request: 'PAYMENT_REFUND_DEPOSIT',
  deposit_status: 'PAYMENT_REFUND_DEPOSIT',
  rental_support: 'RENTAL',
  rental_extend: 'RENTAL',
  claim: 'CLAIM_DISPUTE',
  claim_status: 'CLAIM_DISPUTE',
  damage: 'CLAIM_DISPUTE',
  damage_report: 'CLAIM_DISPUTE',
  insurance_support: 'INSURANCE',
  insurance_info: 'INSURANCE',
  kyc_account_support: 'KYC_ACCOUNT',
  kyc_status: 'KYC_ACCOUNT',
  provider_operational_support: 'PROVIDER',
  listing_status: 'PROVIDER',
  payout_status: 'PROVIDER',
};

export const intentOwnershipDefinitions: readonly IntentOwnershipDefinition[] = Object.freeze(
  (controlledSupportIntents.map(intent => ({
    intent,
    primarySpecialistId: 'SupportSpecialist' as const,
    supportSubdomainId: supportSubdomainByIntent[intent],
    consultedSpecialists: [] as readonly Revision2SpecialistId[],
    version: '2.0',
    status: 'ENABLED' as const,
  })) as IntentOwnershipDefinition[]).concat([
    {
      intent: 'marketplace_analytics',
      primarySpecialistId: 'MarketplaceIntelligenceSpecialist' as const,
      consultedSpecialists: [] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    },
    {
      intent: 'operational_metrics',
      primarySpecialistId: 'MarketplaceIntelligenceSpecialist' as const,
      consultedSpecialists: [] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    },
    ...['campaign_content', 'content_variants', 'campaign_copy', 'caption_generation', 'hashtag_generation', 'campaign_script', 'cta_variant', 'content_localization', 'creative_brief'].map(intent => ({
      intent,
      primarySpecialistId: 'GrowthContentSpecialist' as const,
      consultedSpecialists: ['MarketplaceIntelligenceSpecialist'] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    })),
    ...['provider_lead', 'partner_growth', 'provider_qualification', 'fleet_prospect', 'provider_onboarding_assistance', 'provider_outreach_draft', 'provider_followup_recommendation', 'listingbridge_import_assistance', 'listingbridge_assistance'].map(intent => ({
      intent,
      primarySpecialistId: 'ProviderAcquisitionSpecialist' as const,
      consultedSpecialists: ['MarketplaceIntelligenceSpecialist'] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    })),
    ...['payout_reconciliation', 'ledger_discrepancy', 'payment_reconciliation', 'refund_reconciliation', 'commission_discrepancy', 'fee_discrepancy', 'settlement_discrepancy', 'provider_payout_discrepancy'].map(intent => ({
      intent,
      primarySpecialistId: 'FinanceReconciliationSpecialist' as const,
      consultedSpecialists: [] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    })),
    ...['system_incident', 'incident_analysis', 'root_cause', 'service_failure_analysis', 'payment_failure_cluster', 'api_failure_cluster', 'job_failure_analysis', 'incident_timeline', 'operational_degradation'].map(intent => ({
      intent,
      primarySpecialistId: 'IncidentRCASpecialist' as const,
      consultedSpecialists: [] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    })),
    ...['contract_clause_review', 'policy_gap', 'contract_deviation', 'provider_agreement_review', 'vendor_agreement_review', 'partnership_terms_review', 'renewal_clause_review', 'termination_clause_review', 'privacy_clause_review', 'indemnity_clause_review'].map(intent => ({
      intent,
      primarySpecialistId: 'ContractPolicySpecialist' as const,
      consultedSpecialists: [] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    })),
    ...['ux_review', 'flow_friction', 'journey_analysis', 'checkout_friction', 'booking_ux_review', 'provider_onboarding_ux', 'support_ux_review', 'digital_human_ux_review', 'product_experiment_recommendation', 'usability_analysis'].map(intent => ({
      intent,
      primarySpecialistId: 'ProductUXSpecialist' as const,
      consultedSpecialists: [] as readonly Revision2SpecialistId[],
      version: '1.0',
      status: 'ENABLED' as const,
    }))
  ])
);


function assertKnownSpecialist(
  id: Revision2SpecialistId,
  definitions: Readonly<Record<Revision2SpecialistId, Revision2SpecialistDefinition>>,
): Revision2SpecialistDefinition {
  const definition = definitions[id];
  if (!definition) throw new IntentOwnershipRegistryError('UNKNOWN_PRIMARY_SPECIALIST', `Unknown specialist '${id}'.`);
  return definition;
}

function validateConsultationGraph(
  entries: readonly IntentOwnershipDefinition[],
  definitions: Readonly<Record<Revision2SpecialistId, Revision2SpecialistDefinition>>,
) {
  const graph = new Map<Revision2SpecialistId, Set<Revision2SpecialistId>>();
  for (const entry of entries) {
    const outgoing = graph.get(entry.primarySpecialistId) ?? new Set<Revision2SpecialistId>();
    if (new Set(entry.consultedSpecialists).size !== entry.consultedSpecialists.length) {
      throw new IntentOwnershipRegistryError('ILLEGAL_CONSULTATION_GRAPH', `Duplicate consultation for '${entry.intent}'.`);
    }
    for (const consulted of entry.consultedSpecialists) {
      assertKnownSpecialist(consulted, definitions);
      if (consulted === entry.primarySpecialistId) {
        throw new IntentOwnershipRegistryError('ILLEGAL_CONSULTATION_GRAPH', `Specialist cannot consult itself for '${entry.intent}'.`);
      }
      outgoing.add(consulted);
    }
    graph.set(entry.primarySpecialistId, outgoing);
  }

  const visiting = new Set<Revision2SpecialistId>();
  const visited = new Set<Revision2SpecialistId>();
  const visit = (id: Revision2SpecialistId) => {
    if (visiting.has(id)) throw new IntentOwnershipRegistryError('ILLEGAL_CONSULTATION_GRAPH', 'Consultation graph contains a cycle.');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const target of graph.get(id) ?? []) visit(target);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of graph.keys()) visit(id);
}

export function validateIntentOwnershipDefinitions(
  entries: readonly IntentOwnershipDefinition[],
  definitions: Readonly<Record<Revision2SpecialistId, Revision2SpecialistDefinition>> = revision2SpecialistRegistry,
  requiredIntents: readonly string[] = controlledSupportIntents,
): void {
  for (const intent of requiredIntents) {
    const owners = entries.filter(entry => entry.intent === intent && entry.status === 'ENABLED');
    if (owners.length === 0) throw new IntentOwnershipRegistryError('MISSING_PRIMARY_OWNER', `No primary owner for '${intent}'.`);
    if (owners.length > 1) throw new IntentOwnershipRegistryError('DUPLICATE_PRIMARY_OWNER', `Multiple primary owners for '${intent}'.`);
  }

  for (const entry of entries) {
    const primary = assertKnownSpecialist(entry.primarySpecialistId, definitions);
    if (entry.primarySpecialistId === 'SupportSpecialist') {
      if (!entry.supportSubdomainId || !supportSubdomainIds.includes(entry.supportSubdomainId)) {
        throw new IntentOwnershipRegistryError('UNKNOWN_SUPPORT_SUBDOMAIN', `Missing support subdomain for '${entry.intent}'.`);
      }
      if (!aiSpecialistRegistry[entry.supportSubdomainId].allowedIntents.includes(entry.intent)) {
        throw new IntentOwnershipRegistryError('SUBDOMAIN_INTENT_MISMATCH', `Subdomain does not own '${entry.intent}'.`);
      }
    }
    if (primary.status === 'DISABLED') {
      if (!entry.fallback) {
        throw new IntentOwnershipRegistryError('DISABLED_PRIMARY_WITHOUT_FALLBACK', `Disabled primary has no fallback for '${entry.intent}'.`);
      }
      const fallback = assertKnownSpecialist(entry.fallback.primarySpecialistId, definitions);
      if (fallback.status !== 'ENABLED' || fallback.id === primary.id) {
        throw new IntentOwnershipRegistryError('INVALID_FALLBACK', `Invalid fallback for '${entry.intent}'.`);
      }
    }
  }
  validateConsultationGraph(entries, definitions);
}

export class IntentOwnershipRegistry {
  private readonly byIntent: ReadonlyMap<string, IntentOwnershipDefinition>;

  constructor(
    readonly entries: readonly IntentOwnershipDefinition[] = intentOwnershipDefinitions,
    readonly specialistDefinitions: Readonly<Record<Revision2SpecialistId, Revision2SpecialistDefinition>> = revision2SpecialistRegistry,
    requiredIntents: readonly string[] = controlledSupportIntents,
  ) {
    validateIntentOwnershipDefinitions(entries, specialistDefinitions, requiredIntents);
    this.byIntent = new Map(entries.filter(entry => entry.status === 'ENABLED').map(entry => [entry.intent, entry]));
  }

  resolve(intent: string): IntentOwnershipDefinition {
    const ownership = this.byIntent.get(intent);
    if (!ownership) throw new IntentOwnershipRegistryError('OWNERSHIP_NOT_FOUND', `No controlled ownership for '${intent}'.`);
    return ownership;
  }

  resolveWithGeneralFallback(intent: string | undefined): IntentOwnershipDefinition {
    if (!intent) return this.resolve('support_info');
    try {
      return this.resolve(intent);
    } catch (error) {
      if (!(error instanceof IntentOwnershipRegistryError) || error.code !== 'OWNERSHIP_NOT_FOUND') throw error;
      return this.resolve('support_info');
    }
  }
}

export const intentOwnershipRegistry = new IntentOwnershipRegistry();