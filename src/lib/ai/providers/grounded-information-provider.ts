import OpenAI from 'openai';
import type { CustomerEvidenceBundle } from '../context/customer-evidence-bundle';
import type { StructuredCategoryFact } from '../context/structured-category-resolver';
import type { SemanticContextBundle } from '../semantic/contracts';
import { getOpenAIConfig } from './openai-config';
import { getCustomerObjective, CANONICAL_CUSTOMER_OBJECTIVES } from '../context/customer-objective-catalog';

export type GroundedComposerMode = 'GROUNDED_GENERATIVE' | 'DETERMINISTIC_FALLBACK';

export interface GroundedSynthesisClaim {
  text: string;
  evidenceRefs: readonly string[];
  supportingText: string;
}

export interface GroundedSynthesisOutput {
  answer: string;
  answeredIntent: string;
  coveredEntities: readonly string[];
  claims: readonly GroundedSynthesisClaim[];
}

export interface GroundedSynthesisInput {
  question: string;
  conversationContext: string;
  systemPrompt: string;
  bundle: CustomerEvidenceBundle;
  structuredCategoryFacts: readonly StructuredCategoryFact[];
  semanticContext?: SemanticContextBundle;
  attempt: 1 | 2;
}

export interface GroundedInformationProvider {
  readonly name: string;
  readonly mode: GroundedComposerMode;
  available(): boolean;
  synthesize(input: GroundedSynthesisInput): Promise<GroundedSynthesisOutput>;
}

function evidencePayload(bundle: CustomerEvidenceBundle) {
  return bundle.sections.map(section => ({
    sectionTitle: section.sectionTitle,
    domain: section.domain,
    entities: section.entities,
    chunks: section.chunks.map(chunk => ({
      evidenceRef: chunk.evidenceRef,
      content: chunk.content,
    })),
  }));
}

function synthesisPrompt(input: GroundedSynthesisInput): string {
  return [
    'Answer the customer question directly and naturally using only the approved RENTipid evidence supplied.',
    'Do not use outside knowledge as RENTipid factual authority.',
    'Do not expose source keys, chunk identifiers, storage, ingestion, implementation, test, or policy-engine metadata.',
    'Use simple English. Start with the direct answer. Use short steps only when useful.',
    'Return JSON only with: answer, answeredIntent, coveredEntities, claims.',
    'Each claim must contain text, evidenceRefs, and supportingText.',
    'supportingText must be a verbatim excerpt from the cited evidence and evidenceRefs must use supplied IDs.',
    'answeredIntent must equal the supplied classified intent when the question is answered.',
    'coveredEntities must list every requested entity addressed.',
    input.attempt === 2
      ? 'This is the single retry. Make the answer more direct and cover every requested entity without adding facts.'
      : '',
    `CLASSIFIED_INTENT: ${input.bundle.classification.intent}`,
    `REQUESTED_ENTITIES: ${JSON.stringify(input.bundle.requestedEntities)}`,
    `QUESTION: ${input.question}`,
    `SAFE_CONVERSATION_CONTEXT: ${input.conversationContext}`,
    input.semanticContext ? `SEMANTIC_HINTS: Intents=${JSON.stringify(input.semanticContext.intentHints.map(i => i.canonicalTerm))}, Entities=${JSON.stringify(input.semanticContext.entities.map(e => e.canonicalTerm))}` : '',
    `STRUCTURED_CATEGORY_FACTS: ${JSON.stringify(input.structuredCategoryFacts)}`,
    `APPROVED_CUSTOMER_EVIDENCE: ${JSON.stringify(evidencePayload(input.bundle))}`,
  ].filter(Boolean).join('\n');
}

