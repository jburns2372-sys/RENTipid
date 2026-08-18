import type { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { ROLE_BOT_ACCESS } from '@/lib/ai/ai-permissions';
import { RetentionPolicyRegistry } from '@/lib/privacy/retention-policy';
import { PAYMENT_CONTRACT_CURRENCY } from '@/lib/payments/payment-currency-policy';
import { getPhase1PermissionsForRole } from '@/lib/security/permissions';
import { SOCIAL_PLATFORMS } from '@/lib/social/social-platform-registry';
import type { AdaptedKnowledge, KnowledgeRegistryEntry } from '../types';

type Provider = (entry: KnowledgeRegistryEntry, prisma: PrismaClient) => Promise<AdaptedKnowledge>;

const roleNames = [
  'Guest', 'Renter', 'Individual Provider', 'Business Provider', 'Admin',
  'Finance Admin', 'Compliance Admin', 'SOC_ANALYST', 'SOC_SUPERVISOR', 'Super Admin',
];

const providers: Record<string, Provider> = {
  'structured:prohibited-items': async entry => {
    throw new Error(`PRISMA_REQUIRED:${entry.sourceKey}`);
  },
  'structured:privacy': async (_entry, prisma) => {
    const published = await prisma.privacyPolicyVersion.findFirst({
      where: { status: { in: ['ACTIVE', 'PUBLISHED', 'APPROVED'] } },
      orderBy: { published_at: 'desc' },
      select: { version: true, effective_at: true },
    });
    const retention = Object.values(RetentionPolicyRegistry)
      .filter(policy => policy.policyId !== 'RET-UNKNOWN')
      .map(policy => `- ${policy.dataCategory}: ${policy.retentionDurationSource}; ${policy.durationDays ?? 'duration pending approval'}; automatic deletion ${policy.automaticDeletionEnabled ? 'enabled' : 'disabled'}.`)
      .join('\n');
    return {
      title: 'Privacy Policy and Retention Governance',
      content: `# Privacy Policy and Retention Governance

The approved Privacy v1 model uses a manual governed retention process. Automated production deletion is disabled. Retention items marked pending management confirmation must not be represented as settled legal durations.

${published ? `Published policy version: ${published.version}${published.effective_at ? `, effective ${published.effective_at.toISOString().slice(0, 10)}` : ''}.` : 'The controlled documentation identifies Privacy Policy version 1.0.0 effective 2026-08-05.'}

## Approved retention registry descriptions

${retention}`,
      keywords: ['privacy', 'retention', 'consent', 'data subject', 'deletion'],
    };
  },
  'structured:rbac': async () => ({
    title: 'RENTipid Role and Permission Guidance',
    content: `# Role and Permission Guidance

${roleNames.map(role => {
  const assistants = ROLE_BOT_ACCESS[role] ?? [];
  const permissions = getPhase1PermissionsForRole(role);
  return `## ${role}\n\nApproved AI assistants: ${assistants.length ? assistants.join(', ') : 'none beyond general public access'}.\n\nActive security/privacy permissions: ${permissions.length ? permissions.join(', ') : 'none in the active permission registry'}.`;
}).join('\n\n')}

Super Admin has the broadest approved application knowledge visibility, but SYSTEM_ONLY content and secrets remain unavailable through conversational retrieval.`,
    keywords: ['roles', 'rbac', 'permissions', 'renter', 'provider', 'admin', 'finance', 'compliance', 'soc'],
  }),
  'structured:ai-policy': async () => ({
    title: 'Unified AI Authority Boundaries',
    content: `# Unified AI Authority Boundaries

Approved knowledge is read-only explanatory context. It cannot approve refunds, process payouts, release deposits, approve or reject KYC, settle claims, approve insurance, change RBAC, reveal secrets, or mutate bookings without the existing policy, authorization, ownership, confirmation, and tool controls.

The supported authority progression is answer, suggest, prepare a draft, and execute only through an authorized tool path with required approval. Safe hold is required when policy inputs conflict or are incomplete.`,
    keywords: ['ai', 'authority', 'tools', 'approval', 'safe hold', 'policy'],
  }),
  'structured:payments': async () => ({
    title: 'Payment and Currency Status',
    content: `# Payment and Currency Status

The RENTipid payment contract currency is ${PAYMENT_CONTRACT_CURRENCY}. Live payment activation remains separately governed and general knowledge never authorizes a charge, refund, payout, transfer, escrow release, or deposit release. Current transaction status must be obtained through an authorized payment/domain tool.`,
    keywords: ['payment', 'currency', 'php', 'refund', 'payout', 'deposit', 'escrow'],
  }),
  'structured:insurance': async () => ({
    title: 'Insurance Module Approved Safe State',
    content: `# Insurance Module Approved Safe State

The Insurance technical foundation is closed and frozen in a non-live, safely shelved state. Insurance is disabled unless explicitly enabled, live issuance is disabled, the kill switch fails safe, and mock behavior requires explicit non-live configuration. Product concepts and claim workflows do not constitute an approved policy, coverage guarantee, or live insurer commitment. Current policy or claim state requires the authorized Insurance domain service.`,
    keywords: ['insurance', 'coverage', 'claim', 'policy', 'disabled', 'kill switch'],
  }),
  'structured:social': async () => ({
    title: 'Social Module Capabilities',
    content: `# Social Module Capabilities

Registered platform vocabulary: ${Object.values(SOCIAL_PLATFORMS).join(', ')}.

The Social module supports controlled content workflows and provider capability checks. Live publishing depends on an authorized configured account and adapter. General knowledge cannot reveal credentials, connect accounts, publish, schedule, or alter campaign state.`,
    keywords: ['social', 'promotion', 'campaign', 'publishing', 'provider'],
  }),
  'structured:marketplace-taxonomy': async () => {
    const raw = await readFile(resolve(process.cwd(), 'seed-data/rentipid_marketplace_sample_seed_catalog.json'), 'utf8');
    const parsed = JSON.parse(raw) as { categories: Array<{ name: string; slug: string; subcategories: string[] }> };
    const categories = parsed.categories.map(category => `- ${category.name} (${category.slug}): ${category.subcategories.join(', ')}`).join('\n');
    return {
      title: 'Marketplace Category Taxonomy',
      content: `# Marketplace Category Taxonomy

The approved canonical rental marketplace taxonomy contains the following rental category and subcategory names. This provider reads only taxonomy fields; sample users, listings, bookings, and negative test fixtures are never ingested.

${categories}`,
      keywords: ['marketplace', 'categories', 'listings', ...parsed.categories.map(category => category.name)],
    };
  },
  'structured:workflow-status': async () => ({
    title: 'RENTipid Workflow Status Guidance',
    content: `# Workflow Status Guidance

## Listings

Listings move through controlled draft, submission, publication, availability, review, and removal states. Visibility depends on the authoritative listing service and policy checks.

## Bookings

Bookings use controlled request, confirmation, turnover, active rental, return/inspection, completion, cancellation, dispute, and claim-related transitions. The current state must come from the Booking domain service.

## Claims and disputes

Claims and disputes use evidence, review, safe-hold, decision, and closure workflows. Knowledge explains the process but does not settle a case.

## Privacy and security

Privacy requests, security incidents, playbooks, and response actions follow their approved state machines and role permissions.`,
    keywords: ['workflow', 'status', 'listing', 'booking', 'claim', 'dispute', 'privacy', 'security'],
  }),
};

export async function adaptStructuredProvider(
  entry: KnowledgeRegistryEntry,
  prisma: PrismaClient,
): Promise<AdaptedKnowledge> {
  if (entry.adapter === 'structured:prohibited-items') {
    const policies = await prisma.prohibitedItemPolicy.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: new Date() } }],
      },
      select: {
        policyCode: true,
        name: true,
        classification: true,
        summary: true,
        examples: true,
        publicGuidance: true,
        policyVersion: true,
        displayOrder: true,
      },
      orderBy: [{ displayOrder: 'asc' }, { policyCode: 'asc' }],
    });
    if (policies.length === 0) throw new Error('STRUCTURED_PROVIDER_EMPTY:provider.prohibited-items');
    return {
      title: 'Active Prohibited and Restricted Items Catalogue',
      content: `# Active Prohibited and Restricted Items Catalogue

${policies.map(policy => `## ${policy.policyCode}: ${policy.name}\n\nClassification: ${policy.classification}. Version: ${policy.policyVersion}.\n\n${policy.summary}\n\nExamples: ${policy.examples}.${policy.publicGuidance ? `\n\nPublic guidance: ${policy.publicGuidance}` : ''}`).join('\n\n')}`,
      keywords: ['prohibited', 'restricted', 'items', ...policies.flatMap(policy => [policy.name, policy.classification])],
      metadata: { activePolicyCount: policies.length },
    };
  }
  const provider = providers[entry.adapter];
  if (!provider) throw new Error(`STRUCTURED_PROVIDER_NOT_REGISTERED:${entry.adapter}`);
  return provider(entry, prisma);
}
