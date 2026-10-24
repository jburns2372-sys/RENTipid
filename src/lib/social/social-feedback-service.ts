import { PrismaClient, SocialFeedbackStatus, SocialFeedbackSeverity, SocialFeedbackSentiment, IncidentCaseSeverity, IncidentCaseOrigin, IncidentCaseStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

const generateId = (length: number) => randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);

const prisma = new PrismaClient();

export interface IngestFeedbackInput {
  provider: string;
  social_account_id?: string | null;
  provider_feedback_id: string;
  provider_event_id?: string | null;
  feedback_type: string;
  raw_text: string;
  author_provider_id?: string | null;
  campaign_id?: string | null;
  marketing_post_id?: string | null;
  listing_id?: string | null;
}

export interface AiClassificationDraft {
  sentiment: SocialFeedbackSentiment;
  topic: string;
  suggested_severity?: SocialFeedbackSeverity;
  response_draft?: string;
}

export class SocialFeedbackService {
  
  /**
   * Ingests, sanitizes, and deduplicates provider feedback
   */
  async ingestFeedback(input: IngestFeedbackInput) {
    const normalizedText = this.sanitizeText(input.raw_text);

    // Idempotency / Deduplication
    const existing = await prisma.socialFeedback.findFirst({
      where: {
        provider: input.provider,
        social_account_id: input.social_account_id || null, // Prisma handles null correctly here
        provider_feedback_id: input.provider_feedback_id,
      }
    });

    if (existing) {
      await this.auditLog('SOCIAL_FEEDBACK_DUPLICATE_SUPPRESSED', { feedback_id: existing.id, provider_feedback_id: input.provider_feedback_id });
      return existing;
    }

    // Attempt to resolve the SocialAccount if missing but possible to find (assuming provider logic)
    // Create new Feedback
    const newFeedback = await prisma.socialFeedback.create({
      data: {
        provider: input.provider,
        social_account_id: input.social_account_id || null,
        provider_feedback_id: input.provider_feedback_id,
        provider_event_id: input.provider_event_id || null,
        feedback_type: input.feedback_type,
        normalized_text: normalizedText,
        author_provider_id: input.author_provider_id || null,
        campaign_id: input.campaign_id || null,
        marketing_post_id: input.marketing_post_id || null,
        listing_id: input.listing_id || null,
        status: SocialFeedbackStatus.NEW,
        severity: SocialFeedbackSeverity.LOW,
      }
    });

    await this.auditLog('SOCIAL_FEEDBACK_INGESTED', { feedback_id: newFeedback.id });
    return newFeedback;
  }

