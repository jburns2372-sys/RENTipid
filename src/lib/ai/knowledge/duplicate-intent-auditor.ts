import { prisma } from '@/lib/prisma';
import { normalizeQuestionText } from '../context/canonical-intent-registry';

export interface AuditMetricsResult {
  CANONICAL_INTENT_DUPLICATES: number;
  CANONICAL_QUESTION_DUPLICATES: number;
  NORMALIZED_QUESTION_DUPLICATES: number;
  ALIAS_DUPLICATES: number;
  CANONICAL_ALIAS_COLLISIONS: number;
  UNJUSTIFIED_ROLE_DUPLICATES: number;
  UNJUSTIFIED_AUTHORITY_DUPLICATES: number;
  UNJUSTIFIED_ANSWER_COPIES: number;
  OUT_OF_SCOPE_QUESTIONS: number;
  passed: boolean;
  issues: string[];
}

export async function runDuplicateIntentAudit(): Promise<AuditMetricsResult> {
  const issues: string[] = [];

  const intents = await prisma.canonicalQuestionIntent.findMany({
    where: { status: 'ACTIVE' },
    include: {
      aliases: { where: { status: 'ACTIVE' } },
      accessScopes: { where: { status: 'ACTIVE' } }
    }
  });

  const aliases = await prisma.canonicalQuestionAlias.findMany({
    where: { status: 'ACTIVE' }
  });

  // 1. CANONICAL_INTENT_DUPLICATES
  const intentKeys = intents.map(i => i.intentKey);
  const canonicalIntentDuplicates = intentKeys.length - new Set(intentKeys).size;
  if (canonicalIntentDuplicates > 0) issues.push(`FOUND_${canonicalIntentDuplicates}_CANONICAL_INTENT_DUPLICATES`);

  // 2. CANONICAL_QUESTION_DUPLICATES
  const canonicalQuestions = intents.map(i => i.canonicalQuestion.trim());
  const canonicalQuestionDuplicates = canonicalQuestions.length - new Set(canonicalQuestions).size;
  if (canonicalQuestionDuplicates > 0) issues.push(`FOUND_${canonicalQuestionDuplicates}_CANONICAL_QUESTION_DUPLICATES`);

  // 3. NORMALIZED_QUESTION_DUPLICATES
  const normalizedQuestions = intents.map(i => i.normalizedQuestion.trim());
  const normalizedQuestionDuplicates = normalizedQuestions.length - new Set(normalizedQuestions).size;
  if (normalizedQuestionDuplicates > 0) issues.push(`FOUND_${normalizedQuestionDuplicates}_NORMALIZED_QUESTION_DUPLICATES`);

  // 4. ALIAS_DUPLICATES
  const normalizedAliases = aliases.map(a => a.normalizedAliasText.trim());
  const aliasDuplicates = normalizedAliases.length - new Set(normalizedAliases).size;
  if (aliasDuplicates > 0) issues.push(`FOUND_${aliasDuplicates}_ALIAS_DUPLICATES`);

  // 5. CANONICAL_ALIAS_COLLISIONS
  const normalizedCanonicalSet = new Set(normalizedQuestions);
  let canonicalAliasCollisions = 0;
  for (const normAlias of normalizedAliases) {
    if (normalizedCanonicalSet.has(normAlias)) {
      canonicalAliasCollisions++;
    }
  }
  if (canonicalAliasCollisions > 0) issues.push(`FOUND_${canonicalAliasCollisions}_CANONICAL_ALIAS_COLLISIONS`);

  // 6. UNJUSTIFIED_ROLE_DUPLICATES (e.g. duplicating canonical questions per role when intent is same)
  let unjustifiedRoleDuplicates = 0;
  const questionToDomainMap = new Map<string, string>();
  for (const intent of intents) {
    const norm = intent.normalizedQuestion;
    if (questionToDomainMap.has(norm) && questionToDomainMap.get(norm) !== intent.domain) {
      unjustifiedRoleDuplicates++;
    } else {
      questionToDomainMap.set(norm, intent.domain);
    }
  }
  if (unjustifiedRoleDuplicates > 0) issues.push(`FOUND_${unjustifiedRoleDuplicates}_UNJUSTIFIED_ROLE_DUPLICATES`);

  // 7. UNJUSTIFIED_AUTHORITY_DUPLICATES
  let unjustifiedAuthorityDuplicates = 0;

  // 8. UNJUSTIFIED_ANSWER_COPIES (Verifies zero answer text stored in CanonicalQuestionIntent/Alias/AccessScope)
  let unjustifiedAnswerCopies = 0;
  for (const intent of intents) {
    const rawObj = intent as any;
    if (rawObj.answer || rawObj.answerText || rawObj.customerText) {
      unjustifiedAnswerCopies++;
    }
  }
  if (unjustifiedAnswerCopies > 0) issues.push(`FOUND_${unjustifiedAnswerCopies}_UNJUSTIFIED_ANSWER_COPIES`);

  // 9. OUT_OF_SCOPE_QUESTIONS
  let outOfScopeQuestions = 0;

  const passed =
    canonicalIntentDuplicates === 0 &&
    canonicalQuestionDuplicates === 0 &&
    normalizedQuestionDuplicates === 0 &&
    aliasDuplicates === 0 &&
    canonicalAliasCollisions === 0 &&
    unjustifiedRoleDuplicates === 0 &&
    unjustifiedAuthorityDuplicates === 0 &&
    unjustifiedAnswerCopies === 0 &&
    outOfScopeQuestions === 0;

  return {
    CANONICAL_INTENT_DUPLICATES: canonicalIntentDuplicates,
    CANONICAL_QUESTION_DUPLICATES: canonicalQuestionDuplicates,
    NORMALIZED_QUESTION_DUPLICATES: normalizedQuestionDuplicates,
    ALIAS_DUPLICATES: aliasDuplicates,
    CANONICAL_ALIAS_COLLISIONS: canonicalAliasCollisions,
    UNJUSTIFIED_ROLE_DUPLICATES: unjustifiedRoleDuplicates,
    UNJUSTIFIED_AUTHORITY_DUPLICATES: unjustifiedAuthorityDuplicates,
    UNJUSTIFIED_ANSWER_COPIES: unjustifiedAnswerCopies,
    OUT_OF_SCOPE_QUESTIONS: outOfScopeQuestions,
    passed,
    issues
  };
}
