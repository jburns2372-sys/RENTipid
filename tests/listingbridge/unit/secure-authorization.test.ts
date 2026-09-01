import {
  LISTINGBRIDGE_RIGHTS_CONFIRMATION_FIELD,
  LISTINGBRIDGE_RIGHTS_CONFIRMATION_VERSION,
  ListingBridgeRightsConfirmationService,
  ListingBridgeSecurityError,
  ListingBridgeServerAuthorizationService,
  assertCredentialBoundaryAuthorized,
  evaluateListingBridgeCredentialBoundary,
  type ListingBridgeRightsConfirmationDb,
  type ListingBridgeSecurityAuditEvent,
  type ListingBridgeServerAuthorizationDb,
} from '../../../src/lib/listingbridge';

function authDb(overrides: {
  readonly actor?: {
    id: string;
    role: string;
    status: string;
    account_type: string;
    profile: { verification_status: string } | null;
    businessProfile: { verification_status: string } | null;
  } | null;
  readonly job?: {
    id: string;
    provider_id: string;
    status: string;
    source_connector: string;
    authorization_method: string;
    correlation_id: string | null;
  } | null;
} = {}): ListingBridgeServerAuthorizationDb {
  return {
    user: {
      findUnique: jest.fn(async () => overrides.actor ?? {
        id: 'provider_1',
        role: 'Individual Provider',
        status: 'Verified',
        account_type: 'Individual',
        profile: { verification_status: 'Verified' },
        businessProfile: null,
      }),
    },
    listingImportJob: {
      findUnique: jest.fn(async () => overrides.job ?? {
        id: 'job_1',
        provider_id: 'provider_1',
        status: 'READY_FOR_DRAFT',
        source_connector: 'internal.test.fixture',
        authorization_method: 'PROVIDER_RIGHTS_CONFIRMATION',
        correlation_id: 'corr_1',
      }),
    },
  };
}

function auditSink(events: ListingBridgeSecurityAuditEvent[]) {
  return { write: jest.fn(async event => { events.push(event); }) };
}

