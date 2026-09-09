/**
 * RENTipid Master Canonical Customer Objective Catalog & Answer Contracts
 *
 * Authoritative definitions for RENTipid Customer Objectives across:
 * - Full Renter Lifecycle (21 stages)
 * - Full Provider Lifecycle (23 stages)
 * - Comprehensive Functional Domains (Account, Listings, Bookings, Payments, Deposits, Payouts, Insurance, Safety, Legal)
 * - Strict Answer Contracts (requiredFacts, optionalFacts, forbiddenClaims, authorityClass, liveServiceKey, toolKey)
 * - Specific Entity Handling (medicines, firearms, vehicles, heavy machinery, electronics, condos)
 */

export type CustomerPersona = 'RENTER' | 'PROVIDER' | 'ALL_CUSTOMERS' | 'GUEST' | 'ADMIN';

export type AuthorityClass =
  | 'STATIC_KNOWLEDGE'
  | 'POLICY_AUTHORITY'
  | 'LIVE_SERVICE'
  | 'POLICY_PLUS_LIVE'
  | 'ACTION_TOOL'
  | 'CLARIFICATION_REQUIRED'
  | 'UNSUPPORTED_NOT_ACTIVE'
  | 'MISSING_APPROVED_KNOWLEDGE';

export interface CustomerAnswerContract {
  readonly requiredFacts: readonly string[];
  readonly optionalFacts: readonly string[];
  readonly forbiddenClaims: readonly string[];
  readonly authorityClass: AuthorityClass;
  readonly authorityReference: string;
  readonly knowledgeSourceKey?: string;
  readonly knowledgeSectionKey?: string;
  readonly liveServiceKey?: string;
  readonly toolKey?: string;
  readonly clarificationPrompt?: string;
  readonly specificEntity?: string;
}

export interface CustomerObjectiveDefinition {
  readonly objectiveId: string;
  readonly canonicalQuestion: string;
  readonly domain: string;
  readonly subdomain: string;
  readonly lifecycleStage: string;
  readonly persona: CustomerPersona;
  readonly answerContract: CustomerAnswerContract;
  readonly aliases: readonly {
    readonly text: string;
    readonly style: 'FORMAL' | 'PLAIN' | 'SHORT' | 'TYPO' | 'TAGLISH' | 'COLLOQUIAL' | 'FRUSTRATED' | 'STATUS_BASED';
  }[];
}

