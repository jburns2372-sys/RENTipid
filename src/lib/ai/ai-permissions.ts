export type AIPermissionLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const PermissionLevels = {
  ANSWER_ONLY: 1 as AIPermissionLevel,
  SUGGEST_ACTION: 2 as AIPermissionLevel,
  PREPARE_DRAFT: 3 as AIPermissionLevel,
  EXECUTE_AFTER_APPROVAL: 4 as AIPermissionLevel,
  ADMIN_EXECUTE: 5 as AIPermissionLevel,
  NO_ACCESS: 6 as AIPermissionLevel,
};

export const FINANCE_BOT_RESTRICTIONS = {
    permissions: [
      'analyze_reconciliation_mismatches',
      'draft_finance_notes',
      'summarize_payout_batches',
      'explain_refund_eligibility'
    ],
    restrictions: [
      'CANNOT_APPROVE_REFUNDS',
      'CANNOT_PROCESS_PAYOUTS',
      'CANNOT_INITIATE_BANK_TRANSFERS',
      'CANNOT_RELEASE_DEPOSITS',
      'CANNOT_OVERRIDE_FINANCE_FREEZE',
      'CANNOT_EXECUTE_FINANCIAL_TRANSACTIONS'
    ]
};

export const MAX_ALLOWED_PERMISSION = PermissionLevels.PREPARE_DRAFT;

export const BOTS = {
  CONCIERGE: 'RENTipid Concierge Bot',
  ONBOARDING: 'Onboarding Bot',
  KYC: 'KYC Assistant Bot',
  LISTING: 'Listing Builder Bot',
  PRICING: 'Pricing Assistant Bot',
  CATEGORY_COMPLIANCE: 'Category Compliance Bot',
  BOOKING: 'Booking Assistant Bot',
  PAYMENT: 'Payment Assistant Bot',
  FINANCE: 'Finance Assistant Bot',
  AGREEMENT: 'Agreement Assistant Bot',
  INSPECTION: 'Inspection Assistant Bot',
  DAMAGE_CLAIM: 'Damage Claim Assistant Bot',
  DISPUTE_REVIEW: 'Dispute Review Assistant Bot',
  ADMIN_COPILOT: 'Admin Copilot',
  COMPLIANCE: 'Compliance Bot',
  SECURITY: 'Security Bot',
  SUPPORT: 'Support Bot',
  ANALYTICS: 'Analytics Bot',
  
  // Phase 8: Marketing Bots
  CAMPAIGN_STRATEGY: 'Campaign Strategy Bot',
  LISTING_PROMOTION: 'Listing Promotion Bot',
  CAPTION: 'Caption Bot',
  HASHTAG: 'Hashtag Bot',
  PROMO_IMAGE: 'Promo Image Prompt Bot',
  VIDEO_SCRIPT: 'Video Script Bot',
  SCHEDULER: 'Scheduler Bot',
  MKT_ANALYTICS: 'Marketing Analytics Bot',
  INFLUENCER: 'Influencer Outreach Bot',
  WHATSAPP: 'WhatsApp Campaign Bot'
} as const;

export type BotId = typeof BOTS[keyof typeof BOTS];

type RoleAccessMap = Record<string, BotId[]>;

export const ROLE_BOT_ACCESS: RoleAccessMap = {
  "Guest": [
    BOTS.CONCIERGE,
    BOTS.SUPPORT,
    BOTS.ONBOARDING
  ],
  "Renter": [
    BOTS.CONCIERGE,
    BOTS.BOOKING,
    BOTS.PAYMENT,
    BOTS.AGREEMENT,
    BOTS.INSPECTION,
    BOTS.DAMAGE_CLAIM,
    BOTS.SUPPORT
  ],
  "Individual Provider": [
    BOTS.CONCIERGE,
    BOTS.LISTING,
    BOTS.PRICING,
    BOTS.CATEGORY_COMPLIANCE,
    BOTS.BOOKING,
    BOTS.AGREEMENT,
    BOTS.INSPECTION,
    BOTS.DAMAGE_CLAIM,
    BOTS.SUPPORT
  ],
  "Business Provider": [
    BOTS.CONCIERGE,
    BOTS.LISTING,
    BOTS.PRICING,
    BOTS.CATEGORY_COMPLIANCE,
    BOTS.BOOKING,
    BOTS.AGREEMENT,
    BOTS.INSPECTION,
    BOTS.DAMAGE_CLAIM,
    BOTS.SUPPORT,
    BOTS.FINANCE,
    BOTS.LISTING_PROMOTION,
    BOTS.CAPTION,
    BOTS.HASHTAG,
    BOTS.PROMO_IMAGE,
    BOTS.VIDEO_SCRIPT,
    BOTS.MKT_ANALYTICS
  ],
  "Finance Admin": [
    BOTS.FINANCE,
    BOTS.PAYMENT,
    BOTS.ANALYTICS
  ],
  "Admin": [
    BOTS.ADMIN_COPILOT,
    BOTS.COMPLIANCE,
    BOTS.KYC,
    BOTS.CATEGORY_COMPLIANCE,
    BOTS.DISPUTE_REVIEW,
    BOTS.SECURITY,
    BOTS.ANALYTICS,
    BOTS.CAMPAIGN_STRATEGY,
    BOTS.LISTING_PROMOTION,
    BOTS.CAPTION,
    BOTS.HASHTAG,
    BOTS.PROMO_IMAGE,
    BOTS.VIDEO_SCRIPT,
    BOTS.SCHEDULER,
    BOTS.MKT_ANALYTICS,
    BOTS.INFLUENCER,
    BOTS.WHATSAPP
  ],
  "Compliance Admin": [
    BOTS.ADMIN_COPILOT,
    BOTS.COMPLIANCE,
    BOTS.KYC,
    BOTS.CATEGORY_COMPLIANCE,
    BOTS.DISPUTE_REVIEW,
    BOTS.SECURITY
  ],
  "Super Admin": Object.values(BOTS)
};

export function getAllowedBotsForRole(role: string | undefined): BotId[] {
  if (!role) return ROLE_BOT_ACCESS["Guest"];
  return ROLE_BOT_ACCESS[role] || ROLE_BOT_ACCESS["Guest"];
}

export function canUserAccessBot(role: string | undefined, botId: BotId): boolean {
  const allowedBots = getAllowedBotsForRole(role);
  return allowedBots.includes(botId);
}