describe('ListingBridge server authorization', () => {
  it('rejects unauthenticated actors', async () => {
    const events: ListingBridgeSecurityAuditEvent[] = [];
    const service = new ListingBridgeServerAuthorizationService(authDb(), auditSink(events));

    await expect(service.authorize({ action: 'START_IMPORT' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(events[0]).toMatchObject({ action: 'START_IMPORT_REJECTED', reason: 'UNAUTHORIZED' });
  });

  it('rejects wrong provider ownership and ignores client-supplied ownership claims by reloading the job', async () => {
    const service = new ListingBridgeServerAuthorizationService(authDb({
      job: {
        id: 'job_1',
        provider_id: 'different_provider',
        status: 'READY_FOR_DRAFT',
        source_connector: 'internal.test.fixture',
        authorization_method: 'PROVIDER_RIGHTS_CONFIRMATION',
        correlation_id: null,
      },
    }), auditSink([]));

    await expect(service.authorize({
      actorUserId: 'provider_1',
      action: 'CREATE_DRAFT',
      importJobId: 'job_1',
    })).rejects.toMatchObject({ code: 'OWNERSHIP_MISMATCH' });
  });

  it('rejects revoked and expired connector authorization states', async () => {
    const service = new ListingBridgeServerAuthorizationService(authDb(), auditSink([]));
    const revoked = evaluateListingBridgeCredentialBoundary({
      connectorId: 'api.connector',
      authorizationType: 'OAUTH_SERVER_SIDE',
      credentialReference: 'lbcred_connector_ref_12345',
      status: 'REVOKED',
      scopes: ['listing.read'],
    }, {
      connectorId: 'api.connector',
      authorizationType: 'OAUTH_SERVER_SIDE',
      requiredScopes: ['listing.read'],
      credentialReferenceRequired: true,
    });
    const expired = evaluateListingBridgeCredentialBoundary({
      connectorId: 'api.connector',
      authorizationType: 'OAUTH_SERVER_SIDE',
      credentialReference: 'lbcred_connector_ref_12345',
      status: 'VALID',
      scopes: ['listing.read'],
      expiresAt: '2026-08-30T00:00:00.000Z',
    }, {
      connectorId: 'api.connector',
      authorizationType: 'OAUTH_SERVER_SIDE',
      requiredScopes: ['listing.read'],
      credentialReferenceRequired: true,
      now: new Date('2026-09-01T00:00:00.000Z'),
    });

    await expect(service.authorize({
      actorUserId: 'provider_1',
      action: 'RESUME_IMPORT',
      importJobId: 'job_1',
      credentialDecision: revoked,
    })).rejects.toMatchObject({ code: 'AUTHORIZATION_REVOKED' });
    await expect(service.authorize({
      actorUserId: 'provider_1',
      action: 'RESUME_IMPORT',
      importJobId: 'job_1',
      credentialDecision: expired,
    })).rejects.toMatchObject({ code: 'AUTHORIZATION_EXPIRED' });
    expect(() => assertCredentialBoundaryAuthorized(revoked)).toThrow(ListingBridgeSecurityError);
  });

  it('allows a verified provider only after server-side actor, ownership, job-state, and credential checks pass', async () => {
    const service = new ListingBridgeServerAuthorizationService(authDb(), auditSink([]));
    const credentialDecision = evaluateListingBridgeCredentialBoundary({
      connectorId: 'api.connector',
      authorizationType: 'OAUTH_SERVER_SIDE',
      credentialReference: 'lbcred_connector_ref_12345',
      status: 'VALID',
      scopes: ['listing.read'],
      expiresAt: '2026-12-30T00:00:00.000Z',
    }, {
      connectorId: 'api.connector',
      authorizationType: 'OAUTH_SERVER_SIDE',
      requiredScopes: ['listing.read'],
      credentialReferenceRequired: true,
      now: new Date('2026-09-01T00:00:00.000Z'),
    });

    const decision = await service.authorize({
      actorUserId: 'provider_1',
      action: 'CREATE_DRAFT',
      importJobId: 'job_1',
      credentialDecision,
    });

    expect(decision.authority).toBe('SERVER_RECHECKED');
    expect(decision.job?.providerId).toBe('provider_1');
    expect(JSON.stringify(credentialDecision)).not.toMatch(/token|secret|api_key/i);
  });
});

describe('ListingBridge provider rights confirmation', () => {
  function rightsDb(existingResolution: unknown = null): ListingBridgeRightsConfirmationDb {
    return {
      listingImportJob: {
        findUnique: jest.fn(async () => ({ id: 'job_1', provider_id: 'provider_1', correlation_id: 'corr_1' })),
      },
      listingImportResolution: {
        upsert: jest.fn(async () => ({})),
        findFirst: jest.fn(async () => existingResolution as never),
      },
      listingImportAuditEvent: {
        create: jest.fn(async () => ({})),
      },
    };
  }

  it('persists rights confirmation evidence using existing resolution and job audit infrastructure', async () => {
    const db = rightsDb();
    const events: ListingBridgeSecurityAuditEvent[] = [];
    const service = new ListingBridgeRightsConfirmationService(db, auditSink(events));
    const confirmedAt = new Date('2026-09-01T00:00:00.000Z');

    const evidence = await service.confirmRights({
      actorUserId: 'provider_1',
      importJobId: 'job_1',
      ownsOrManagesProperty: true,
      authorizedToSubmitImportedInformation: true,
      hasImportedMediaReuseRights: true,
      acceptsAccuracyResponsibility: true,
      confirmedAt,
    });

    expect(evidence).toMatchObject({
      schemaVersion: LISTINGBRIDGE_RIGHTS_CONFIRMATION_VERSION,
      confirmationResult: 'CONFIRMED',
      actorUserId: 'provider_1',
      importJobId: 'job_1',
    });
    expect(db.listingImportResolution.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { job_id_field_name: { job_id: 'job_1', field_name: LISTINGBRIDGE_RIGHTS_CONFIRMATION_FIELD } },
    }));
    expect(db.listingImportAuditEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ event_type: 'AUTHORIZATION_COMPLETED' }),
    }));
    expect(events[0]).toMatchObject({ action: 'RIGHTS_CONFIRMED', outcome: 'CONFIRM' });
  });

  it('blocks the rights guard when durable confirmation evidence is absent', async () => {
    const service = new ListingBridgeRightsConfirmationService(rightsDb(null), auditSink([]));

    await expect(service.assertRightsConfirmationSatisfied('job_1', 'provider_1')).rejects.toMatchObject({
      code: 'RIGHTS_CONFIRMATION_REQUIRED',
    });
  });

  it('passes the rights guard when durable confirmation evidence is present', async () => {
    const service = new ListingBridgeRightsConfirmationService(rightsDb({
      id: 'res_1',
      resolved_by_user_id: 'provider_1',
      resolved_at: new Date('2026-09-01T00:00:00.000Z'),
      resolved_value: {
        schemaVersion: LISTINGBRIDGE_RIGHTS_CONFIRMATION_VERSION,
        confirmationResult: 'CONFIRMED',
        ownsOrManagesProperty: true,
        authorizedToSubmitImportedInformation: true,
        hasImportedMediaReuseRights: true,
        acceptsAccuracyResponsibility: true,
      },
    }), auditSink([]));

    await expect(service.assertRightsConfirmationSatisfied('job_1', 'provider_1')).resolves.toBeUndefined();
  });
});
