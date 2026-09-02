import 'server-only';

import { logAuthenticationEvent } from '@/lib/security/events/writers/authentication-writer';
import type { AuthAuditSink, UnifiedAuthAuditEvent } from './services';

function toWriterOutcome(outcome: UnifiedAuthAuditEvent['outcome']): string {
  if (outcome === 'SUCCESS') return 'Success';
  if (outcome === 'RATE_LIMITED') return 'RateLimited';
  return outcome[0] + outcome.slice(1).toLowerCase();
}

export class AuthenticationSecurityLogAuditSink implements AuthAuditSink {
  async write(event: UnifiedAuthAuditEvent) {
    await logAuthenticationEvent({
      event_code: event.eventCode,
      outcome: toWriterOutcome(event.outcome),
      actor_user_id: event.userId,
      sanitized_metadata: {
        ...event.metadata,
        subject_reference_hash: event.subjectReference,
      },
    });
  }
}