  /**
   * Thin bounded integration for AI Classification
   * In a real environment, this would call UnifiedAiClient.
   * AI output is ADVISORY ONLY.
   */
  async classifyFeedback(feedbackId: string, aiClassification: AiClassificationDraft) {
    const feedback = await prisma.socialFeedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new Error('Feedback not found');
    
    // Calculate deterministic severity based on AI signals + rules
    const deterministicSeverity = this.calculateDeterministicSeverity(feedback.normalized_text, aiClassification);

    const updated = await prisma.socialFeedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: aiClassification.sentiment,
        topic: aiClassification.topic,
        severity: deterministicSeverity,
        status: feedback.status === SocialFeedbackStatus.NEW ? SocialFeedbackStatus.CLASSIFIED : feedback.status,
        ai_classification_metadata: JSON.stringify(aiClassification)
      }
    });

    await this.auditLog('SOCIAL_FEEDBACK_CLASSIFIED', { feedback_id: feedbackId, sentiment: aiClassification.sentiment, severity: deterministicSeverity });
    return updated;
  }

  /**
   * Deterministic logic for Severity that supersedes any AI suggestion
   */
  calculateDeterministicSeverity(normalizedText: string, classification: AiClassificationDraft): SocialFeedbackSeverity {
    const textUpper = normalizedText.toUpperCase();
    
    // Deterministic rules
    const isCritical = textUpper.includes('FRAUD') || textUpper.includes('SCAM') || textUpper.includes('THREAT') || textUpper.includes('DANGEROUS');
    if (isCritical) return SocialFeedbackSeverity.CRITICAL;

    const isHigh = textUpper.includes('DISPUTE') || textUpper.includes('COMPLAINT') || textUpper.includes('BROKEN');
    if (isHigh) return SocialFeedbackSeverity.HIGH;

    const isMedium = classification.sentiment === SocialFeedbackSentiment.NEGATIVE;
    if (isMedium) return SocialFeedbackSeverity.MEDIUM;

    return classification.suggested_severity || SocialFeedbackSeverity.LOW;
  }

  /**
   * Links feedback to an appropriate Case type. 
   * Avoids duplicate case creation.
   */
  async escalateToCase(feedbackId: string, caseType: 'SUPPORT' | 'INCIDENT', createdByUserId?: string) {
    const feedback = await prisma.socialFeedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new Error('Feedback not found');
    
    // Prevent duplicate case logic
    if (feedback.linked_case_id && feedback.linked_case_type === caseType) {
      return { case_id: feedback.linked_case_id, duplicate: true };
    }

    let linkedCaseId = '';
    
    if (caseType === 'INCIDENT') {
      const severityMap: Record<SocialFeedbackSeverity, IncidentCaseSeverity> = {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        CRITICAL: 'CRITICAL'
      };

      const newCase = await prisma.incidentCase.create({
        data: {
          case_reference: `INC-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 8)}-${generateId(8).toUpperCase()}`,
          status: 'OPEN',
          severity: severityMap[feedback.severity],
          origin: 'EXTERNAL_PROVIDER',
          title: `Social Feedback Escalation: ${feedback.provider}`,
          summary: feedback.normalized_text.substring(0, 2000),
          opened_at: new Date(),
          created_by_user_id: createdByUserId
        }
      });
      linkedCaseId = newCase.id;
    } else if (caseType === 'SUPPORT') {
      const newCase = await prisma.aiSupportCase.create({
        data: {
          caseNumber: generateId(12).toUpperCase(),
          category: 'SOCIAL_ESCALATION',
          severity: feedback.severity.toLowerCase(),
          riskLevel: feedback.severity === SocialFeedbackSeverity.CRITICAL ? 'consequential' : 'safe',
          status: 'OPEN',
          summary: feedback.normalized_text
        }
      });
      linkedCaseId = newCase.id;
    }

    await prisma.socialFeedback.update({
      where: { id: feedbackId },
      data: {
        linked_case_id: linkedCaseId,
        linked_case_type: caseType,
        status: SocialFeedbackStatus.ESCALATED
      }
    });

    await this.auditLog('SOCIAL_FEEDBACK_ESCALATED', { feedback_id: feedbackId, case_type: caseType, case_id: linkedCaseId });
    return { case_id: linkedCaseId, duplicate: false };
  }

  /**
   * Human review override logic
   */
  async overrideClassification(feedbackId: string, reviewerId: string, updates: { sentiment?: SocialFeedbackSentiment, severity?: SocialFeedbackSeverity, topic?: string }) {
    const updated = await prisma.socialFeedback.update({
      where: { id: feedbackId },
      data: {
        ...updates,
        status: SocialFeedbackStatus.NEEDS_REVIEW, // Human touched it
        reviewed_at: new Date()
      }
    });
    
    await this.auditLog('SOCIAL_FEEDBACK_HUMAN_OVERRIDE', { feedback_id: feedbackId, reviewerId, updates });
    return updated;
  }
  
  async requestAiResponseDraft(feedbackId: string) {
    const feedback = await prisma.socialFeedback.findUnique({ where: { id: feedbackId } });
    if (!feedback) throw new Error('Feedback not found');
    
    // Simulate Unified AI call
    const metadata = feedback.ai_classification_metadata ? JSON.parse(feedback.ai_classification_metadata) : {};
    metadata.response_draft = `Draft response to: ${feedback.normalized_text.substring(0, 20)}`;
    
    await prisma.socialFeedback.update({
      where: { id: feedbackId },
      data: { ai_classification_metadata: JSON.stringify(metadata) }
    });
    
    await this.auditLog('SOCIAL_FEEDBACK_RESPONSE_DRAFTED', { feedback_id: feedbackId });
    // ZERO autonomous provider sends.
    return metadata.response_draft;
  }

  // Sanitizes text from prompt injection / XSS basic layer
  private sanitizeText(raw: string): string {
    return raw.trim(); // Simplified for now. A real app uses a DOMPurify equivalent if rendered, or safe encoding.
  }

  private async auditLog(action: string, metadata: any) {
    try {
      await prisma.auditLog.create({
        data: {
          action,
          module: 'SocialFeedback',
          target_id: metadata.feedback_id || 'N/A',
          actor_user_id: metadata.reviewerId || null,
          ip_address: '127.0.0.1',
          details: JSON.stringify(metadata)
        }
      });
    } catch (e) {
      console.warn('Audit log failed', e);
    }
  }
}