function parseJsonText(value: string): GroundedSynthesisOutput {
  const clean = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(clean) as Partial<GroundedSynthesisOutput>;
  if (typeof parsed.answer !== 'string'
    || typeof parsed.answeredIntent !== 'string'
    || !Array.isArray(parsed.coveredEntities)
    || !Array.isArray(parsed.claims)) {
    throw new Error('GROUNDED_PROVIDER_INVALID_SHAPE');
  }
  const claims = parsed.claims.map(claim => {
    if (!claim || typeof claim !== 'object') throw new Error('GROUNDED_PROVIDER_INVALID_CLAIM');
    const record = claim as unknown as Record<string, unknown>;
    if (typeof record.text !== 'string'
      || typeof record.supportingText !== 'string'
      || !Array.isArray(record.evidenceRefs)
      || !record.evidenceRefs.every(ref => typeof ref === 'string')) {
      throw new Error('GROUNDED_PROVIDER_INVALID_CLAIM');
    }
    return {
      text: record.text,
      supportingText: record.supportingText,
      evidenceRefs: record.evidenceRefs as string[],
    };
  });
  return {
    answer: parsed.answer,
    answeredIntent: parsed.answeredIntent,
    coveredEntities: parsed.coveredEntities.filter((value): value is string => typeof value === 'string'),
    claims,
  };
}

class OpenAIGroundedProvider implements GroundedInformationProvider {
  readonly name = 'openai';
  readonly mode = 'GROUNDED_GENERATIVE' as const;
  private config = getOpenAIConfig();
  private client: OpenAI | null = null;

  constructor() {
    if (this.config.apiKey) {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        timeout: this.config.timeoutMs,
      });
    }
  }

  available(): boolean {
    return Boolean(this.client && this.config.groundedComposerEnabled);
  }

  async synthesize(input: GroundedSynthesisInput): Promise<GroundedSynthesisOutput> {
    if (!this.client) throw new Error('GROUNDED_PROVIDER_UNAVAILABLE');

    const response = await this.client.chat.completions.create({
      model: this.config.modelPrimary,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: synthesisPrompt(input) }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'grounded_synthesis_output',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              answer: { type: 'string' },
              answeredIntent: { type: 'string' },
              coveredEntities: {
                type: 'array',
                items: { type: 'string' }
              },
              claims: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    evidenceRefs: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    supportingText: { type: 'string' }
                  },
                  required: ['text', 'evidenceRefs', 'supportingText'],
                  additionalProperties: false
                }
              }
            },
            required: ['answer', 'answeredIntent', 'coveredEntities', 'claims'],
            additionalProperties: false
          }
        }
      },
      max_tokens: this.config.maxOutputTokens,
      store: this.config.storeResponses,
      temperature: this.config.temperature,
    });

    const outputText = response.choices[0]?.message?.content ?? '';
    if (!outputText) {
      throw new Error('GROUNDED_PROVIDER_EMPTY_RESPONSE');
    }
    
    return parseJsonText(outputText);
  }
}

class LocalGroundedComposerProvider implements GroundedInformationProvider {
  readonly name = 'local-grounded-composer';
  readonly mode = 'DETERMINISTIC_FALLBACK' as const;

  available(): boolean {
    return true; // Local composer is always available
  }

