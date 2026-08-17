import { prisma } from '../ai-logger';
import { getAISettings } from '../ai-settings-service';
import type { SemanticContextBundle, SemanticMatch } from './contracts';

export interface SemanticLearningEvent {
  bundle: SemanticContextBundle;
  success: boolean;
  ambiguityDetected: boolean;
  reason?: string;
  source: 'VERIFIER' | 'FEEDBACK' | 'EXPLICIT_CORRECTION';
}

export async function processAdaptiveLearningEvent(event: SemanticLearningEvent): Promise<void> {
  const settings = await getAISettings();
  if (!settings.semanticAdaptiveLearningEnabled) return;

  const matches = [
    ...event.bundle.intentHints,
    ...event.bundle.entities,
    ...event.bundle.roleHints,
    ...event.bundle.lifecycleHints,
  ];

  for (const match of matches) {
    if (match.matchType === 'EXACT') continue; // Don't need to learn exact canonical matches
    
    // We only process unknown or fuzzy or alias matches that are successful
    try {
      const candidate = await prisma.semanticLearningCandidate.upsert({
        where: {
          normalizedPhrase_canonicalCandidateId_domain_semanticType: {
            normalizedPhrase: match.inputTerm,
            canonicalCandidateId: match.canonicalId,
            domain: 'DEFAULT',
            semanticType: (match as any).entityType || 'UNKNOWN'
          }
        },
        create: {
          normalizedPhrase: match.inputTerm,
          canonicalCandidateId: match.canonicalId,
          domain: 'DEFAULT',
          semanticType: (match as any).entityType || 'UNKNOWN',
          matchSource: match.matchType,
          status: 'OBSERVED',
          lexiconVersionObserved: event.bundle.lexiconVersion,
          observationCount: 1,
          successfulGroundedCount: event.success ? 1 : 0,
          failedGroundedCount: !event.success ? 1 : 0,
          ambiguityCount: event.ambiguityDetected ? 1 : 0,
          explicitUserCorrectionCount: event.source === 'EXPLICIT_CORRECTION' ? 1 : 0,
        },
        update: {
          observationCount: { increment: 1 },
          successfulGroundedCount: event.success ? { increment: 1 } : undefined,
          failedGroundedCount: !event.success ? { increment: 1 } : undefined,
          ambiguityCount: event.ambiguityDetected ? { increment: 1 } : undefined,
          explicitUserCorrectionCount: event.source === 'EXPLICIT_CORRECTION' ? { increment: 1 } : undefined,
          lastSeenAt: new Date(),
        }
      });

      // Simple promotion logic based on Deterministic safety thresholds
      if (candidate.status === 'OBSERVED' && candidate.successfulGroundedCount >= 2 && candidate.failedGroundedCount === 0) {
        await prisma.semanticLearningCandidate.update({
          where: { id: candidate.id },
          data: { status: 'CANDIDATE' }
        });
      } else if (candidate.status === 'CANDIDATE' && candidate.successfulGroundedCount >= 5 && candidate.failedGroundedCount === 0) {
        await prisma.semanticLearningCandidate.update({
          where: { id: candidate.id },
          data: { status: 'LEARNED_HINT' }
        });
      }
      
      // Negative learning
      if (candidate.status === 'LEARNED_HINT' && candidate.failedGroundedCount > 0) {
        await prisma.semanticLearningCandidate.update({
          where: { id: candidate.id },
          data: { status: 'CANDIDATE', lastFailureReason: event.reason }
        });
      }

    } catch (e) {
      // ADAPTIVE LEARNING FAILURE MUST NOT BLOCK ANSWERS
      console.error('Failed to process adaptive learning event:', e);
    }
  }
}
