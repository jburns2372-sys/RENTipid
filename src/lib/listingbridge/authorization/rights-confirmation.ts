import type { Prisma } from '@prisma/client';
import {
  ListingBridgeAuditLogSink,
  type ListingBridgeSecurityAuditSink,
} from '../security/audit';
import { ListingBridgeSecurityError } from '../security/errors';

export const LISTINGBRIDGE_RIGHTS_CONFIRMATION_FIELD = 'listingbridge.rightsConfirmation.v1';
export const LISTINGBRIDGE_RIGHTS_CONFIRMATION_VERSION = 'listingbridge.rights-confirmation.v1';

export interface ListingBridgeRightsConfirmationInput {
  readonly actorUserId: string;
  readonly importJobId: string;
  readonly ownsOrManagesProperty: boolean;
  readonly authorizedToSubmitImportedInformation: boolean;
  readonly hasImportedMediaReuseRights: boolean;
  readonly acceptsAccuracyResponsibility: boolean;
  readonly correlationId?: string;
  readonly ipAddress?: string;
  readonly confirmedAt?: Date;
}

export interface ListingBridgeRightsConfirmationEvidence {
  readonly schemaVersion: typeof LISTINGBRIDGE_RIGHTS_CONFIRMATION_VERSION;
  readonly actorUserId: string;
  readonly importJobId: string;
  readonly confirmedAt: string;
  readonly correlationId?: string;
  readonly confirmationResult: 'CONFIRMED';
  readonly ownsOrManagesProperty: true;
  readonly authorizedToSubmitImportedInformation: true;
  readonly hasImportedMediaReuseRights: true;
  readonly acceptsAccuracyResponsibility: true;
}

export interface ListingBridgeRightsConfirmationDb {
  readonly listingImportJob: {
    findUnique(args: {
      where: { id: string };
      select: { id: true; provider_id: true; correlation_id: true };
    }): Promise<{ id: string; provider_id: string; correlation_id: string | null } | null>;
  };
  readonly listingImportResolution: {
    upsert(args: {
      where: { job_id_field_name: { job_id: string; field_name: string } };
      create: {
        job_id: string;
        field_name: string;
        normalized_value: Prisma.InputJsonValue;
        resolved_value: Prisma.InputJsonValue;
        resolution_type: 'PROVIDER_OVERRIDE';
        resolved_by_user_id: string;
        provider_modified: true;
        resolved_at: Date;
      };
      update: {
        normalized_value: Prisma.InputJsonValue;
        resolved_value: Prisma.InputJsonValue;
        resolution_type: 'PROVIDER_OVERRIDE';
        resolved_by_user_id: string;
        provider_modified: true;
        resolved_at: Date;
      };
    }): Promise<unknown>;
    findFirst(args: {
      where: {
        job_id: string;
        field_name: string;
        resolution_type: 'PROVIDER_OVERRIDE';
        resolved_by_user_id?: string;
      };
      select: { id: true; resolved_value: true; resolved_by_user_id: true; resolved_at: true };
    }): Promise<{ id: string; resolved_value: Prisma.JsonValue; resolved_by_user_id: string; resolved_at: Date } | null>;
  };
  readonly listingImportAuditEvent: {
    create(args: {
      data: {
        job_id: string;
        actor_user_id: string;
        event_type: 'AUTHORIZATION_COMPLETED';
        event_payload: Prisma.InputJsonValue;
        ip_address?: string;
      };
    }): Promise<unknown>;
  };
}

export class ListingBridgeRightsConfirmationService {
  constructor(
    private readonly db: ListingBridgeRightsConfirmationDb,
    private readonly auditSink: ListingBridgeSecurityAuditSink = new ListingBridgeAuditLogSink(),
  ) {}

