import type { ListingBridgeSecurityErrorCode } from './errors';
import { redactListingBridgeSecurityDetails } from './errors';

export interface ListingBridgeSecurityAuditEvent {
  readonly actorUserId?: string;
  readonly importJobId?: string;
  readonly action: string;
  readonly outcome: 'ALLOW' | 'BLOCK' | 'CONFIRM';
  readonly reason?: ListingBridgeSecurityErrorCode | string;
  readonly correlationId?: string;
  readonly ipAddress?: string;
  readonly safeDetails?: Readonly<Record<string, unknown>>;
}

export interface ListingBridgeSecurityAuditSink {
  write(event: ListingBridgeSecurityAuditEvent): Promise<void>;
}

export class NullListingBridgeSecurityAuditSink implements ListingBridgeSecurityAuditSink {
  async write(): Promise<void> {
    return undefined;
  }
}

export class ListingBridgeAuditLogSink implements ListingBridgeSecurityAuditSink {
  async write(event: ListingBridgeSecurityAuditEvent): Promise<void> {
    const { createAuditLog } = await import('../../audit');
    await createAuditLog({
      actor_user_id: event.actorUserId,
      action: `LISTINGBRIDGE_${event.action}`,
      module: 'ListingBridgeSecurity',
      target_id: event.importJobId,
      ip_address: event.ipAddress,
      details: JSON.stringify({
        outcome: event.outcome,
        reason: event.reason,
        correlationId: event.correlationId,
        ...redactListingBridgeSecurityDetails(event.safeDetails ?? {}),
      }),
    });
  }
}
