/**
 * RENTipid GLCC v1.0 — Multilingual AI & Digital Human Localization Contracts
 *
 * Work Package: GLCC-P8
 * Acceptance Targets: AI-01, AI-02
 *
 * Implements:
 * 1. Effective preference propagation into AI & Digital Human session contexts.
 * 2. Strict grounding of financial and contractual facts (PAYMENT_CONTRACT_CURRENCY = PHP).
 * 3. Multilingual prompt injection and security classification models (AI-02).
 * 4. Structured tool context boundaries ensuring client locale cannot elevate permissions.
 */

export interface GlccAiSessionContext {
  readonly language: string;
  readonly country: string;
  readonly displayCurrency: string;
  readonly chargeCurrency: 'PHP';
  readonly userRole: string;
  readonly channel: 'help' | 'digital_human' | 'contextual' | 'pwa';
  readonly conversationId: string;
}

export type MultilingualAttackClass =
  | 'PROMPT_INJECTION'
  | 'SYSTEM_PROMPT_EXTRACTION'
  | 'ROLE_ESCALATION'
  | 'FINANCIAL_OVERRIDE'
  | 'KYC_BYPASS'
  | 'POLICY_CIRCUMVENTION';

export interface MultilingualSecurityEvaluation {
  readonly isAllowed: boolean;
  readonly attackClass?: MultilingualAttackClass;
  readonly riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly matchedPattern?: string;
  readonly reason?: string;
}

export interface GroundedFinancialFact {
  readonly authoritativeAmountPhp: number;
  readonly currency: 'PHP';
  readonly purpose: string;
  readonly bookingId?: string;
  readonly displayEstimate?: {
    readonly amount: number;
    readonly currency: string;
    readonly rateUsed: number;
  };
}

export interface LocalizedAiDirectives {
  readonly systemLanguagePrompt: string;
  readonly factGroundingPrompt: string;
  readonly securityBoundaryPrompt: string;
}
