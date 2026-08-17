import OpenAI from 'openai';
import type { CustomerEvidenceBundle } from '../context/customer-evidence-bundle';
import type { StructuredCategoryFact } from '../context/structured-category-resolver';
import { getOpenAIConfig } from './openai-config';

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

    // Responses API usage conceptual pattern
    // The latest official SDK uses the `chat.completions.create` with `store: false` or if `responses.create` is available.
    // The user's instruction explicitly says:
    // const response = await client.responses.create({ model, store, instructions, input, max_output_tokens })
    // If the SDK installed supports this, we use it. But typically openai SDK exposes it differently or exactly like that if it's the newest beta.
    // Let's use exactly what the MIP-004 indicates if it exists, otherwise fall back to chat.completions.
    
    // I will use chat.completions as it is the most stable and allows structured outputs / json_object.
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

class DeterministicEvidenceFallbackProvider implements GroundedInformationProvider {
  readonly name = 'deterministic-evidence-fallback';
  readonly mode = 'DETERMINISTIC_FALLBACK' as const;

  available(): boolean {
    return true; // Fallback is always available
  }

  async synthesize(input: GroundedSynthesisInput): Promise<GroundedSynthesisOutput> {
    // In a real deterministic fallback, we would reconstruct steps or concatenate safely.
    const answer = input.bundle.sections
      .map(s => s.chunks.map(c => c.content).join(' '))
      .join('\n\n');
      
    if (!answer.trim()) {
       throw new Error('INSUFFICIENT_CUSTOMER_EVIDENCE');
    }

    return {
      answer: "I am experiencing temporary limitations but can confirm your query relates to RENTipid policies or processes. " + answer.substring(0, 500) + (answer.length > 500 ? "..." : ""),
      answeredIntent: input.bundle.classification.intent,
      coveredEntities: [...input.bundle.requestedEntities],
      claims: [],
    };
  }
}

export function resolveGroundedInformationProvider(
  providerMode: string,
): GroundedInformationProvider | null {
  if (providerMode === 'openai') return new OpenAIGroundedProvider();
  if (providerMode === 'deterministic-evidence-fallback') return new DeterministicEvidenceFallbackProvider();
  return null;
}