  async confirmRights(input: ListingBridgeRightsConfirmationInput): Promise<ListingBridgeRightsConfirmationEvidence> {
    const job = await this.db.listingImportJob.findUnique({
      where: { id: input.importJobId },
      select: { id: true, provider_id: true, correlation_id: true },
    });
    if (!job || job.provider_id !== input.actorUserId) {
      await this.auditSink.write({
        actorUserId: input.actorUserId,
        importJobId: input.importJobId,
        action: 'RIGHTS_CONFIRMATION_REJECTED',
        outcome: 'BLOCK',
        reason: 'OWNERSHIP_MISMATCH',
        correlationId: input.correlationId,
        ipAddress: input.ipAddress,
      });
      throw new ListingBridgeSecurityError({ code: 'OWNERSHIP_MISMATCH' });
    }

    if (
      !input.ownsOrManagesProperty
      || !input.authorizedToSubmitImportedInformation
      || !input.hasImportedMediaReuseRights
      || !input.acceptsAccuracyResponsibility
    ) {
      await this.auditSink.write({
        actorUserId: input.actorUserId,
        importJobId: input.importJobId,
        action: 'RIGHTS_CONFIRMATION_REJECTED',
        outcome: 'BLOCK',
        reason: 'RIGHTS_CONFIRMATION_REQUIRED',
        correlationId: input.correlationId ?? job.correlation_id ?? undefined,
        ipAddress: input.ipAddress,
      });
      throw new ListingBridgeSecurityError({ code: 'RIGHTS_CONFIRMATION_REQUIRED' });
    }

    const confirmedAt = input.confirmedAt ?? new Date();
    const evidence = Object.freeze({
      schemaVersion: LISTINGBRIDGE_RIGHTS_CONFIRMATION_VERSION,
      actorUserId: input.actorUserId,
      importJobId: input.importJobId,
      confirmedAt: confirmedAt.toISOString(),
      correlationId: input.correlationId ?? job.correlation_id ?? undefined,
      confirmationResult: 'CONFIRMED',
      ownsOrManagesProperty: true,
      authorizedToSubmitImportedInformation: true,
      hasImportedMediaReuseRights: true,
      acceptsAccuracyResponsibility: true,
    } satisfies ListingBridgeRightsConfirmationEvidence);

    await this.db.listingImportResolution.upsert({
      where: {
        job_id_field_name: {
          job_id: input.importJobId,
          field_name: LISTINGBRIDGE_RIGHTS_CONFIRMATION_FIELD,
        },
      },
      create: {
        job_id: input.importJobId,
        field_name: LISTINGBRIDGE_RIGHTS_CONFIRMATION_FIELD,
        normalized_value: evidence as unknown as Prisma.InputJsonValue,
        resolved_value: evidence as unknown as Prisma.InputJsonValue,
        resolution_type: 'PROVIDER_OVERRIDE',
        resolved_by_user_id: input.actorUserId,
        provider_modified: true,
        resolved_at: confirmedAt,
      },
      update: {
        normalized_value: evidence as unknown as Prisma.InputJsonValue,
        resolved_value: evidence as unknown as Prisma.InputJsonValue,
        resolution_type: 'PROVIDER_OVERRIDE',
        resolved_by_user_id: input.actorUserId,
        provider_modified: true,
        resolved_at: confirmedAt,
      },
    });
    await this.db.listingImportAuditEvent.create({
      data: {
        job_id: input.importJobId,
        actor_user_id: input.actorUserId,
        event_type: 'AUTHORIZATION_COMPLETED',
        event_payload: evidence as unknown as Prisma.InputJsonValue,
        ip_address: input.ipAddress,
      },
    });
    await this.auditSink.write({
      actorUserId: input.actorUserId,
      importJobId: input.importJobId,
      action: 'RIGHTS_CONFIRMED',
      outcome: 'CONFIRM',
      correlationId: evidence.correlationId,
      ipAddress: input.ipAddress,
      safeDetails: { schemaVersion: evidence.schemaVersion },
    });

    return evidence;
  }

  async assertRightsConfirmationSatisfied(importJobId: string, actorUserId?: string): Promise<void> {
    const resolution = await this.db.listingImportResolution.findFirst({
      where: {
        job_id: importJobId,
        field_name: LISTINGBRIDGE_RIGHTS_CONFIRMATION_FIELD,
        resolution_type: 'PROVIDER_OVERRIDE',
        ...(actorUserId ? { resolved_by_user_id: actorUserId } : {}),
      },
      select: { id: true, resolved_value: true, resolved_by_user_id: true, resolved_at: true },
    });

    if (!resolution || !isConfirmedEvidence(resolution.resolved_value)) {
      throw new ListingBridgeSecurityError({ code: 'RIGHTS_CONFIRMATION_REQUIRED' });
    }
  }
}

function isConfirmedEvidence(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return !!value
    && typeof value === 'object'
    && !Array.isArray(value)
    && (value as Record<string, unknown>).schemaVersion === LISTINGBRIDGE_RIGHTS_CONFIRMATION_VERSION
    && (value as Record<string, unknown>).confirmationResult === 'CONFIRMED'
    && (value as Record<string, unknown>).ownsOrManagesProperty === true
    && (value as Record<string, unknown>).authorizedToSubmitImportedInformation === true
    && (value as Record<string, unknown>).hasImportedMediaReuseRights === true
    && (value as Record<string, unknown>).acceptsAccuracyResponsibility === true;
}
