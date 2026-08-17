import type { RetrievedKnowledgeMatch } from './knowledge-retrieval';
import type { RentipidQuestionClassification } from './question-classifier';

export interface CustomerEvidenceChunk {
  evidenceRef: string;
  chunkKey: string;
  ordinal: number;
  content: string;
  role: 'SEED' | 'NEIGHBOR';
}

export interface CustomerEvidenceSection {
  sourceKey: string;
  sectionKey: string;
  sectionTitle: string;
  domain: string;
  entities: readonly string[];
  visibility: string;
  audience: 'CUSTOMER';
  answerClass: 'INFORMATION';
  chunks: readonly CustomerEvidenceChunk[];
}

export interface CustomerEvidenceBundle {
  contractVersion: 'rentipid.customer-evidence.v1';
  question: string;
  classification: RentipidQuestionClassification;
  requestedEntities: readonly string[];
  sections: readonly CustomerEvidenceSection[];
  evidenceRefs: readonly string[];
  chunkCount: number;
  customerVisibleChunkCount: number;
  characterSize: number;
}

function requestedEntities(
  classification: RentipidQuestionClassification,
): string[] {
  return [...classification.requestedCategoryTerms];
}

export function buildCustomerEvidenceBundle(
  question: string,
  classification: RentipidQuestionClassification,
  matches: readonly RetrievedKnowledgeMatch[],
): CustomerEvidenceBundle {
  const groups = new Map<string, RetrievedKnowledgeMatch[]>();
  for (const match of matches) {
    if (match.audience !== 'CUSTOMER' || match.answerClass !== 'INFORMATION') continue;
    const key = `${match.sourceKey}:${match.sectionKey}`;
    const current = groups.get(key) ?? [];
    current.push(match);
    groups.set(key, current);
  }

  const sections = [...groups.values()]
    .map(group => {
      const ordered = [...group].sort((left, right) => left.ordinal - right.ordinal);
      const first = ordered[0];
      return Object.freeze({
        sourceKey: first.sourceKey,
        sectionKey: first.sectionKey,
        sectionTitle: first.sectionTitle,
        domain: first.module,
        entities: Object.freeze([...new Set(ordered.flatMap(match => match.entities ?? []))]),
        visibility: first.visibility,
        audience: 'CUSTOMER' as const,
        answerClass: 'INFORMATION' as const,
        chunks: Object.freeze(ordered.map(match => Object.freeze({
          evidenceRef: `knowledge:${match.sourceKey}:${match.chunkKey}`,
          chunkKey: match.chunkKey,
          ordinal: match.ordinal,
          content: match.content,
          role: match.evidenceRole ?? 'SEED',
        }))),
      });
    })
    .sort((left, right) => left.sourceKey.localeCompare(right.sourceKey)
      || left.sectionKey.localeCompare(right.sectionKey));
  const evidenceRefs = [...new Set(sections.flatMap(section =>
    section.chunks.map(chunk => chunk.evidenceRef)))];
  const chunkCount = sections.reduce((count, section) => count + section.chunks.length, 0);
  const characterSize = sections.reduce((size, section) =>
    size + section.chunks.reduce((chunkSize, chunk) => chunkSize + chunk.content.length, 0), 0);

  return Object.freeze({
    contractVersion: 'rentipid.customer-evidence.v1',
    question,
    classification,
    requestedEntities: Object.freeze(requestedEntities(classification)),
    sections: Object.freeze(sections),
    evidenceRefs: Object.freeze(evidenceRefs),
    chunkCount,
    customerVisibleChunkCount: chunkCount,
    characterSize,
  });
}
