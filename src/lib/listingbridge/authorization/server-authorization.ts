import { hasPermission, type UserRole } from '../../permissions';
import type { ListingImportJobStatus } from '../types/job-state';
import type { ListingBridgeConnectorAuthorizationDecision } from '../connectors/authorization';
import type { ListingBridgeCredentialDecision } from '../secrets/credential-boundary';
import {
  ListingBridgeAuditLogSink,
  type ListingBridgeSecurityAuditSink,
} from '../security/audit';
import { ListingBridgeSecurityError } from '../security/errors';

export type ListingBridgeAuthorizedAction =
  | 'START_IMPORT'
  | 'RESUME_IMPORT'
  | 'CANCEL_IMPORT'
  | 'MODIFY_IMPORTED_FIELDS'
  | 'CONFIRM_RIGHTS'
  | 'CREATE_DRAFT';

export interface ListingBridgeServerAuthorizationInput {
  readonly actorUserId?: string;
  readonly action: ListingBridgeAuthorizedAction;
  readonly importJobId?: string;
  readonly connectorAuthorization?: ListingBridgeConnectorAuthorizationDecision;
  readonly credentialDecision?: ListingBridgeCredentialDecision;
  readonly correlationId?: string;
  readonly ipAddress?: string;
}

export interface ListingBridgeAuthorizedActor {
  readonly id: string;
  readonly role: UserRole;
  readonly status: string;
  readonly accountType: string;
  readonly providerVerificationStatus: string;
}

export interface ListingBridgeAuthorizedJob {
  readonly id: string;
  readonly providerId: string;
  readonly status: ListingImportJobStatus;
  readonly sourceConnector: string;
  readonly authorizationMethod: string;
  readonly correlationId?: string;
}

export interface ListingBridgeServerAuthorizationDecision {
  readonly authorized: true;
  readonly action: ListingBridgeAuthorizedAction;
  readonly actor: ListingBridgeAuthorizedActor;
  readonly job?: ListingBridgeAuthorizedJob;
  readonly authority: 'SERVER_RECHECKED';
}

export interface ListingBridgeServerAuthorizationDb {
  readonly user: {
    findUnique(args: {
      where: { id: string };
      select: {
        id: true;
        role: true;
        status: true;
        account_type: true;
        profile: { select: { verification_status: true } };
        businessProfile: { select: { verification_status: true } };
      };
    }): Promise<{
      id: string;
      role: string;
      status: string;
      account_type: string;
      profile: { verification_status: string } | null;
      businessProfile: { verification_status: string } | null;
    } | null>;
  };
  readonly listingImportJob: {
    findUnique(args: {
      where: { id: string };
      select: {
        id: true;
        provider_id: true;
        status: true;
        source_connector: true;
        authorization_method: true;
        correlation_id: true;
      };
    }): Promise<{
      id: string;
      provider_id: string;
      status: string;
      source_connector: string;
      authorization_method: string;
      correlation_id: string | null;
    } | null>;
  };
}

const providerRoles = new Set<UserRole>(['Individual Provider', 'Business Provider']);

const allowedJobStatesByAction: Record<ListingBridgeAuthorizedAction, readonly ListingImportJobStatus[]> = {
  START_IMPORT: ['CREATED'],
  RESUME_IMPORT: ['CREATED', 'AUTHORIZING', 'FETCHING', 'EXTRACTING', 'NORMALIZING', 'PROCESSING_MEDIA', 'VALIDATING', 'NEEDS_REVIEW', 'READY_FOR_DRAFT', 'FAILED_RETRYABLE'],
  CANCEL_IMPORT: ['CREATED', 'AUTHORIZING', 'FETCHING', 'EXTRACTING', 'NORMALIZING', 'PROCESSING_MEDIA', 'VALIDATING', 'NEEDS_REVIEW', 'READY_FOR_DRAFT', 'FAILED_RETRYABLE'],
  MODIFY_IMPORTED_FIELDS: ['NEEDS_REVIEW', 'READY_FOR_DRAFT'],
  CONFIRM_RIGHTS: ['CREATED', 'AUTHORIZING', 'FETCHING', 'EXTRACTING', 'NORMALIZING', 'VALIDATING', 'NEEDS_REVIEW', 'READY_FOR_DRAFT'],
  CREATE_DRAFT: ['READY_FOR_DRAFT'],
};

export class ListingBridgeServerAuthorizationService {
  constructor(
    private readonly db: ListingBridgeServerAuthorizationDb,
    private readonly auditSink: ListingBridgeSecurityAuditSink = new ListingBridgeAuditLogSink(),
  ) {}