export const CANONICAL_CUSTOMER_OBJECTIVES: readonly CustomerObjectiveDefinition[] = [
  // =========================================================================
  // 1. TRUST, SAFETY & PROHIBITED/RESTRICTED ITEM POLICIES
  // =========================================================================
  {
    objectiveId: 'listing.item.restriction',
    canonicalQuestion: 'What items are prohibited or restricted on RENTipid?',
    domain: 'Trust & Safety',
    subdomain: 'Prohibited Items',
    lifecycleStage: 'EVALUATING_OR_LISTING',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Illegal Drugs and Controlled Substances',
        'Medicines, Health Products and Medical Substances',
        'Firearms, Ammunition, Weapons and Explosives',
        'Hazardous Chemicals, Toxic Materials and Waste',
        'Alcohol, Tobacco, Nicotine and Vape Products',
        'Stolen Property',
        'Counterfeit, Forged and Fraudulent Items',
        'Live Animals and Endangered Species',
        'Human Remains and Organs',
        'Adult and Pornographic Materials'
      ],
      optionalFacts: ['Full catalogue includes 25 active prohibited and restricted categories'],
      forbiddenClaims: [
        'Consult the catalogue with no categories listed',
        'Review the ProhibitedItemPolicy catalogue to find out'
      ],
      authorityClass: 'POLICY_AUTHORITY',
      authorityReference: 'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY'
    },
    aliases: [
      { text: 'what are the prohibited items?', style: 'PLAIN' },
      { text: "What can't I list?", style: 'SHORT' },
      { text: 'What cant I list', style: 'TYPO' },
      { text: 'what cant i list on rentipid', style: 'PLAIN' },
      { text: "Are there things I can't rent out?", style: 'PLAIN' },
      { text: 'What kinds of things are banned?', style: 'COLLOQUIAL' },
      { text: 'Which rental items are restricted', style: 'FORMAL' },
      { text: 'ano ang mga bawal iparenta sa rentipid', style: 'TAGLISH' },
      { text: 'ano mga bawal iparenta', style: 'TAGLISH' },
      { text: "Which items aren't allowed", style: 'SHORT' },
      { text: 'List of banned items on rentipid', style: 'PLAIN' },
      { text: 'bawal ba mag rent out ng drugs o baril', style: 'TAGLISH' },
      { text: 'What is not allowed to be listed on RENTipid', style: 'FORMAL' }
    ]
  },
  {
    objectiveId: 'listing.item.eligibility.medicine',
    canonicalQuestion: 'Can I list medicine on RENTipid?',
    domain: 'Trust & Safety',
    subdomain: 'Item Eligibility',
    lifecycleStage: 'LISTING_CREATION',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'Medicines, Health Products and Medical Substances are strictly prohibited',
        'Prescription drugs, pharmacy-only medicines, vaccines, and unauthorized therapeutic products cannot be listed'
      ],
      optionalFacts: ['Enforcement action is immediate listing block'],
      forbiddenClaims: ['Medicine can be listed with provider KYC', 'Medicine rental is allowed'],
      authorityClass: 'POLICY_AUTHORITY',
      authorityReference: 'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY',
      specificEntity: 'medicine'
    },
    aliases: [
      { text: 'Can I rent out medicines?', style: 'PLAIN' },
      { text: 'Can I list medicine?', style: 'SHORT' },
      { text: 'Can I list prescription medicine?', style: 'FORMAL' },
      { text: 'pwede ba magpahiram o magpa-rent ng gamot?', style: 'TAGLISH' },
      { text: 'pwede ba gamot', style: 'TAGLISH' },
      { text: 'Are medical substances allowed for rent?', style: 'FORMAL' },
      { text: 'can i list drugs and supplements', style: 'TYPO' }
    ]
  },
  {
    objectiveId: 'listing.item.eligibility.firearms',
    canonicalQuestion: 'Can I list a firearm or gun on RENTipid?',
    domain: 'Trust & Safety',
    subdomain: 'Item Eligibility',
    lifecycleStage: 'LISTING_CREATION',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'Firearms, Ammunition, Weapons and Explosives are strictly prohibited',
        'Guns, ammunition, explosives, and unregulated tactical weapons cannot be listed for rent'
      ],
      optionalFacts: ['Enforcement action is immediate listing block and security escalation'],
      forbiddenClaims: ['Guns can be rented with valid license', 'Firearms allowed for security providers'],
      authorityClass: 'POLICY_AUTHORITY',
      authorityReference: 'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY',
      specificEntity: 'firearm'
    },
    aliases: [
      { text: 'Can I list a gun?', style: 'SHORT' },
      { text: 'Can I list a firearm on RENTipid?', style: 'PLAIN' },
      { text: 'Can I rent out firearms on RENTipid?', style: 'PLAIN' },
      { text: 'pwede ba magpa-rent ng baril?', style: 'TAGLISH' },
      { text: 'Are weapons allowed for rent?', style: 'FORMAL' },
      { text: 'can i list a gun or pistol', style: 'PLAIN' }
    ]
  },
  {
    objectiveId: 'listing.item.eligibility.vehicles',
    canonicalQuestion: 'Can I list my motorcycle or car for rent on RENTipid?',
    domain: 'Marketplace & Listings',
    subdomain: 'Category Eligibility',
    lifecycleStage: 'LISTING_CREATION',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'Cars and Motorcycles is a supported RENTipid rental category',
        'Listing requires proof of vehicle ownership/OR-CR, valid registration, and standard listing review'
      ],
      optionalFacts: ['Comprehensive vehicle insurance and security deposit are required before publication'],
      forbiddenClaims: ['Vehicles are prohibited', 'No documents required for cars'],
      authorityClass: 'POLICY_AUTHORITY',
      authorityReference: 'RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY',
      specificEntity: 'vehicles'
    },
    aliases: [
      { text: 'Can I rent out my motorcycle?', style: 'PLAIN' },
      { text: 'Can I list a car on RENTipid?', style: 'PLAIN' },
      { text: 'Can I list a car?', style: 'SHORT' },
      { text: 'pwede ba ipa-rent ang motor ko?', style: 'TAGLISH' },
      { text: 'pwede ba magpa rent ng sasakyan o kotse', style: 'TAGLISH' },
      { text: 'Vehicle rental listing requirements', style: 'FORMAL' }
    ]
  },

  // =========================================================================
  // 2. LISTING CREATION, EDITING & APPROVAL WORKFLOW
  // =========================================================================
  {
    objectiveId: 'listing.create.how_to',
    canonicalQuestion: 'How do I create a listing on RENTipid?',
    domain: 'Listings',
    subdomain: 'Creation Workflow',
    lifecycleStage: 'LISTING_CREATION',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'Navigate to Provider Dashboard > Listings > Add New Listing',
        'Provide title, description, category, clear photos, and daily rental rate',
        'Specify availability calendar, deposit requirement, and pickup/delivery options',
        'Submit for listing review and verification'
      ],
      optionalFacts: ['Listing drafts can be saved before final submission'],
      forbiddenClaims: [
        'Click book now to create listing',
        'Enter renter payment details to create listing'
      ],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-listings'
    },
    aliases: [
      { text: 'How do I create a listing?', style: 'SHORT' },
      { text: 'How do I add an item to rent out?', style: 'PLAIN' },
      { text: 'How to list an item', style: 'SHORT' },
      { text: 'paano mag-post ng item for rent?', style: 'TAGLISH' },
      { text: 'paano mag-create ng listing sa rentipid', style: 'TAGLISH' },
      { text: 'Where do I create a listing?', style: 'PLAIN' },
      { text: 'hw do i lst my equipment', style: 'TYPO' },
      { text: 'I want to list something on RENTipid', style: 'COLLOQUIAL' }
    ]
  },
  {
    objectiveId: 'listing.review.reason',
    canonicalQuestion: 'Why is my listing under review or pending approval?',
    domain: 'Listings',
    subdomain: 'Listing Status',
    lifecycleStage: 'LISTING_SUBMISSION',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'New and modified listings undergo automated screening and compliance review',
        'Review verifies category accuracy, prohibited item screening, and image quality',
        'Review is typically completed within 24 hours'
      ],
      optionalFacts: ['High-risk categories require permit and document verification'],
      forbiddenClaims: ['Listings are never reviewed', 'Payment is required for review approval'],
      authorityClass: 'POLICY_PLUS_LIVE',
      authorityReference: 'AUTHORIZED_LISTING_PROVIDER_SERVICE',
      liveServiceKey: 'AUTHORIZED_LISTING_PROVIDER_SERVICE'
    },
    aliases: [
      { text: 'Why is my listing pending?', style: 'SHORT' },
      { text: 'Why is my listing not active yet?', style: 'PLAIN' },
      { text: 'bakit pending pa listing ko?', style: 'TAGLISH' },
      { text: 'bakit under review pa item ko', style: 'TAGLISH' },
      { text: 'How long does listing approval take?', style: 'PLAIN' }
    ]
  },

  // =========================================================================
  // 3. RENTER PAYMENTS, DEPOSITS & REFUNDS
  // =========================================================================
  {
    objectiveId: 'renter.payment.methods',
    canonicalQuestion: 'How can I pay for a rental on RENTipid?',
    domain: 'Payments',
    subdomain: 'Payment Methods',
    lifecycleStage: 'BOOKING_PAYMENT',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Supported payment methods include GCash, Maya, Debit/Credit Cards (Visa/Mastercard), and Online Banking via PayMongo',
        'All transactions are processed securely in Philippine Peso (PHP) through RENTipid checkout',
        'Direct cash payments to providers outside the platform violate terms and void protection'
      ],
      optionalFacts: ['All payments must be completed through RENTipid secure checkout'],
      forbiddenClaims: ['Cryptocurrency is accepted', 'Direct bank transfer to provider allowed'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.payment-status-currency',
      knowledgeSourceKey: 'provider.payment-status-currency',
      knowledgeSectionKey: 'provider-payment-status-currency:payment-and-currency-status'
    },
    aliases: [
      { text: 'how can i pay for rented item?', style: 'PLAIN' },
      { text: 'What payment methods are supported?', style: 'FORMAL' },
      { text: 'How do I pay for a booking?', style: 'PLAIN' },
      { text: 'Can I pay using GCash or Maya?', style: 'PLAIN' },
      { text: 'pwede ba gcash o credit card pambayad?', style: 'TAGLISH' },
      { text: 'paano magbayad ng rental sa rentipid', style: 'TAGLISH' },
      { text: 'Payment options for renters', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'renter.payment.failure',
    canonicalQuestion: 'Why did my payment fail and how do I retry?',
    domain: 'Payments',
    subdomain: 'Payment Failure',
    lifecycleStage: 'BOOKING_PAYMENT',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Payment failures typically occur due to insufficient funds, 3D Secure authentication timeouts, or card issuer risk blocks',
        'Verify your account balance and ensure OTP/3DS verification is completed within the payment gateway window',
        'You can retry payment with an alternative method (GCash, Maya, or another Debit/Credit card) from the checkout screen'
      ],
      optionalFacts: ['If your card was charged but the booking is unpaid, the temporary hold is automatically reversed within 24–48 hours'],
      forbiddenClaims: ['Failed payments are kept by RENTipid', 'Cash payment can be arranged after failure'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.payment-status-currency',
      knowledgeSourceKey: 'provider.payment-status-currency'
    },
    aliases: [
      { text: 'Why did my payment fail?', style: 'SHORT' },
      { text: 'Payment was declined how to fix?', style: 'PLAIN' },
      { text: 'bakit na-decline ang payment ko?', style: 'TAGLISH' },
      { text: 'failed ang card payment paano mag-retry', style: 'TAGLISH' },
      { text: 'Payment error at checkout', style: 'PLAIN' }
    ]
  },
  {
    objectiveId: 'renter.payment.authorization',
    canonicalQuestion: 'Was my payment authorized and confirmed for this booking?',
    domain: 'Payments',
    subdomain: 'Payment Authorization',
    lifecycleStage: 'BOOKING_PAYMENT',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Payment authorization is confirmed upon successful transaction capture via PayMongo',
        'A confirmation email and booking receipt are immediately sent to your registered email address',
        'Live payment authorization state is visible in Renter Dashboard > Bookings'
      ],
      optionalFacts: ['If payment is authorized, booking state transitions from PENDING_PAYMENT to CONFIRMED'],
      forbiddenClaims: ['Payment authorization takes weeks', 'PayMongo does not notify users'],
      authorityClass: 'LIVE_SERVICE',
      authorityReference: 'AUTHORIZED_PAYMENT_SERVICE',
      liveServiceKey: 'AUTHORIZED_PAYMENT_SERVICE'
    },
    aliases: [
      { text: 'Was my payment authorized?', style: 'SHORT' },
      { text: 'Did my booking payment go through?', style: 'PLAIN' },
      { text: 'pumasok ba ang bayad ko?', style: 'TAGLISH' },
      { text: 'authorized na ba payment ko sa booking', style: 'TAGLISH' },
      { text: 'Check booking payment status', style: 'FORMAL' }
    ]
  },
  {
    objectiveId: 'renter.deposit.release',
    canonicalQuestion: 'When and how do I get my security deposit back?',
    domain: 'Payments',
    subdomain: 'Security Deposit',
    lifecycleStage: 'POST_RETURN',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Security deposits are released after successful post-rental inspection and return confirmation',
        'If no damage or loss is reported within the inspection window (typically 24–48 hours), the deposit hold is automatically released',
        'Deposit funds are credited back to the original payment method according to bank processing timelines (1–5 business days)'
      ],
      optionalFacts: ['If a damage claim is filed, the deposit is held until claim resolution'],
      forbiddenClaims: ['Deposit is given to provider in cash', 'Deposit is non-refundable'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.payment-status-currency',
      knowledgeSourceKey: 'provider.payment-status-currency'
    },
    aliases: [
      { text: 'When do I get my deposit back?', style: 'PLAIN' },
      { text: 'When is my deposit refunded?', style: 'PLAIN' },
      { text: 'How do I get my deposit back?', style: 'SHORT' },
      { text: 'kailan maibabalik ang security deposit ko?', style: 'TAGLISH' },
      { text: 'kailan babalik deposit ko', style: 'TAGLISH' },
      { text: 'Deposit release timeline', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'renter.refund.request_how_to',
    canonicalQuestion: 'How do I request a refund for a rental on RENTipid?',
    domain: 'Payments',
    subdomain: 'Refunds',
    lifecycleStage: 'CANCELLATION_OR_DISPUTE',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'For booking cancellations, navigate to Dashboard > Bookings > Cancel Booking before item handover; refunds are automatically initiated based on the listing cancellation policy',
        'If an item is defective, damaged, or not as described at handover, refuse the item and report the issue immediately in the app for a full refund',
        'For return disputes or deposit deductions, file an issue under Dashboard > Bookings > Report Issue',
        'Approved refunds are processed back to your original payment method (GCash, Maya, Card) within 3–7 business days'
      ],
      optionalFacts: ['Full refund applies if the provider cancels or if the item fails initial handover inspection'],
      forbiddenClaims: ['Refunds are paid in cash on the spot', 'Renters can demand arbitrary cash refunds from providers directly'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-claims-and-disputes'
    },
    aliases: [
      { text: 'how can i request for refund?', style: 'PLAIN' },
      { text: 'How do I ask for a refund?', style: 'PLAIN' },
      { text: 'Where do I request a refund?', style: 'SHORT' },
      { text: 'paano mag-request ng refund?', style: 'TAGLISH' },
      { text: 'paano humingi ng refund sa rentipid', style: 'TAGLISH' },
      { text: 'I want a refund what do I do', style: 'COLLOQUIAL' },
      { text: 'Refund request process', style: 'FORMAL' }
    ]
  },
  {
    objectiveId: 'renter.refund.status',
    canonicalQuestion: 'What is the status of my refund?',
    domain: 'Payments',
    subdomain: 'Refunds',
    lifecycleStage: 'CANCELLATION_OR_DISPUTE',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Refund eligibility depends on the cancellation policy and timing of cancellation',
        'Approved refunds are processed to the original payment method within 3–7 business days',
        'Live refund status can be tracked in Renter Dashboard > Payments & Refunds'
      ],
      optionalFacts: ['Full refund applies if provider cancels or item fails initial handover inspection'],
      forbiddenClaims: ['Refund is instant cash', 'Provider pays refund directly'],
      authorityClass: 'POLICY_PLUS_LIVE',
      authorityReference: 'AUTHORIZED_PAYMENT_SERVICE',
      liveServiceKey: 'AUTHORIZED_PAYMENT_SERVICE',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-claims-and-disputes'
    },
    aliases: [
      { text: 'Where is my refund?', style: 'SHORT' },
      { text: 'Did my refund go through?', style: 'PLAIN' },
      { text: 'bakit wala pa refund ko?', style: 'TAGLISH' },
      { text: 'saan na refund ko', style: 'TAGLISH' },
      { text: 'How long for refund processing?', style: 'PLAIN' }
    ]
  },
  {
    objectiveId: 'renter.refund.partial',
    canonicalQuestion: 'Why did I receive a partial refund for my canceled booking?',
    domain: 'Payments',
    subdomain: 'Refunds',
    lifecycleStage: 'CANCELLATION_OR_DISPUTE',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Partial refunds occur when cancellations are made outside the full-refund window according to the listing’s cancellation policy',
        'The security deposit is always refunded in full if the rental was canceled prior to item handover',
        'Platform service fees may be non-refundable for renter-initiated late cancellations'
      ],
      optionalFacts: ['Review the specific cancellation terms agreed upon during booking checkout'],
      forbiddenClaims: ['All cancellations receive 100% refund regardless of timing', 'Providers set arbitrary refund amounts after booking'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'route.terms',
      knowledgeSourceKey: 'route.terms',
      knowledgeSectionKey: 'route-terms:rentipid-terms-and-conditions-booking-and-payments'
    },
    aliases: [
      { text: 'Why is my refund partial?', style: 'SHORT' },
      { text: 'Why did I only get part of my money back?', style: 'PLAIN' },
      { text: 'bakit bawas ang refund ko?', style: 'TAGLISH' },
      { text: 'bakit kalahati lang refund sa na-cancel na booking', style: 'TAGLISH' },
      { text: 'Partial refund explanation', style: 'FORMAL' }
    ]
  },
  {
    objectiveId: 'renter.chargeback.dispute',
    canonicalQuestion: 'What happens if a chargeback or payment reversal is filed?',
    domain: 'Payments',
    subdomain: 'Chargebacks & Reversals',
    lifecycleStage: 'POST_RENTAL_OR_DISPUTE',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Chargebacks initiated through your credit card issuer or bank trigger an immediate transaction hold and compliance review',
        'Users should report billing issues directly through RENTipid Help Center before filing a bank dispute',
        'Fraudulent chargebacks violate platform terms and may lead to account suspension'
      ],
      optionalFacts: ['Dispute evidence including rental agreements and handover signatures will be submitted to the card network'],
      forbiddenClaims: ['Chargebacks are processed without bank review', 'Chargebacks result in immediate cash payouts'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status'
    },
    aliases: [
      { text: 'What is this chargeback?', style: 'SHORT' },
      { text: 'How do chargebacks work on RENTipid?', style: 'PLAIN' },
      { text: 'paano ang chargeback o payment reversal?', style: 'TAGLISH' },
      { text: 'binaligtad ng bangko ang bayad ano mangyayari', style: 'TAGLISH' },
      { text: 'Payment reversal procedure', style: 'FORMAL' }
    ]
  },

  // =========================================================================
  // 4. PROVIDER EARNINGS & PAYOUTS
  // =========================================================================
  {
    objectiveId: 'provider.payout.schedule',
    canonicalQuestion: 'When and how do providers get paid for completed rentals?',
    domain: 'Payments',
    subdomain: 'Provider Payouts',
    lifecycleStage: 'POST_RENTAL_EARNINGS',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'Rental earnings are credited to the Provider Ledger after the return inspection window closes without disputes',
        'Payouts are disbursed to the verified bank account or e-wallet linked in Provider Settings',
        'Standard payout settlement occurs according to the platform disbursement schedule and bank processing timelines'
      ],
      optionalFacts: ['Platform service fees and applicable withholding are deducted prior to payout'],
      forbiddenClaims: ['Provider is paid before handover', 'Renter pays provider in cash'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.payment-status-currency',
      knowledgeSourceKey: 'provider.payment-status-currency',
      knowledgeSectionKey: 'provider-payment-status-currency:payment-and-currency-status-provider-payout-process'
    },
    aliases: [
      { text: 'When will I get paid for my rental?', style: 'PLAIN' },
      { text: 'How do provider payouts work?', style: 'FORMAL' },
      { text: 'kailan papasok ang payout ko?', style: 'TAGLISH' },
      { text: 'paano makukuha ang kita o earnings sa rentipid', style: 'TAGLISH' },
      { text: 'How do I withdraw my earnings?', style: 'PLAIN' }
    ]
  },
  {
    objectiveId: 'provider.payout.status',
    canonicalQuestion: 'Where is my payout and why is it pending or on hold?',
    domain: 'Payments',
    subdomain: 'Provider Payouts',
    lifecycleStage: 'POST_RENTAL_EARNINGS',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'Payouts may be on hold due to pending post-rental inspection, open dispute/damage claims, or unverified payout bank account',
        'Live payout state is available in Provider Dashboard > Payouts',
        'If bank details are missing or unverified, update KYC and payout destination in settings'
      ],
      optionalFacts: ['First-time provider payouts may have a one-time compliance verification hold'],
      forbiddenClaims: ['Money is lost', 'Renter canceled after rental completion'],
      authorityClass: 'LIVE_SERVICE',
      authorityReference: 'AUTHORIZED_PAYOUT_FINANCE_SERVICE',
      liveServiceKey: 'AUTHORIZED_PAYOUT_FINANCE_SERVICE',
      knowledgeSourceKey: 'provider.payment-status-currency',
      knowledgeSectionKey: 'provider-payment-status-currency:payment-and-currency-status-provider-payout-process'
    },
    aliases: [
      { text: 'Where is my payout?', style: 'SHORT' },
      { text: 'Why is my payout on hold?', style: 'PLAIN' },
      { text: 'saan na payout ko bakit pending pa?', style: 'TAGLISH' },
      { text: 'saan na pera ko bilang provider', style: 'TAGLISH' },
      { text: 'Payout delay reasons', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'provider.earnings.breakdown',
    canonicalQuestion: 'How much did I earn from my rentals and what fees were deducted?',
    domain: 'Payments',
    subdomain: 'Provider Earnings',
    lifecycleStage: 'POST_RENTAL_EARNINGS',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'Net earnings equal total rental fees minus the standard platform service fee and any applicable withholding taxes',
        'A detailed financial ledger breakdown for every transaction is accessible under Provider Dashboard > Earnings & Analytics',
        'Security deposits are held in escrow for the renter and are not included in provider gross earnings'
      ],
      optionalFacts: ['Exportable monthly earnings statements are available in the provider financial reports section'],
      forbiddenClaims: ['Platform takes 100% of earnings', 'Security deposits are credited to provider revenue'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.payment-status-currency',
      knowledgeSourceKey: 'provider.payment-status-currency'
    },
    aliases: [
      { text: 'How much did I earn?', style: 'SHORT' },
      { text: 'What fees were deducted from my earnings?', style: 'PLAIN' },
      { text: 'magkano ang kinita ko sa rentals?', style: 'TAGLISH' },
      { text: 'magkano ang bawas na platform fee sa payout', style: 'TAGLISH' },
      { text: 'Earnings and fee breakdown', style: 'FORMAL' }
    ]
  },
  {
    objectiveId: 'provider.tax_withholding',
    canonicalQuestion: 'What tax withholding and BIR guidelines apply to provider earnings?',
    domain: 'Payments',
    subdomain: 'Taxes & Withholding',
    lifecycleStage: 'POST_RENTAL_EARNINGS',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'RENTipid complies with Philippine Bureau of Internal Revenue (BIR) regulations regarding digital marketplace operators',
        'Business and high-volume individual providers must provide registered TIN and BIR Certificate of Registration (Form 2303)',
        'Applicable withholding tax certificates (BIR Form 2307) are issued periodically for qualifying registered merchants'
      ],
      optionalFacts: ['Providers remain responsible for filing their regular annual income tax and VAT/percentage tax returns'],
      forbiddenClaims: ['RENTipid pays personal income taxes for providers', 'Tax compliance is completely optional'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'compliance.global-legal-register',
      knowledgeSourceKey: 'compliance.global-legal-register',
      knowledgeSectionKey: 'compliance-global-legal-register:rentipid-global-legal-compliance-register-in-app-positioning-blueprint-v1-0-3-philippine-baselin'
    },
    aliases: [
      { text: 'What withholding was applied?', style: 'SHORT' },
      { text: 'Are provider earnings subject to BIR tax?', style: 'PLAIN' },
      { text: 'may kaltas ba na withholding tax sa kita ko?', style: 'TAGLISH' },
      { text: 'paano ang BIR tax sa rentipid earnings', style: 'TAGLISH' },
      { text: 'Tax requirements for providers', style: 'FORMAL' }
    ]
  },

  // =========================================================================
  // 5. INSURANCE & RENTAL PROTECTION
  // =========================================================================
  {
    objectiveId: 'rental.damage.general',
    canonicalQuestion: 'What happens if an item is damaged during a rental?',
    domain: 'Insurance',
    subdomain: 'Damage & Incidents',
    lifecycleStage: 'ACTIVE_RENTAL_OR_POST_RETURN',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Report any damage immediately upon discovery or during the return inspection window (24–48 hours)',
        'Provide clear photos, videos, pre-rental and post-rental inspection records, and repair or replacement cost estimates',
        'The security deposit held in escrow is utilized first for verified damage deductions',
        'RENTipid platform rental protection covers verified accidental damage and total loss (excluding normal wear and tear and intentional damage)',
        'If the renter and provider cannot agree, submit a formal claim under Dashboard > Bookings > Report Issue / File Claim for platform dispute evaluation'
      ],
      optionalFacts: ['Commercial third-party insurance carrier certificates are not currently active; protection is mediated via platform escrow and claims'],
      forbiddenClaims: [
        'Damage claims are paid out in cash instantly without inspection',
        'Wear and tear is covered by damage claims',
        'Active commercial insurance certificate can be downloaded'
      ],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-claims-and-disputes'
    },
    aliases: [
      { text: 'what happens if the item rented is damaged?', style: 'PLAIN' },
      { text: 'What happens if I damage the item?', style: 'PLAIN' },
      { text: 'What if the item breaks during rental?', style: 'PLAIN' },
      { text: 'paano kung masira ang gamit na nirentahan?', style: 'TAGLISH' },
      { text: 'nasira ko yung rental ano mangyayari', style: 'TAGLISH' },
      { text: 'Damage procedure during rental', style: 'FORMAL' },
      { text: 'what if item is broken', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'insurance.coverage.scope',
    canonicalQuestion: 'What does RENTipid insurance and rental protection cover?',
    domain: 'Insurance',
    subdomain: 'Coverage Scope',
    lifecycleStage: 'BOOKING_OR_ACTIVE_RENTAL',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'RENTipid provides platform rental protection and escrow deposit holding for verified rentals during the active rental window',
        'Commercial third-party insurance underwriting and carrier policy certificates are not currently active on the platform',
        'Rental protection covers verified accidental damage and total loss during rental, while normal wear and tear, intentional damage, and prohibited items are excluded'
      ],
      optionalFacts: ['Damage compensation is mediated through post-rental return inspections and security deposit adjustments'],
      forbiddenClaims: [
        'RENTipid offers active third-party commercial insurance policies',
        'Download commercial insurance certificate',
        'Specific commercial underwriter provides automatic cash payouts',
        'Wear and tear is covered'
      ],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-claims-and-disputes'
    },
    aliases: [
      { text: 'What does insurance cover?', style: 'SHORT' },
      { text: 'Does RENTipid have insurance?', style: 'PLAIN' },
      { text: 'What is covered by rental protection?', style: 'FORMAL' },
      { text: 'covered ba ito kung masira ng renter?', style: 'TAGLISH' },
      { text: 'may insurance ba ang rental sa rentipid', style: 'TAGLISH' },
      { text: 'Is accidental damage covered?', style: 'PLAIN' },
      { text: 'Insurance coverage details', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'insurance.claim.filing',
    canonicalQuestion: 'How do I file a damage or insurance claim after a rental incident?',
    domain: 'Insurance',
    subdomain: 'Claims Intake',
    lifecycleStage: 'INCIDENT_OR_POST_RETURN',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Report the incident and file a claim promptly through the platform following return inspection',
        'Submit photographic and video evidence, pre-rental and post-rental inspection reports, and repair/replacement cost estimates',
        'Claims are submitted through Dashboard > Bookings > Report Issue / File Claim',
        'The claims evaluation team reviews submitted evidence before authorizing payout or deposit deduction'
      ],
      optionalFacts: ['For theft or criminal acts, a formal police report is required'],
      forbiddenClaims: [
        'Claims are paid out immediately with no evidence',
        'Claims can be filed months after rental completion'
      ],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-claims-and-disputes'
    },
    aliases: [
      { text: 'How do I file a claim?', style: 'SHORT' },
      { text: 'What if the renter breaks my item?', style: 'PLAIN' },
      { text: 'paano mag-claim kung nasira ang gamit?', style: 'TAGLISH' },
      { text: 'paano mag-file ng damage claim', style: 'TAGLISH' },
      { text: 'Damage reporting process', style: 'FORMAL' }
    ]
  },
  {
    objectiveId: 'insurance.claim.status',
    canonicalQuestion: 'What is the status of my active damage or insurance claim?',
    domain: 'Insurance',
    subdomain: 'Claims Status',
    lifecycleStage: 'DISPUTE_OR_CLAIM_REVIEW',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Active claim status, submitted evidence, and adjuster evaluation notes are tracked in the Claims Management Center',
        'Claims progress through SUBMITTED, UNDER_REVIEW, EVIDENCE_REQUESTED, and RESOLVED states',
        'Final determinations specify approved repair deductions or deposit release'
      ],
      optionalFacts: ['You will receive an in-app notification when an adjuster requests additional evidence'],
      forbiddenClaims: ['Payment service arbitrates damage claims', 'Claim status is unavailable'],
      authorityClass: 'LIVE_SERVICE',
      authorityReference: 'AUTHORIZED_CLAIM_CASE_SERVICE',
      liveServiceKey: 'AUTHORIZED_CLAIM_CASE_SERVICE'
    },
    aliases: [
      { text: 'What is my claim status?', style: 'SHORT' },
      { text: 'Where is my damage claim update?', style: 'PLAIN' },
      { text: 'kumusta na ang damage claim ko?', style: 'TAGLISH' },
      { text: 'ano na status ng claim ko sa nasirang gamit', style: 'TAGLISH' },
      { text: 'Check damage claim progress', style: 'FORMAL' }
    ]
  },

  // =========================================================================
  // 6. BOOKING LIFECYCLE & CANCELLATIONS
  // =========================================================================
  {
    objectiveId: 'booking.cancel.process',
    canonicalQuestion: 'How do I cancel my booking and what are the cancellation terms?',
    domain: 'Bookings',
    subdomain: 'Cancellations',
    lifecycleStage: 'PENDING_OR_CONFIRMED_BOOKING',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Bookings can be canceled from Dashboard > Bookings > Select Booking > Cancel',
        'Refund amount depends on cancellation lead time relative to the rental start date and the applicable cancellation policy',
        'If the provider cancels, the renter receives a 100% full refund including security deposit and service fees'
      ],
      optionalFacts: ['Active rentals already in progress cannot be unilaterally canceled without return inspection'],
      forbiddenClaims: ['Cancellations are never refundable', 'Renters cannot cancel after confirmation'],
      authorityClass: 'ACTION_TOOL',
      authorityReference: 'cancelBooking',
      toolKey: 'cancelBooking'
    },
    aliases: [
      { text: 'how can i cancel rental booking?', style: 'PLAIN' },
      { text: 'How do I cancel a booking?', style: 'SHORT' },
      { text: 'Can I cancel my rental reservation?', style: 'PLAIN' },
      { text: 'paano mag-cancel ng booking?', style: 'TAGLISH' },
      { text: 'paano mag-cancel ng rental reservation', style: 'TAGLISH' },
      { text: 'What happens if I cancel my booking?', style: 'PLAIN' }
    ]
  },
  {
    objectiveId: 'booking.extension.process',
    canonicalQuestion: 'How do I extend an active rental period?',
    domain: 'Bookings',
    subdomain: 'Modifications & Extensions',
    lifecycleStage: 'ACTIVE_RENTAL',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Rental extensions must be requested through Dashboard > Active Bookings > Request Extension prior to the scheduled return time',
        'Extensions require provider approval and payment authorization for the additional rental days',
        'Unapproved late returns may incur late return penalties and jeopardize insurance coverage'
      ],
      optionalFacts: ['If provider declines extension, the item must be returned at original scheduled time'],
      forbiddenClaims: ['Extensions are automatic without provider consent', 'Late returns are free'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-booking-process'
    },
    aliases: [
      { text: 'Can I extend my rental days?', style: 'PLAIN' },
      { text: 'How to add more days to my booking?', style: 'PLAIN' },
      { text: 'pwede ba i-extend ang rental?', style: 'TAGLISH' },
      { text: 'paano magdagdag ng araw sa rental', style: 'TAGLISH' },
      { text: 'Rental extension procedure', style: 'SHORT' }
    ]
  },

  // =========================================================================
  // 7. ACCOUNT, KYC & SECURITY
  // =========================================================================
  {
    objectiveId: 'account.kyc.verification',
    canonicalQuestion: 'How do I verify my identity (KYC) on RENTipid?',
    domain: 'Account',
    subdomain: 'Identity & KYC',
    lifecycleStage: 'ONBOARDING',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Navigate to Account Settings > Identity Verification (KYC)',
        'Upload a valid government-issued ID (Passport, UMID, Driver’s License, National ID) and a clear selfie for facial verification',
        'Business providers must also submit DTI/SEC registration, BIR Certificate of Registration, and Mayor’s Permit',
        'Verification is typically completed within 1–24 hours'
      ],
      optionalFacts: ['Unverified accounts cannot publish listings or execute high-value bookings'],
      forbiddenClaims: ['KYC is never required', 'Expired IDs are accepted'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'core.registration-onboarding',
      knowledgeSourceKey: 'core.registration-onboarding',
      knowledgeSectionKey: 'core-registration-onboarding:rentipid-account-registration-provider-onboarding-provider-onboarding-and-kyc'
    },
    aliases: [
      { text: 'How do I verify KYC?', style: 'SHORT' },
      { text: 'How do I complete KYC verification?', style: 'FORMAL' },
      { text: 'What documents are required to become a provider?', style: 'PLAIN' },
      { text: 'paano mag-verify ng ID sa rentipid?', style: 'TAGLISH' },
      { text: 'paano magpa-verify ng account', style: 'TAGLISH' },
      { text: 'ID verification requirements', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'account.password.reset',
    canonicalQuestion: 'How do I reset my password if I forgot it?',
    domain: 'Account',
    subdomain: 'Authentication',
    lifecycleStage: 'PRE_OR_POST_LOGIN',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Go to the Login page and click "Forgot Password?"',
        'Enter your registered email address to receive a secure password reset link',
        'Password reset links expire after 1 hour for security',
        'If MFA is enabled, you may be prompted for your secondary verification factor or recovery code'
      ],
      optionalFacts: ['Contact support if you no longer have access to your registered email'],
      forbiddenClaims: ['Support agents can see your password', 'Password reset links never expire'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'core.registration-onboarding',
      knowledgeSourceKey: 'core.registration-onboarding',
      knowledgeSectionKey: 'core-registration-onboarding:rentipid-account-registration-provider-onboarding'
    },
    aliases: [
      { text: 'I forgot my password how to reset?', style: 'PLAIN' },
      { text: 'How do I change my password?', style: 'SHORT' },
      { text: 'nakalimutan ko password ko paano ma-recover?', style: 'TAGLISH' },
      { text: 'paano mag-reset ng password', style: 'TAGLISH' },
      { text: 'Password recovery steps', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'provider.profile.public_vs_private',
    canonicalQuestion: 'May I see or know the provider\'s account details when renting?',
    domain: 'Account',
    subdomain: 'Profile & Privacy',
    lifecycleStage: 'EVALUATING_OR_BOOKING',
    persona: 'RENTER',
    answerContract: {
      requiredFacts: [
        'Renters can view the provider\'s public profile including display name, verified badge status, overall ratings, customer reviews, and active listings',
        'All communication with the provider must take place securely through RENTipid in-app messaging',
        'Private account credentials including bank accounts, payout destinations, e-wallet details, government IDs, KYC documents, TIN, and login passwords are strictly confidential and never shared',
        'All payments and security deposits are handled exclusively through RENTipid secure platform checkout—renters never pay into a provider\'s personal bank account'
      ],
      optionalFacts: ['Business providers may display their registered business name on approved public listings'],
      forbiddenClaims: [
        'Renters receive the provider\'s private bank account number',
        'Providers share bank details to receive direct wire transfers'
      ],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'core.registration-onboarding',
      knowledgeSourceKey: 'core.registration-onboarding',
      knowledgeSectionKey: 'core-registration-onboarding:rentipid-account-registration-provider-onboarding'
    },
    aliases: [
      { text: 'may i know the account of provider when i rent his property?', style: 'PLAIN' },
      { text: 'Can I see the provider\'s account details?', style: 'PLAIN' },
      { text: 'Can I get the provider\'s bank account to pay?', style: 'PLAIN' },
      { text: 'makikita ko ba account ng provider kapag nag-rent?', style: 'TAGLISH' },
      { text: 'makikita ba bank account ng owner', style: 'TAGLISH' },
      { text: 'Provider profile visibility and account privacy', style: 'FORMAL' },
      { text: 'Can I see provider details', style: 'SHORT' }
    ]
  },

  // =========================================================================
  // 8. CLARIFICATION & DEPRECATED / UNSUPPORTED FEATURES
  // =========================================================================
  {
    objectiveId: 'query.clarification.ambiguous_funds',
    canonicalQuestion: 'Where is my money or payment?',
    domain: 'Help & Support',
    subdomain: 'Clarification',
    lifecycleStage: 'ANY_POST_TRANSACTION',
    persona: 'ALL_CUSTOMERS',
    answerContract: {
      requiredFacts: [
        'Please clarify if you are asking about a Renter Security Deposit Refund, Renter Booking Refund, or Provider Rental Earnings Payout',
        'Specify your Booking Reference or transaction date so we can assist you accurately'
      ],
      optionalFacts: ['You can view active refunds under Payments & Refunds and provider earnings under Payouts'],
      forbiddenClaims: ['Funds are lost', 'All balances are zero'],
      authorityClass: 'CLARIFICATION_REQUIRED',
      authorityReference: 'provider.payment-status-currency',
      knowledgeSourceKey: 'provider.payment-status-currency',
      clarificationPrompt: 'Please specify whether you are asking about a security deposit return, a booking refund, or provider payout earnings.'
    },
    aliases: [
      { text: 'Where is my money?', style: 'SHORT' },
      { text: 'What happened to my money?', style: 'PLAIN' },
      { text: 'nasaan ang pera ko?', style: 'TAGLISH' },
      { text: 'saan na pera ko', style: 'TAGLISH' },
      { text: 'Where is the cash', style: 'SHORT' }
    ]
  },
  {
    objectiveId: 'feature.deprecated.listingbridge',
    canonicalQuestion: 'Can I import listings automatically using ListingBridge?',
    domain: 'Listings',
    subdomain: 'Import & Integrations',
    lifecycleStage: 'LISTING_CREATION',
    persona: 'PROVIDER',
    answerContract: {
      requiredFacts: [
        'ListingBridge external listing import has been retired',
        'All listings on RENTipid are created and managed directly through the Manual Listing Creation workflow in Provider Dashboard',
        'Direct manual creation ensures accurate compliance screening, verified photos, and standard deposit configurations'
      ],
      optionalFacts: ['Drafts can be saved at any time during manual listing creation'],
      forbiddenClaims: ['ListingBridge is still active', 'External sync is supported'],
      authorityClass: 'STATIC_KNOWLEDGE',
      authorityReference: 'provider.workflow-status',
      knowledgeSourceKey: 'provider.workflow-status',
      knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-listings'
    },
    aliases: [
      { text: 'Can I use ListingBridge?', style: 'SHORT' },
      { text: 'How to import listings from external sites?', style: 'PLAIN' },
      { text: 'pwede ba automatic listing sync?', style: 'TAGLISH' },
      { text: 'ListingBridge sync status', style: 'FORMAL' }
    ]
  }
];

export function getCustomerObjective(objectiveId: string): CustomerObjectiveDefinition | undefined {
  return CANONICAL_CUSTOMER_OBJECTIVES.find(o => o.objectiveId === objectiveId);
}