  async synthesize(input: GroundedSynthesisInput): Promise<GroundedSynthesisOutput> {
    if (input.bundle.sections.length === 0) {
      throw new Error('INSUFFICIENT_CUSTOMER_EVIDENCE');
    }

    const claims: GroundedSynthesisClaim[] = [];
    const allChunks = input.bundle.sections.flatMap(s => s.chunks);

    for (const chunk of allChunks) {
      claims.push({
        text: chunk.content,
        evidenceRefs: [chunk.evidenceRef],
        supportingText: chunk.content,
      });
    }

    // Match canonical objective from catalog
    const qLower = input.question.toLowerCase().trim();
    const qNorm = qLower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

    let matchingObjective = getCustomerObjective(input.bundle.classification.intent);
    if (!matchingObjective) {
      matchingObjective = CANONICAL_CUSTOMER_OBJECTIVES.find(o => {
        const canonicalNorm = o.canonicalQuestion.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (qNorm === canonicalNorm || qLower === o.canonicalQuestion.toLowerCase()) return true;
        return o.aliases.some(a => {
          const aNorm = a.text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          return qNorm === aNorm || qLower === a.text.toLowerCase() || (qNorm.length >= 8 && aNorm.length >= 8 && (qNorm.includes(aNorm) || aNorm.includes(qNorm)));
        });
      });
    }

    if (!matchingObjective) {
      const isPaymentMethods = /\b(?:payment methods?|pay for|pambayad|gcash|maya|paymongo|how can i pay|magbayad|payment options?)\b/i.test(qLower) && !/\b(?:payout|withdraw|earnings|kita)\b/i.test(qLower);
      const isDamage = /\b(?:damage|damaged|sira|nasira|inspection|deposit deduction|accident)\b/i.test(qLower);
      const isRefund = /\b(?:refund|refunds|ibalik ang pera|request for refund|how to refund)\b/i.test(qLower);
      const isProviderProfile = /\b(?:account of provider|provider account|bank details of provider|contact provider|provider profile)\b/i.test(qLower);

      if (isPaymentMethods) matchingObjective = getCustomerObjective('renter.payment.methods');
      else if (isDamage) matchingObjective = getCustomerObjective('rental.damage.general');
      else if (isRefund) matchingObjective = getCustomerObjective('renter.refund.request_how_to');
      else if (isProviderProfile) matchingObjective = getCustomerObjective('provider.profile.public_vs_private');
    }

    let finalAnswer = '';

    if (matchingObjective) {
      const contract = matchingObjective.answerContract;
      const facts = contract.requiredFacts.map(fact => `• ${fact}`).join('\n');
      finalAnswer = facts;

      // Environment state awareness for payments
      if (matchingObjective.objectiveId === 'renter.payment.methods') {
        const isBeta = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV !== 'production';
        if (isBeta) {
          finalAnswer += `\n\n*Current Environment Notice: RENTipid is currently in Private Beta with Mock Payments Active. Real financial transactions are disabled.*`;
        }
      }
    } else {
      // General grounded fallback
      const isPayoutQuestion = /\b(?:payout|withdraw|earnings|kita)\b/i.test(qLower);
      const nonTermsSections = input.bundle.sections
        .filter(s => s.sourceKey !== 'route.terms')
        .map(s => {
          if (!isPayoutQuestion && s.sourceKey === 'provider.payment-status-currency') {
            return {
              ...s,
              chunks: s.chunks.filter(c => !c.chunkKey.includes('provider-payout'))
            };
          }
          return s;
        })
        .filter(s => s.chunks.length > 0);

      const targetSections = nonTermsSections.length > 0 ? nonTermsSections : input.bundle.sections;
      const sectionParagraphs = targetSections.map(section => {
        const content = section.chunks.map(c => c.content).join('\n');
        return content.replace(/[*_>#`]/g, '').trim();
      });
      finalAnswer = sectionParagraphs.join('\n\n');
    }

    if (input.structuredCategoryFacts && input.structuredCategoryFacts.length > 0) {
      const factsText = input.structuredCategoryFacts.map(f => `${f.entity}: ${f.canonicalCategory || 'Unknown'} - ${f.status}`).join('\n');
      finalAnswer += `\n\nCategory Facts:\n${factsText}`;
    }

    return {
      answer: finalAnswer.trim(),
      answeredIntent: input.bundle.classification.intent,
      coveredEntities: [...input.bundle.requestedEntities],
      claims,
    };
  }
}

// Alias for backward compatibility
const DeterministicEvidenceFallbackProvider = LocalGroundedComposerProvider;

export function resolveGroundedInformationProvider(
  providerMode: string,
): GroundedInformationProvider | null {
  if (providerMode === 'openai') return new OpenAIGroundedProvider();
  if (providerMode === 'deterministic-evidence-fallback' || providerMode === 'local-grounded-composer') return new LocalGroundedComposerProvider();
  return null;
}