  async authorize(input: ListingBridgeServerAuthorizationInput): Promise<ListingBridgeServerAuthorizationDecision> {
    if (!input.actorUserId?.trim()) {
      await this.auditDenied(input, 'UNAUTHORIZED');
      throw new ListingBridgeSecurityError({ code: 'UNAUTHORIZED' });
    }

    const actor = await this.db.user.findUnique({
      where: { id: input.actorUserId },
      select: {
        id: true,
        role: true,
        status: true,
        account_type: true,
        profile: { select: { verification_status: true } },
        businessProfile: { select: { verification_status: true } },
      },
    });
    if (!actor || actor.status !== 'Verified') {
      await this.auditDenied(input, 'FORBIDDEN');
      throw new ListingBridgeSecurityError({ code: 'FORBIDDEN' });
    }

    const role = actor.role as UserRole;
    const verificationStatus = actor.businessProfile?.verification_status ?? actor.profile?.verification_status ?? 'Unverified';
    if (!providerRoles.has(role) || verificationStatus !== 'Verified') {
      await this.auditDenied(input, 'FORBIDDEN', { role: actor.role, verificationStatus });
      throw new ListingBridgeSecurityError({ code: 'FORBIDDEN' });
    }

    if (!hasPermission(role, 'listings', requiredListingPermission(input.action))) {
      await this.auditDenied(input, 'FORBIDDEN', { role: actor.role, action: input.action });
      throw new ListingBridgeSecurityError({ code: 'FORBIDDEN' });
    }

    const job = input.importJobId ? await this.resolveAuthorizedJob(input) : undefined;
    this.assertConnectorAuthorization(input);
    this.assertCredentialAuthorization(input);

    return Object.freeze({
      authorized: true,
      action: input.action,
      actor: Object.freeze({
        id: actor.id,
        role,
        status: actor.status,
        accountType: actor.account_type,
        providerVerificationStatus: verificationStatus,
      }),
      job,
      authority: 'SERVER_RECHECKED',
    });
  }

  private async resolveAuthorizedJob(input: ListingBridgeServerAuthorizationInput): Promise<ListingBridgeAuthorizedJob> {
    const job = await this.db.listingImportJob.findUnique({
      where: { id: input.importJobId as string },
      select: {
        id: true,
        provider_id: true,
        status: true,
        source_connector: true,
        authorization_method: true,
        correlation_id: true,
      },
    });

    if (!job || job.provider_id !== input.actorUserId) {
      await this.auditDenied(input, 'OWNERSHIP_MISMATCH');
      throw new ListingBridgeSecurityError({ code: 'OWNERSHIP_MISMATCH' });
    }

    const status = job.status as ListingImportJobStatus;
    if (!allowedJobStatesByAction[input.action].includes(status)) {
      await this.auditDenied(input, 'FORBIDDEN', { jobStatus: status, action: input.action });
      throw new ListingBridgeSecurityError({ code: 'FORBIDDEN' });
    }

    return Object.freeze({
      id: job.id,
      providerId: job.provider_id,
      status,
      sourceConnector: job.source_connector,
      authorizationMethod: job.authorization_method,
      correlationId: job.correlation_id ?? undefined,
    });
  }

  private assertConnectorAuthorization(input: ListingBridgeServerAuthorizationInput): void {
    if (!input.connectorAuthorization) return;
    if (input.connectorAuthorization.authorized) return;
    const code = input.connectorAuthorization.status === 'REQUIRES_PROVIDER_RIGHTS_CONFIRMATION'
      ? 'RIGHTS_CONFIRMATION_REQUIRED'
      : 'UNAUTHORIZED';
    throw new ListingBridgeSecurityError({
      code,
      safeDetails: {
        connectorId: input.connectorAuthorization.connectorId,
        status: input.connectorAuthorization.status,
      },
    });
  }

  private assertCredentialAuthorization(input: ListingBridgeServerAuthorizationInput): void {
    if (!input.credentialDecision || input.credentialDecision.authorized) return;
    const code = input.credentialDecision.status === 'REVOKED'
      ? 'AUTHORIZATION_REVOKED'
      : input.credentialDecision.status === 'EXPIRED' ? 'AUTHORIZATION_EXPIRED' : 'UNAUTHORIZED';
    throw new ListingBridgeSecurityError({
      code,
      safeDetails: {
        connectorId: input.credentialDecision.connectorId,
        status: input.credentialDecision.status,
        missingScopes: input.credentialDecision.missingScopes.join(','),
      },
    });
  }

  private async auditDenied(
    input: ListingBridgeServerAuthorizationInput,
    reason: string,
    safeDetails: Readonly<Record<string, unknown>> = {},
  ): Promise<void> {
    await this.auditSink.write({
      actorUserId: input.actorUserId,
      importJobId: input.importJobId,
      action: `${input.action}_REJECTED`,
      outcome: 'BLOCK',
      reason,
      correlationId: input.correlationId,
      ipAddress: input.ipAddress,
      safeDetails,
    });
  }
}

function requiredListingPermission(action: ListingBridgeAuthorizedAction): 'create' | 'update' | 'delete' {
  if (action === 'START_IMPORT' || action === 'CREATE_DRAFT') return 'create';
  if (action === 'CANCEL_IMPORT') return 'delete';
  return 'update';
}
