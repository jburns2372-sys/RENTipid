import type { ListingBridgeAuthorizationType } from '../types/canonical-contract';
import {
  ListingBridgeSecurityError,
  type ListingBridgeSecurityErrorCode,
} from '../security/errors';

export type ListingBridgeCredentialStatus = 'VALID' | 'MISSING' | 'EXPIRED' | 'REVOKED' | 'INVALID';

export interface ListingBridgeCredentialHandle {
  readonly connectorId: string;
  readonly authorizationType: ListingBridgeAuthorizationType;
  readonly credentialReference?: string;
  readonly status: ListingBridgeCredentialStatus;
  readonly scopes: readonly string[];
  readonly expiresAt?: string;
  readonly revokedAt?: string;
}

export interface ListingBridgeCredentialRequirement {
  readonly connectorId: string;
  readonly authorizationType: ListingBridgeAuthorizationType;
  readonly requiredScopes: readonly string[];
  readonly credentialReferenceRequired: boolean;
  readonly now?: Date;
}

export interface ListingBridgeCredentialDecision {
  readonly connectorId: string;
  readonly authorizationType: ListingBridgeAuthorizationType;
  readonly authorized: boolean;
  readonly status: ListingBridgeCredentialStatus;
  readonly credentialReference?: string;
  readonly grantedScopes: readonly string[];
  readonly missingScopes: readonly string[];
  readonly rawCredentialMaterialExposed: false;
}

const serverSideAuthorizationTypes = new Set<ListingBridgeAuthorizationType>([
  'API_KEY_SERVER_SIDE',
  'OAUTH_SERVER_SIDE',
  'API_KEY',
  'OAUTH',
]);

export function assertOpaqueCredentialReference(reference: string | undefined): string {
  if (!reference?.trim()) {
    throw new ListingBridgeSecurityError({ code: 'UNAUTHORIZED', internalMessage: 'Missing connector credential reference' });
  }
  if (!/^lbcred_[a-zA-Z0-9._:-]{8,160}$/.test(reference)) {
    throw new ListingBridgeSecurityError({ code: 'UNAUTHORIZED', internalMessage: 'Invalid connector credential reference format' });
  }
  if (/secret|token|bearer|api[_-]?key|password/i.test(reference)) {
    throw new ListingBridgeSecurityError({ code: 'UNAUTHORIZED', internalMessage: 'Credential reference must not contain raw secret material' });
  }

  return reference;
}

export function evaluateListingBridgeCredentialBoundary(
  handle: ListingBridgeCredentialHandle | null,
  requirement: ListingBridgeCredentialRequirement,
): ListingBridgeCredentialDecision {
  if (!requirement.credentialReferenceRequired && !serverSideAuthorizationTypes.has(requirement.authorizationType)) {
    return Object.freeze({
      connectorId: requirement.connectorId,
      authorizationType: requirement.authorizationType,
      authorized: true,
      status: 'VALID',
      grantedScopes: Object.freeze([]),
      missingScopes: Object.freeze([]),
      rawCredentialMaterialExposed: false,
    });
  }

  if (!handle) return credentialDenied(requirement, 'MISSING', requirement.requiredScopes);
  if (handle.connectorId !== requirement.connectorId || handle.authorizationType !== requirement.authorizationType) {
    return credentialDenied(requirement, 'INVALID', requirement.requiredScopes);
  }

  if (handle.status === 'REVOKED' || handle.revokedAt) return credentialDenied(requirement, 'REVOKED', requirement.requiredScopes);
  if (handle.status === 'EXPIRED') return credentialDenied(requirement, 'EXPIRED', requirement.requiredScopes);
  if (handle.status !== 'VALID') return credentialDenied(requirement, handle.status, requirement.requiredScopes);

  const now = requirement.now ?? new Date();
  if (handle.expiresAt && new Date(handle.expiresAt).getTime() <= now.getTime()) {
    return credentialDenied(requirement, 'EXPIRED', requirement.requiredScopes);
  }

  const granted = new Set(handle.scopes);
  const missingScopes = requirement.requiredScopes.filter(scope => !granted.has(scope));
  if (missingScopes.length > 0) return credentialDenied(requirement, 'INVALID', missingScopes);

  return Object.freeze({
    connectorId: requirement.connectorId,
    authorizationType: requirement.authorizationType,
    authorized: true,
    status: 'VALID',
    credentialReference: handle.credentialReference ? assertOpaqueCredentialReference(handle.credentialReference) : undefined,
    grantedScopes: Object.freeze([...handle.scopes]),
    missingScopes: Object.freeze([]),
    rawCredentialMaterialExposed: false,
  });
}

export function assertCredentialBoundaryAuthorized(decision: ListingBridgeCredentialDecision): void {
  if (decision.authorized) return;
  const code: ListingBridgeSecurityErrorCode =
    decision.status === 'EXPIRED' ? 'AUTHORIZATION_EXPIRED'
      : decision.status === 'REVOKED' ? 'AUTHORIZATION_REVOKED'
        : 'UNAUTHORIZED';
  throw new ListingBridgeSecurityError({
    code,
    safeDetails: {
      connectorId: decision.connectorId,
      authorizationType: decision.authorizationType,
      status: decision.status,
      missingScopes: decision.missingScopes.join(','),
    },
  });
}

function credentialDenied(
  requirement: ListingBridgeCredentialRequirement,
  status: ListingBridgeCredentialStatus,
  missingScopes: readonly string[],
): ListingBridgeCredentialDecision {
  return Object.freeze({
    connectorId: requirement.connectorId,
    authorizationType: requirement.authorizationType,
    authorized: false,
    status,
    grantedScopes: Object.freeze([]),
    missingScopes: Object.freeze([...missingScopes]),
    rawCredentialMaterialExposed: false,
  });
}
