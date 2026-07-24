import {
  IncidentCaseStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';
import {
  createIncidentCaseApiHandlers,
  IncidentCaseRouteContext,
} from '../../../src/lib/security/cases/incident-case-api';

const prisma = new PrismaClient();
class IntentionalRollback extends Error {}

describe('Gate 4F Slice C4: Incident-Case API Routes', () => {
  const unique = () => `${Date.now()}-${randomBytes(4).toString('hex')}`;
  const reference = () =>
    `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(4)
      .toString('hex')
      .toUpperCase()}`;

  const withRollback = async (
    work: (tx: Prisma.TransactionClient) => Promise<void>,
  ) => {
    try {
      await prisma.$transaction(async (tx) => {
        await work(tx);
        throw new IntentionalRollback();
      });
    } catch (error) {
      if (!(error instanceof IntentionalRollback)) throw error;
    }
  };

  const createUser = (
    tx: Prisma.TransactionClient,
    role: string,
    label: string,
  ) =>
    tx.user.create({
      data: {
        email: `c4-${label}-${unique()}@example.test`,
        full_name: `C4 ${label}`,
        account_type: 'Individual',
        role,
        status: 'Verified',
        is_test_data: true,
      },
    });

  const lifecycleTimestamps = (status: IncidentCaseStatus) => ({
    opened_at: new Date('2026-07-24T01:00:00.000Z'),
    resolved_at:
      status === 'RESOLVED' || status === 'CLOSED' || status === 'REOPENED'
        ? new Date('2026-07-24T02:00:00.000Z')
        : null,
    closed_at:
      status === 'CLOSED' ? new Date('2026-07-24T03:00:00.000Z') : null,
    reopened_at:
      status === 'REOPENED' ? new Date('2026-07-24T04:00:00.000Z') : null,
  });

  const createCase = (
    tx: Prisma.TransactionClient,
    actorUserId: string,
    status: IncidentCaseStatus = 'OPEN',
    options?: {
      assignedUserId?: string;
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      origin?: 'MANUAL' | 'SECURITY_EVENT';
      securityEventId?: string;
      title?: string;
    },
  ) =>
    tx.incidentCase.create({
      data: {
        case_reference: reference(),
        status,
        severity: options?.severity ?? 'MEDIUM',
        origin: options?.origin ?? 'MANUAL',
        title: options?.title ?? `C4 ${status} case`,
        created_by_user_id: actorUserId,
        assigned_user_id: options?.assignedUserId,
        originating_security_event_id: options?.securityEventId,
        ...lifecycleTimestamps(status),
      },
    });

  const createSecurityEvent = (tx: Prisma.TransactionClient) => {
    const now = new Date();
    return tx.securityEvent.create({
      data: {
        event_code: 'C4_TEST_EVENT',
        source_type: 'AUDIT_LOG',
        source_record_id: `c4-source-${unique()}`,
        security_domain: 'IDENTITY_AND_ACCESS',
        event_category: 'C4_TEST',
        event_classification: 'OBSERVATION',
        severity: 'LOW',
        environment: 'TEST',
        lifecycle_type: 'TEST',
        idempotency_key: `c4-event-${unique()}`,
        occurred_at: now,
        source_received_at: now,
      },
    });
  };

  const handlers = (
    tx: Prisma.TransactionClient,
    actorUserId: string | null,
    sessionClaims: Record<string, unknown> = {},
  ) =>
    createIncidentCaseApiHandlers({
      database: tx,
      getAuthenticatedUser: jest.fn().mockResolvedValue(
        actorUserId
          ? {
              id: actorUserId,
              ...sessionClaims,
            }
          : null,
      ),
    });

  const getRequest = (path: string) =>
    new Request(new URL(path, 'http://localhost'));

  const postRequest = (path: string, body: unknown) =>
    new Request(new URL(path, 'http://localhost'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  const malformedPostRequest = (path: string) =>
    new Request(new URL(path, 'http://localhost'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"invalid"',
    });

  const context = (caseId: string): IncidentCaseRouteContext => ({
    params: Promise.resolve({ caseId }),
  });

  const createBody = (overrides: Record<string, unknown> = {}) => ({
    severity: 'MEDIUM',
    origin: 'MANUAL',
    title: 'C4 authorized case',
    idempotency_key: `create-${unique()}`,
    ...overrides,
  });

  const transitionBody = (
    expectedStatus: IncidentCaseStatus,
    newStatus: IncidentCaseStatus,
    expectedVersion = 1,
  ) => ({
    expected_status: expectedStatus,
    expected_version: expectedVersion,
    new_status: newStatus,
    idempotency_key: `transition-${unique()}`,
  });

  const assignmentBody = (
    assigneeUserId: string,
    expectedVersion = 1,
  ) => ({
    assignee_user_id: assigneeUserId,
    expected_version: expectedVersion,
    idempotency_key: `assignment-${unique()}`,
  });

  const noteBody = (content = 'Bounded C4 investigation observation.') => ({
    note_type: 'INVESTIGATION',
    content,
    idempotency_key: `note-${unique()}`,
  });

  const evidenceBody = (overrides: Record<string, unknown> = {}) => ({
    evidence_type: 'SYSTEM_LOG',
    source: 'INTERNAL_SYSTEM',
    reference_key: `system-log:${unique()}`,
    integrity_hash: 'a'.repeat(64),
    collected_at: new Date().toISOString(),
    content_type: 'text/plain',
    size_bytes: 128,
    idempotency_key: `evidence-${unique()}`,
    ...overrides,
  });

  const json = async (response: Response) =>
    (await response.json()) as Record<string, unknown>;

  beforeAll(() => assertSafeLocalTestDatabaseTarget());
  afterAll(async () => prisma.$disconnect());

  it('0. uses only the restricted guarded test database role', async () => {
    type RoleRow = {
      rolname: string;
      rolcanlogin: boolean;
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
      rolreplication: boolean;
      rolbypassrls: boolean;
    };
    const [role] = await prisma.$queryRaw<RoleRow[]>`
      SELECT
        rolname,
        rolcanlogin,
        rolsuper,
        rolcreatedb,
        rolcreaterole,
        rolreplication,
        rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `;
    expect(role).toEqual({
      rolname: 'rentipid_test_user',
      rolcanlogin: true,
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolreplication: false,
      rolbypassrls: false,
    });
  });

  it('1. unauthenticated list request returns 401', async () => {
    await withRollback(async (tx) => {
      const response = await handlers(tx, null).listCases(
        getRequest('/api/admin/security/cases'),
      );
      expect(response.status).toBe(401);
      expect(await json(response)).toMatchObject({
        error: { code: 'INCIDENT_CASE_AUTHENTICATION_REQUIRED' },
      });
    });
  });

  it('2. unauthenticated mutation returns 401', async () => {
    await withRollback(async (tx) => {
      const beforeCases = await tx.incidentCase.count();
      const response = await handlers(tx, null).createCase(
        postRequest('/api/admin/security/cases', createBody()),
      );
      expect(response.status).toBe(401);
      expect(await tx.incidentCase.count()).toBe(beforeCases);
    });
  });

  it('3. ordinary renter receives 403', async () => {
    await withRollback(async (tx) => {
      const renter = await createUser(tx, 'Renter', 'renter-denied');
      const response = await handlers(tx, renter.id).listCases(
        getRequest('/api/admin/security/cases'),
      );
      expect(response.status).toBe(403);
    });
  });

  it('4. ordinary provider receives 403', async () => {
    await withRollback(async (tx) => {
      const provider = await createUser(
        tx,
        'Individual Provider',
        'provider-denied',
      );
      const row = await createCase(tx, provider.id);
      const response = await handlers(tx, provider.id).readCase(
        getRequest(`/api/admin/security/cases/${row.id}`),
        context(row.id),
      );
      expect(response.status).toBe(403);
    });
  });

  it('5. finance-only user receives 403', async () => {
    await withRollback(async (tx) => {
      const finance = await createUser(tx, 'Finance Admin', 'finance-denied');
      const response = await handlers(tx, finance.id).listCases(
        getRequest('/api/admin/security/cases'),
      );
      expect(response.status).toBe(403);
    });
  });

  it('6. SOC_ANALYST can perform allowed API operations', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'analyst-create');
      const response = await handlers(tx, analyst.id).createCase(
        postRequest('/api/admin/security/cases', createBody()),
      );
      expect(response.status).toBe(201);
      expect(await tx.incidentCase.count()).toBe(1);
      expect(await tx.incidentCaseHistory.count()).toBe(1);
    });
  });

  it('7. SOC_ANALYST cannot perform supervisor-only operations', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'analyst-assign');
      const target = await createUser(tx, 'SOC_ANALYST', 'analyst-target');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody(target.id),
        ),
        context(row.id),
      );
      expect(response.status).toBe(403);
      expect(
        await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
      ).toMatchObject({ assigned_user_id: null, version: 1 });
    });
  });

  it('8. SOC_SUPERVISOR can perform permitted supervisor operations', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'supervisor-assign',
      );
      const target = await createUser(tx, 'SOC_ANALYST', 'supervisor-target');
      const row = await createCase(tx, supervisor.id);
      const response = await handlers(tx, supervisor.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody(target.id),
        ),
        context(row.id),
      );
      expect(response.status).toBe(200);
      expect(
        await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
      ).toMatchObject({ assigned_user_id: target.id, version: 2 });
    });
  });

  it('9. caller-supplied fake role or actor cannot bypass RBAC', async () => {
    await withRollback(async (tx) => {
      const renter = await createUser(tx, 'Renter', 'fake-claims');
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'fake-target',
      );
      const beforeCases = await tx.incidentCase.count();
      const response = await handlers(tx, renter.id, {
        role: 'SOC_SUPERVISOR',
      }).createCase(
        postRequest(
          '/api/admin/security/cases',
          createBody({
            actor_user_id: supervisor.id,
            role: 'SOC_SUPERVISOR',
          }),
        ),
      );
      expect(response.status).toBe(400);
      expect(await tx.incidentCase.count()).toBe(beforeCases);
    });
  });

  it('10. denied requests create no case-domain changes', async () => {
    await withRollback(async (tx) => {
      const renter = await createUser(tx, 'Renter', 'denied-atomicity');
      const before = {
        cases: await tx.incidentCase.count(),
        history: await tx.incidentCaseHistory.count(),
        notes: await tx.incidentCaseNote.count(),
        evidence: await tx.incidentCaseEvidence.count(),
      };
      const response = await handlers(tx, renter.id).createCase(
        postRequest('/api/admin/security/cases', createBody()),
      );
      expect(response.status).toBe(403);
      expect({
        cases: await tx.incidentCase.count(),
        history: await tx.incidentCaseHistory.count(),
        notes: await tx.incidentCaseNote.count(),
        evidence: await tx.incidentCaseEvidence.count(),
      }).toEqual(before);
    });
  });

  it('11. authorized case listing succeeds', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'list');
      await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).listCases(
        getRequest('/api/admin/security/cases'),
      );
      const payload = (await json(response)) as {
        data: Array<{ id: string }>;
      };
      expect(response.status).toBe(200);
      expect(payload.data).toHaveLength(1);
    });
  });

  it('12. pagination is bounded by the repository maximum', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'pagination');
      const response = await handlers(tx, analyst.id).listCases(
        getRequest('/api/admin/security/cases?limit=101'),
      );
      expect(response.status).toBe(400);
    });
  });

  it('13. approved status, severity, origin, assignee, and event filtering succeeds', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'filters');
      const event = await createSecurityEvent(tx);
      const matching = await createCase(tx, analyst.id, 'TRIAGED', {
        assignedUserId: analyst.id,
        severity: 'HIGH',
        origin: 'SECURITY_EVENT',
        securityEventId: event.id,
      });
      await createCase(tx, analyst.id, 'OPEN');
      const query = new URLSearchParams({
        status: 'TRIAGED',
        severity: 'HIGH',
        origin: 'SECURITY_EVENT',
        assigned_user_id: analyst.id,
        security_event_id: event.id,
      });
      const response = await handlers(tx, analyst.id).listCases(
        getRequest(`/api/admin/security/cases?${query.toString()}`),
      );
      const payload = (await json(response)) as {
        data: Array<{ id: string }>;
      };
      expect(response.status).toBe(200);
      expect(payload.data).toEqual([
        expect.objectContaining({ id: matching.id }),
      ]);
    });
  });

  it('14. unsupported filtering is rejected', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'bad-filter');
      const response = await handlers(tx, analyst.id).listCases(
        getRequest('/api/admin/security/cases?private_note=anything'),
      );
      expect(response.status).toBe(400);
    });
  });

  it('15. authorized case detail succeeds', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'detail');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).readCase(
        getRequest(`/api/admin/security/cases/${row.id}`),
        context(row.id),
      );
      const payload = (await json(response)) as {
        data: { id: string; case_reference: string };
      };
      expect(response.status).toBe(200);
      expect(payload.data).toMatchObject({
        id: row.id,
        case_reference: row.case_reference,
      });
    });
  });

  it('16. missing case returns 404', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'missing-detail');
      const response = await handlers(tx, analyst.id).readCase(
        getRequest('/api/admin/security/cases/missing-case'),
        context('missing-case'),
      );
      expect(response.status).toBe(404);
    });
  });

  it('17. list response excludes unrestricted note and evidence content', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'list-privacy');
      const row = await createCase(tx, analyst.id);
      const privateNote = 'Private case note that must not appear in a list.';
      const privateReference = `system-log:${unique()}`;
      await tx.incidentCaseNote.create({
        data: {
          incident_case_id: row.id,
          actor_user_id: analyst.id,
          note_type: 'INTERNAL',
          content: privateNote,
          content_hash: 'b'.repeat(64),
          idempotency_key: `note-${unique()}`,
        },
      });
      await tx.incidentCaseEvidence.create({
        data: {
          incident_case_id: row.id,
          evidence_type: 'SYSTEM_LOG',
          source_classification: 'INTERNAL_SYSTEM',
          added_by_user_id: analyst.id,
          collected_at: new Date(),
          reference_key: privateReference,
          integrity_hash: 'c'.repeat(64),
          idempotency_key: `evidence-${unique()}`,
        },
      });
      const response = await handlers(tx, analyst.id).listCases(
        getRequest('/api/admin/security/cases'),
      );
      const serialized = JSON.stringify(await json(response));
      expect(serialized).not.toContain(privateNote);
      expect(serialized).not.toContain(privateReference);
      expect(serialized).not.toMatch(/histories|notes|evidences/);
    });
  });

  it('18. detail child records use deterministic chronological and ID ordering', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'child-order');
      const row = await createCase(tx, analyst.id, 'TRIAGED');
      const later = new Date('2026-07-24T03:00:00.000Z');
      const earlier = new Date('2026-07-24T02:00:00.000Z');
      const historyLater = await tx.incidentCaseHistory.create({
        data: {
          incident_case_id: row.id,
          previous_status: 'OPEN',
          new_status: 'TRIAGED',
          reason: 'TRIAGED',
          actor_user_id: analyst.id,
          occurred_at: later,
          idempotency_key: `history-later-${unique()}`,
        },
      });
      const historyEarlier = await tx.incidentCaseHistory.create({
        data: {
          incident_case_id: row.id,
          previous_status: null,
          new_status: 'OPEN',
          reason: 'CREATED',
          actor_user_id: analyst.id,
          occurred_at: earlier,
          idempotency_key: `history-earlier-${unique()}`,
        },
      });
      const response = await handlers(tx, analyst.id).readCase(
        getRequest(`/api/admin/security/cases/${row.id}`),
        context(row.id),
      );
      const payload = (await json(response)) as {
        data: { histories: Array<{ id: string }> };
      };
      expect(payload.data.histories.map(({ id }) => id)).toEqual([
        historyEarlier.id,
        historyLater.id,
      ]);
    });
  });

  it('19. authorized creation returns 201', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'create-201');
      const response = await handlers(tx, analyst.id).createCase(
        postRequest('/api/admin/security/cases', createBody()),
      );
      expect(response.status).toBe(201);
    });
  });

  it('20. creation always produces OPEN status', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'create-open');
      const response = await handlers(tx, analyst.id).createCase(
        postRequest(
          '/api/admin/security/cases',
          createBody({ initial_status: 'OPEN' }),
        ),
      );
      const payload = (await json(response)) as {
        data: { incident_case: { status: string }; history: { reason: string } };
      };
      expect(payload.data.incident_case.status).toBe('OPEN');
      expect(payload.data.history.reason).toBe('CREATED');
    });
  });

  it('21. non-OPEN caller-selected status is rejected', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'create-non-open');
      const response = await handlers(tx, analyst.id).createCase(
        postRequest(
          '/api/admin/security/cases',
          createBody({ initial_status: 'TRIAGED' }),
        ),
      );
      expect(response.status).toBe(400);
      expect(await tx.incidentCase.count()).toBe(0);
    });
  });

  it('22. invalid enum input returns 400', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'invalid-enum');
      const response = await handlers(tx, analyst.id).createCase(
        postRequest(
          '/api/admin/security/cases',
          createBody({ severity: 'EXTREME' }),
        ),
      );
      expect(response.status).toBe(400);
    });
  });

  it('23. invalid SecurityEvent reference returns 404', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'missing-event');
      const response = await handlers(tx, analyst.id).createCase(
        postRequest(
          '/api/admin/security/cases',
          createBody({
            origin: 'SECURITY_EVENT',
            security_event_id: 'missing-security-event',
          }),
        ),
      );
      expect(response.status).toBe(404);
    });
  });

  it('24. invalid linked-event creation produces no partial writes', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'event-atomicity');
      const beforeCases = await tx.incidentCase.count();
      const beforeHistory = await tx.incidentCaseHistory.count();
      const response = await handlers(tx, analyst.id).createCase(
        postRequest(
          '/api/admin/security/cases',
          createBody({
            origin: 'SECURITY_EVENT',
            security_event_id: 'missing-security-event',
          }),
        ),
      );
      expect(response.status).toBe(404);
      expect(await tx.incidentCase.count()).toBe(beforeCases);
      expect(await tx.incidentCaseHistory.count()).toBe(beforeHistory);
    });
  });

  it('25. approved transition succeeds', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'triage');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).transitionCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/status`,
          transitionBody('OPEN', 'TRIAGED'),
        ),
        context(row.id),
      );
      expect(response.status).toBe(200);
      expect(
        await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
      ).toMatchObject({ status: 'TRIAGED', version: 2 });
    });
  });

  it('26. prohibited transition returns 409', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'bad-transition',
      );
      const row = await createCase(tx, supervisor.id);
      const response = await handlers(tx, supervisor.id).transitionCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/status`,
          transitionBody('OPEN', 'CLOSED'),
        ),
        context(row.id),
      );
      expect(response.status).toBe(409);
    });
  });

  it('27. self-transition returns 409', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'self-transition');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).transitionCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/status`,
          transitionBody('OPEN', 'OPEN'),
        ),
        context(row.id),
      );
      expect(response.status).toBe(409);
    });
  });

  it('28. stale or conflicting transition returns 409', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'stale-transition');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).transitionCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/status`,
          transitionBody('OPEN', 'TRIAGED', 2),
        ),
        context(row.id),
      );
      expect(response.status).toBe(409);
    });
  });

  it('29. failed transition creates no partial changes', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'transition-atomicity',
      );
      const row = await createCase(tx, supervisor.id);
      const beforeHistory = await tx.incidentCaseHistory.count({
        where: { incident_case_id: row.id },
      });
      const response = await handlers(tx, supervisor.id).transitionCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/status`,
          transitionBody('OPEN', 'CLOSED'),
        ),
        context(row.id),
      );
      expect(response.status).toBe(409);
      expect(
        await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
      ).toMatchObject({ status: 'OPEN', version: 1 });
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(beforeHistory);
    });
  });

  it('30. analyst cannot perform supervisor-only transition', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'analyst-resolve');
      const row = await createCase(tx, analyst.id, 'INVESTIGATING');
      const response = await handlers(tx, analyst.id).transitionCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/status`,
          transitionBody('INVESTIGATING', 'RESOLVED'),
        ),
        context(row.id),
      );
      expect(response.status).toBe(403);
    });
  });

  it('31. supervisor assignment succeeds', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'assignment',
      );
      const assignee = await createUser(tx, 'SOC_ANALYST', 'assignee');
      const row = await createCase(tx, supervisor.id);
      const response = await handlers(tx, supervisor.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody(assignee.id),
        ),
        context(row.id),
      );
      expect(response.status).toBe(200);
      const payload = (await json(response)) as {
        data: { history: { reason: string } };
      };
      expect(payload.data.history.reason).toBe('ASSIGNED');
    });
  });

  it('32. supervisor reassignment succeeds', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'reassignment',
      );
      const first = await createUser(tx, 'SOC_ANALYST', 'first-assignee');
      const second = await createUser(tx, 'SOC_ANALYST', 'second-assignee');
      const row = await createCase(tx, supervisor.id, 'OPEN', {
        assignedUserId: first.id,
      });
      const response = await handlers(tx, supervisor.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody(second.id),
        ),
        context(row.id),
      );
      const payload = (await json(response)) as {
        data: { history: { reason: string } };
      };
      expect(response.status).toBe(200);
      expect(payload.data.history.reason).toBe('REASSIGNED');
    });
  });

  it('33. analyst assignment returns 403', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'assign-denied');
      const target = await createUser(tx, 'SOC_ANALYST', 'assign-target');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody(target.id),
        ),
        context(row.id),
      );
      expect(response.status).toBe(403);
    });
  });

  it('34. same-assignee request returns 409', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'same-assignee',
      );
      const assignee = await createUser(tx, 'SOC_ANALYST', 'same-target');
      const row = await createCase(tx, supervisor.id, 'OPEN', {
        assignedUserId: assignee.id,
      });
      const response = await handlers(tx, supervisor.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody(assignee.id),
        ),
        context(row.id),
      );
      expect(response.status).toBe(409);
    });
  });

  it('35. missing assignee returns 404', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'missing-assignee',
      );
      const row = await createCase(tx, supervisor.id);
      const response = await handlers(tx, supervisor.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody('missing-assignee'),
        ),
        context(row.id),
      );
      expect(response.status).toBe(404);
    });
  });

  it('36. failed assignment creates no partial changes', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'assignment-atomicity',
      );
      const row = await createCase(tx, supervisor.id);
      const beforeHistory = await tx.incidentCaseHistory.count({
        where: { incident_case_id: row.id },
      });
      const response = await handlers(tx, supervisor.id).assignCase(
        postRequest(
          `/api/admin/security/cases/${row.id}/assignment`,
          assignmentBody('missing-assignee'),
        ),
        context(row.id),
      );
      expect(response.status).toBe(404);
      expect(
        await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
      ).toMatchObject({ assigned_user_id: null, version: 1 });
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(beforeHistory);
    });
  });

  it('37. authorized note append succeeds', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'note');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).appendNote(
        postRequest(`/api/admin/security/cases/${row.id}/notes`, noteBody()),
        context(row.id),
      );
      expect(response.status).toBe(200);
      expect(
        await tx.incidentCaseNote.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(1);
    });
  });

  it('38. invalid note type returns 400', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'bad-note-type');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).appendNote(
        postRequest(`/api/admin/security/cases/${row.id}/notes`, {
          ...noteBody(),
          note_type: 'PASSWORD_DUMP',
        }),
        context(row.id),
      );
      expect(response.status).toBe(400);
    });
  });

  it('39. note append to a missing case returns 404', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'missing-note-case');
      const response = await handlers(tx, analyst.id).appendNote(
        postRequest('/api/admin/security/cases/missing-case/notes', noteBody()),
        context('missing-case'),
      );
      expect(response.status).toBe(404);
    });
  });

  it('40. note append does not change status or assignment', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'note-isolation');
      const row = await createCase(tx, analyst.id, 'INVESTIGATING', {
        assignedUserId: analyst.id,
      });
      const response = await handlers(tx, analyst.id).appendNote(
        postRequest(`/api/admin/security/cases/${row.id}/notes`, noteBody()),
        context(row.id),
      );
      expect(response.status).toBe(200);
      expect(
        await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
      ).toMatchObject({
        status: 'INVESTIGATING',
        assigned_user_id: analyst.id,
        version: 1,
      });
    });
  });

  it('41. note response omits hashes, idempotency keys, and unrestricted fields', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'note-serializer');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).appendNote(
        postRequest(`/api/admin/security/cases/${row.id}/notes`, noteBody()),
        context(row.id),
      );
      const serialized = JSON.stringify(await json(response));
      expect(serialized).not.toMatch(/content_hash|idempotency_key|password_hash/);
    });
  });

  it('42. authorized evidence append succeeds', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'evidence');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).appendEvidence(
        postRequest(
          `/api/admin/security/cases/${row.id}/evidence`,
          evidenceBody(),
        ),
        context(row.id),
      );
      expect(response.status).toBe(200);
      expect(
        await tx.incidentCaseEvidence.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(1);
    });
  });

  it('43. invalid evidence type or source returns 400', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'bad-evidence');
      const row = await createCase(tx, analyst.id);
      const invalidType = await handlers(tx, analyst.id).appendEvidence(
        postRequest(
          `/api/admin/security/cases/${row.id}/evidence`,
          evidenceBody({ evidence_type: 'RAW_SECRET' }),
        ),
        context(row.id),
      );
      const invalidSource = await handlers(tx, analyst.id).appendEvidence(
        postRequest(
          `/api/admin/security/cases/${row.id}/evidence`,
          evidenceBody({ source: 'UNRESTRICTED' }),
        ),
        context(row.id),
      );
      expect(invalidType.status).toBe(400);
      expect(invalidSource.status).toBe(400);
    });
  });

  it('44. evidence append to a missing case returns 404', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(
        tx,
        'SOC_ANALYST',
        'missing-evidence-case',
      );
      const response = await handlers(tx, analyst.id).appendEvidence(
        postRequest(
          '/api/admin/security/cases/missing-case/evidence',
          evidenceBody(),
        ),
        context('missing-case'),
      );
      expect(response.status).toBe(404);
    });
  });

  it('45. evidence append does not change status or assignment', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'evidence-isolation');
      const row = await createCase(tx, analyst.id, 'INVESTIGATING', {
        assignedUserId: analyst.id,
      });
      const response = await handlers(tx, analyst.id).appendEvidence(
        postRequest(
          `/api/admin/security/cases/${row.id}/evidence`,
          evidenceBody(),
        ),
        context(row.id),
      );
      expect(response.status).toBe(200);
      expect(
        await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
      ).toMatchObject({
        status: 'INVESTIGATING',
        assigned_user_id: analyst.id,
        version: 1,
      });
    });
  });

  it('46. sensitive credential-like evidence input is rejected', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(
        tx,
        'SOC_ANALYST',
        'sensitive-evidence',
      );
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).appendEvidence(
        postRequest(
          `/api/admin/security/cases/${row.id}/evidence`,
          evidenceBody({ reference_key: 'system-log:access_token-secret' }),
        ),
        context(row.id),
      );
      expect(response.status).toBe(400);
      expect(
        await tx.incidentCaseEvidence.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(0);
    });
  });

  it('47. API errors expose no Prisma, SQL, or stack internals', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'error-internals');
      const response = await handlers(tx, analyst.id).readCase(
        getRequest('/api/admin/security/cases/missing-case'),
        context('missing-case'),
      );
      const serialized = JSON.stringify(await json(response));
      expect(serialized).not.toMatch(
        /Prisma|SELECT|INSERT|UPDATE|DELETE FROM|stack|postgres/i,
      );
    });
  });

  it('48. API errors expose no credentials or connection details', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'error-privacy');
      const row = await createCase(tx, analyst.id);
      const response = await handlers(tx, analyst.id).appendNote(
        postRequest(
          `/api/admin/security/cases/${row.id}/notes`,
          noteBody('password=do-not-return'),
        ),
        context(row.id),
      );
      const serialized = JSON.stringify(await json(response));
      expect(response.status).toBe(400);
      expect(serialized).not.toMatch(
        /do-not-return|database_url|connection_string|postgresql:\/\//i,
      );
    });
  });

  it('49. request logging records neither raw note nor evidence bodies', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'request-logging');
      const row = await createCase(tx, analyst.id);
      const noteContent = 'Private bounded C4 note body.';
      const referenceKey = `system-log:${unique()}`;
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      try {
        await handlers(tx, analyst.id).appendNote(
          postRequest(
            `/api/admin/security/cases/${row.id}/notes`,
            noteBody(noteContent),
          ),
          context(row.id),
        );
        await handlers(tx, analyst.id).appendEvidence(
          postRequest(
            `/api/admin/security/cases/${row.id}/evidence`,
            evidenceBody({ reference_key: referenceKey }),
          ),
          context(row.id),
        );
        expect(consoleSpy).not.toHaveBeenCalled();
        const audits = JSON.stringify(
          await tx.auditLog.findMany({
            where: { actor_user_id: analyst.id },
          }),
        );
        expect(audits).not.toContain(noteContent);
        expect(audits).not.toContain(referenceKey);
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  it('50. API routes create no unrelated records', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'record-isolation');
      const unrelatedBefore = {
        bookings: await tx.booking.count(),
        listings: await tx.listing.count(),
        notifications: await tx.notification.count(),
        securityEvents: await tx.securityEvent.count(),
      };
      const response = await handlers(tx, analyst.id).createCase(
        postRequest('/api/admin/security/cases', createBody()),
      );
      expect(response.status).toBe(201);
      expect({
        bookings: await tx.booking.count(),
        listings: await tx.listing.count(),
        notifications: await tx.notification.count(),
        securityEvents: await tx.securityEvent.count(),
      }).toEqual(unrelatedBefore);
    });
  });

  it('51. valid SecurityEvent linkage succeeds without mutating the event', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'event-link');
      const event = await createSecurityEvent(tx);
      const before = await tx.securityEvent.findUniqueOrThrow({
        where: { id: event.id },
      });
      const response = await handlers(tx, analyst.id).createCase(
        postRequest(
          '/api/admin/security/cases',
          createBody({
            origin: 'SECURITY_EVENT',
            security_event_id: event.id,
          }),
        ),
      );
      expect(response.status).toBe(201);
      expect(
        await tx.incidentCase.findFirstOrThrow({
          where: { originating_security_event_id: event.id },
        }),
      ).toHaveProperty('origin', 'SECURITY_EVENT');
      expect(
        await tx.securityEvent.findUniqueOrThrow({ where: { id: event.id } }),
      ).toEqual(before);
    });
  });

  it('52. list ordering and cursor pagination are deterministic', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'root-order');
      const first = await createCase(tx, analyst.id, 'OPEN', {
        title: 'First deterministic case',
      });
      const second = await createCase(tx, analyst.id, 'OPEN', {
        title: 'Second deterministic case',
      });
      const firstPageResponse = await handlers(tx, analyst.id).listCases(
        getRequest('/api/admin/security/cases?limit=1'),
      );
      const firstPage = (await json(firstPageResponse)) as {
        data: Array<{ id: string }>;
        pagination: { next_cursor: string };
      };
      expect(firstPage.data).toHaveLength(1);
      expect(firstPage.pagination.next_cursor).toBe(firstPage.data[0].id);

      const secondPageResponse = await handlers(tx, analyst.id).listCases(
        getRequest(
          `/api/admin/security/cases?limit=1&cursor=${firstPage.pagination.next_cursor}`,
        ),
      );
      const secondPage = (await json(secondPageResponse)) as {
        data: Array<{ id: string }>;
      };
      expect(secondPage.data).toHaveLength(1);
      expect(new Set([firstPage.data[0].id, secondPage.data[0].id])).toEqual(
        new Set([first.id, second.id]),
      );
    });
  });

  it('53. malformed JSON returns a stable 400 response', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'malformed-json');
      const response = await handlers(tx, analyst.id).createCase(
        malformedPostRequest('/api/admin/security/cases'),
      );
      expect(response.status).toBe(400);
      expect(await json(response)).toMatchObject({
        error: { code: 'INCIDENT_CASE_INVALID_REQUEST' },
      });
    });
  });

  it('54. invalid dynamic case parameter returns 400', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'invalid-param');
      const response = await handlers(tx, analyst.id).readCase(
        getRequest('/api/admin/security/cases/invalid'),
        context(''),
      );
      expect(response.status).toBe(400);
    });
  });

  it('55. default pagination returns the repository-standard limit', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'default-limit');
      const response = await handlers(tx, analyst.id).listCases(
        getRequest('/api/admin/security/cases'),
      );
      const payload = (await json(response)) as {
        pagination: { limit: number };
      };
      expect(response.status).toBe(200);
      expect(payload.pagination.limit).toBe(50);
    });
  });

  it('56. supervisor transition matrix and reopen lifecycle remain service-authoritative', async () => {
    await withRollback(async (tx) => {
      const supervisor = await createUser(
        tx,
        'SOC_SUPERVISOR',
        'transition-matrix',
      );
      const cases = await Promise.all([
        createCase(tx, supervisor.id, 'TRIAGED'),
        createCase(tx, supervisor.id, 'INVESTIGATING'),
        createCase(tx, supervisor.id, 'RESOLVED'),
        createCase(tx, supervisor.id, 'CLOSED'),
      ]);
      const transitions: Array<
        [typeof cases[number], IncidentCaseStatus, IncidentCaseStatus]
      > = [
        [cases[0], 'TRIAGED', 'CONTAINMENT_PENDING'],
        [cases[1], 'INVESTIGATING', 'RESOLVED'],
        [cases[2], 'RESOLVED', 'CLOSED'],
        [cases[3], 'CLOSED', 'REOPENED'],
      ];
      for (const [row, from, to] of transitions) {
        const response = await handlers(tx, supervisor.id).transitionCase(
          postRequest(
            `/api/admin/security/cases/${row.id}/status`,
            transitionBody(from, to),
          ),
          context(row.id),
        );
        expect(response.status).toBe(200);
        expect(
          await tx.incidentCase.findUniqueOrThrow({ where: { id: row.id } }),
        ).toHaveProperty('status', to);
      }
      expect(
        await tx.incidentCase.findUniqueOrThrow({
          where: { id: cases[3].id },
        }),
      ).toMatchObject({
        closed_at: cases[3].closed_at,
        reopened_at: expect.any(Date),
      });
    });
  });
});
