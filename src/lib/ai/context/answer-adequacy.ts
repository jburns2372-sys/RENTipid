import type {
  CustomerQuestionIntent,
  RentipidQuestionClassification,
} from './question-classifier';
import { isCustomerAnswerableText } from './customer-knowledge-projection';

export interface AnswerAdequacyInput {
  classification: RentipidQuestionClassification;
  message: string;
  materialClaims: readonly { text: string; evidenceRefs: readonly string[] }[];
  safelyUncertain: boolean;
}

export interface AnswerAdequacyResult {
  pass: boolean;
  reasons: readonly string[];
}

function conceptCount(message: string, concepts: readonly RegExp[]): number {
  return concepts.filter(concept => concept.test(message)).length;
}

function procedureCount(message: string): number {
  return (message.match(/^\d+[.)]\s+/gm) ?? []).length;
}

function intentAdequate(intent: CustomerQuestionIntent, input: AnswerAdequacyInput): boolean {
  const message = input.message;
  if (input.safelyUncertain) return true;
  if (intent === 'BOOKING_PROCESS') {
    return procedureCount(message) >= 3 && conceptCount(message, [
      /\b(?:browse|listing)\b/i,
      /\b(?:date|duration|request)\b/i,
      /\bprovider\b.{0,30}\b(?:approve|accept)|\b(?:approve|accept)\b.{0,30}\bprovider\b/i,
      /\b(?:payment|agreement|pickup|delivery|turnover|return|inspection)\b/i,
    ]) >= 3;
  }
  if (intent === 'PROVIDER_PAYMENT_PROCESS') {
    return procedureCount(message) >= 2 && conceptCount(message, [
      /\b(?:payout|payment|earnings)\b/i,
      /\b(?:eligible|completed|approved|finance review|manual)\b/i,
      /\b(?:my payouts|provider dashboard|status|statement)\b/i,
      /\b(?:processed|receive|transfer)\b/i,
    ]) >= 3;
  }
  if (intent === 'CREATE_LISTING') {
    const noOnboardingReset = input.classification.providerContext !== 'EXISTING_PROVIDER'
      || !/\b(?:register as|provider onboarding|become a provider|kyc)\b/i.test(message);
    return noOnboardingReset && procedureCount(message) >= 3 && conceptCount(message, [
      /\b(?:provider listings|create new listing|listing)\b/i,
      /\b(?:details|title|description|category|rate|location)\b/i,
      /\bdraft\b/i,
      /\b(?:submit|review|publish)\b/i,
    ]) >= 3;
  }
  if (intent === 'CATEGORY_ELIGIBILITY') {
    const terms = input.classification.requestedCategoryTerms;
    if (terms.length === 0) return /\bsupported rental categories\b/i.test(message);
    return terms.every(term => {
      const root = term.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/s$/, '');
      return root.length > 1 && message.toLowerCase().includes(root);
    });
  }
  if (intent === 'REGISTRATION') {
    return procedureCount(message) >= 3 && conceptCount(message, [
      /\b(?:register|sign up|account)\b/i,
      /\b(?:name|email|mobile|address|location)\b/i,
      /\b(?:terms|privacy)\b/i,
      /\b(?:sign in|create)\b/i,
    ]) >= 3;
  }
  return message.trim().length >= 12;
}

export function validateAnswerAdequacy(input: AnswerAdequacyInput): AnswerAdequacyResult {
  const reasons: string[] = [];
  if (!input.message.trim()) reasons.push('EMPTY_RESPONSE');
  if (!isCustomerAnswerableText(input.message)) reasons.push('INTERNAL_CONTENT');
  if (input.materialClaims.some(claim => claim.evidenceRefs.length === 0)) reasons.push('UNGROUNDED_CLAIM');
  if (!intentAdequate(input.classification.intent, input)) reasons.push('INTENT_NOT_ANSWERED');
  return { pass: reasons.length === 0, reasons };
}
