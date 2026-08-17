import { composeCanonicalInformationAnswer } from '@/lib/ai/context/canonical-information-answer';
import { retrieveApprovedKnowledgeEvidence } from '@/lib/ai/context/knowledge-retrieval';
import { tokenizeKnowledgeText } from '@/lib/ai/context/knowledge-retrieval';
import type {
  GroundedInformationProvider,
  GroundedSynthesisInput,
  GroundedSynthesisOutput,
} from '@/lib/ai/providers/grounded-information-provider';
import { loadCustomerAnswerabilityCatalog } from '@/lib/ai/knowledge/customer-answerability-harness';

const INTERNAL_OUTPUT =
  /taxonomy fields|reads only|ingested|negative test fixtures|sample users|sample bookings|source\s*key|chunk\s*(?:id|key)|registry|freeze hash|booking mutation|domain authority|deterministic policy|internal specialist|mock provider/i;
const ACTION_LINE =
  /\b(?:add|apply|browse|check|choose|complete|confirm|contact|create|enter|find|follow|open|provide|receive|register|request|return|review|save|select|send|sign|submit|upload|use|verify)\b/i;

function evidenceLine(input: GroundedSynthesisInput): { ref: string; text: string } {
  const chunks = input.bundle.sections.flatMap(section => section.chunks);
  const lines = chunks.flatMap(chunk => chunk.content.split(/\r?\n/)
    .map(text => ({ ref: chunk.evidenceRef, text: text.replace(/^\s*(?:\d+[.)]|[-*])\s+/, '').trim() }))
    .filter(item => item.text.length > 12 && !/^#{1,6}\s+/.test(item.text)));
  const selected = /\b(?:how|steps?|what happens|process)\b/i.test(input.question)
    ? lines.find(item => ACTION_LINE.test(item.text))
    : lines[0];
  if (!selected) throw new Error('NO_CUSTOMER_EVIDENCE_LINE');
  return selected;
}

class HarnessGroundedProvider implements GroundedInformationProvider {
  readonly name = 'answerability-harness-provider';
  readonly mode = 'GROUNDED_GENERATIVE' as const;

  available() {
    return true;
  }

  async synthesize(input: GroundedSynthesisInput): Promise<GroundedSynthesisOutput> {
    if (input.structuredCategoryFacts.length > 0) {
      const lines = input.structuredCategoryFacts.map(fact =>
        fact.status === 'UNCONFIRMED'
          ? `${fact.entity}: RENTipid cannot confirm this from the approved rental categories.`
          : `${fact.entity}: ${fact.status.toLowerCase()}.`);
      return {
        answer: lines.join('\n'),
        answeredIntent: input.bundle.classification.intent,
        coveredEntities: input.structuredCategoryFacts.map(fact => fact.entity),
        claims: input.structuredCategoryFacts
          .filter(fact => fact.supportText && fact.authority.length > 0)
          .map(fact => ({
            text: `${fact.canonicalCategory} is ${fact.status.toLowerCase()}.`,
            evidenceRefs: fact.authority,
            supportingText: fact.supportText!,
          })),
      };
    }
    const selected = evidenceLine(input);
    return {
      answer: `Here is the approved RENTipid guidance: ${selected.text}`,
      answeredIntent: input.bundle.classification.intent,
      coveredEntities: input.bundle.requestedEntities,
      claims: [{
        text: selected.text,
        evidenceRefs: [selected.ref],
        supportingText: selected.text,
      }],
    };
  }
}

function dynamicUnseenQuestion(sectionTitle: string, index: number): string {
  const openings = ['Could you walk me through', 'I would like a clear explanation of', 'Help me understand'];
  const endings = ['for a RENTipid customer', 'when using RENTipid', 'in the RENTipid app'];
  return `${openings[index % openings.length]} ${sectionTitle} ${endings[(index * 7) % endings.length]}?`;
}

describe('knowledge-wide customer answerability', () => {
  test('accounts for the complete active customer-visible catalog', async () => {
    const catalog = await loadCustomerAnswerabilityCatalog();
    expect(catalog.activeCustomerSources).toBeGreaterThan(0);
    expect(catalog.activeCustomerSections).toBe(catalog.cases.length);
    expect(catalog.questionVariants).toBeGreaterThanOrEqual(catalog.activeCustomerSections * 3);
    expect(catalog.mixedSourceCountAfter).toBe(0);
    console.log('CUSTOMER_ANSWERABILITY_CATALOG', JSON.stringify({
      activeCustomerSources: catalog.activeCustomerSources,
      activeCustomerSections: catalog.activeCustomerSections,
      mixedSourceCountBefore: catalog.mixedSourceCountBefore,
      mixedSourceCountAfter: catalog.mixedSourceCountAfter,
      answerabilityCases: catalog.cases.length,
      questionVariants: catalog.questionVariants + catalog.cases.length,
      multiEntityCases: catalog.multiEntityCases,
    }));
  });

  test('answers every customer section through retrieval, reconstruction, generation, and verification', async () => {
    const catalog = await loadCustomerAnswerabilityCatalog();
    const provider = new HarnessGroundedProvider();
    let tested = 0;
    let multiEntityPass = 0;
    for (const [caseIndex, item] of catalog.cases.entries()) {
      const variants = [
        ...item.variants,
        { question: dynamicUnseenQuestion(item.questionSubject, caseIndex) },
      ];
      for (const variant of variants) {
        const retrieval = await retrieveApprovedKnowledgeEvidence(
          variant.question,
          item.role,
          variant.context ?? [],
        );
        if (retrieval.classification.kind !== item.expectedAuthorityClass) {
          throw new Error(`ANSWERABILITY_CLASSIFICATION_MISS ${JSON.stringify({
            sourceKey: item.sourceKey,
            sectionKey: item.sectionKey,
            question: variant.question,
            expected: item.expectedAuthorityClass,
            actual: retrieval.classification.kind,
            effectiveQuestion: retrieval.classification.effectiveQuestion,
          })}`);
        }
        const retrievedExpectedSection = retrieval.bundle.sections.some(section =>
          section.sourceKey === item.sourceKey && section.sectionKey === item.sectionKey);
        if (!retrievedExpectedSection) {
          throw new Error(`ANSWERABILITY_RETRIEVAL_MISS ${JSON.stringify({
            sourceKey: item.sourceKey,
            sectionKey: item.sectionKey,
            sectionTitle: item.sectionTitle,
            question: variant.question,
            role: item.role,
            effectiveQuestion: retrieval.classification.effectiveQuestion,
            queryTokens: tokenizeKnowledgeText(retrieval.classification.effectiveQuestion),
            supportedFactualScope: item.supportedFactualScope,
            retrieved: retrieval.bundle.sections.map(section => ({
              sourceKey: section.sourceKey,
              sectionKey: section.sectionKey,
              sectionTitle: section.sectionTitle,
            })),
          })}`);
        }
        expect(retrieval.bundle.sections.every(section => section.audience === 'CUSTOMER')).toBe(true);
        expect(retrieval.bundle.sections.flatMap(section => section.chunks)
          .map(chunk => chunk.content).join('\n')).not.toMatch(INTERNAL_OUTPUT);
        const answer = await composeCanonicalInformationAnswer({
          question: variant.question,
          effectiveQuestion: retrieval.classification.effectiveQuestion,
          classification: retrieval.classification.kind,
          questionAnalysis: retrieval.classification,
          evidence: retrieval.matches,
          evidenceBundle: retrieval.bundle,
        }, {
          providerMode: 'openai',
          provider,
          systemPrompt: 'Answer in simple English using only supplied evidence.',
          conversationContext: JSON.stringify(variant.context ?? []),
        });
        if (answer.composerMode !== 'GROUNDED_GENERATIVE') {
          throw new Error(`ANSWERABILITY_COMPOSITION_FALLBACK ${JSON.stringify({
            sourceKey: item.sourceKey,
            sectionKey: item.sectionKey,
            question: variant.question,
            composerMode: answer.composerMode,
            verifierReasons: answer.verifierReasons,
            fallbackReason: answer.fallbackReason,
            retryUsed: answer.retryUsed,
            message: answer.message,
          })}`);
        }
        expect(answer.adequacyPassed).toBe(true);
        expect(answer.safelyUncertain).toBe(false);
        expect(answer.materialClaims.length).toBeGreaterThan(0);
        expect(answer.message).not.toMatch(INTERNAL_OUTPUT);
        tested += 1;
      }
      if (item.multiEntities.length >= 2) multiEntityPass += 1;
    }
    expect(tested).toBe(catalog.questionVariants + catalog.cases.length);
    expect(multiEntityPass).toBe(catalog.multiEntityCases);
  }, 120_000);
});
