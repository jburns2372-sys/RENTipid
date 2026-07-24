import {
  IncidentCaseStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';
import {
  createIncidentCaseApiHandlers,
  IncidentCaseRouteContext,
} from '../../../src/lib/security/cases/incident-case-api';
import {
  hasPermission,
  INCIDENT_CASE_PERMISSIONS,
  safeCaseErrorMessage,
  TRANSITION_OPTIONS,
} from '../../../src/components/security/cases/incident-case-ui';

const prisma = new PrismaClient();
class IntentionalRollback extends Error {}

type Counts = {
  users: number;
  cases: number;
  histories: number;
  notes: number;
  evidences: number;
  securityEvents: number;
  auditLogs: number;
};

type RoleMetadata = {
  rolname: string;
  database_name: string;
  rolcanlogin: boolean;
  rolsuper: boolean;
  rolcreatedb: boolean;
  rolcreaterole: boolean;
  rolreplication: boolean;
  rolbypassrls: boolean;
};

const analystPermissions = [
  INCIDENT_CASE_PERMISSIONS.VIEW,
  INCIDENT_CASE_PERMISSIONS.CREATE,
  INCIDENT_CASE_PERMISSIONS.TRIAGE,
  INCIDENT_CASE_PERMISSIONS.INVESTIGATE,
  INCIDENT_CASE_PERMISSIONS.ADD_NOTE,
  INCIDENT_CASE_PERMISSIONS.ADD_EVIDENCE,
];

const supervisorPermissions = [
  ...analystPermissions,
  INCIDENT_CASE_PERMISSIONS.ASSIGN,
  INCIDENT_CASE_PERMISSIONS.REASSIGN,
  INCIDENT_CASE_PERMISSIONS.REQUEST_CONTAINMENT,
  INCIDENT_CASE_PERMISSIONS.RESOLVE,
  INCIDENT_CASE_PERMISSIONS.CLOSE,
  INCIDENT_CASE_PERMISSIONS.REOPEN,
];

describe('Gate 4F Slice C6: integrated incident-case closeout', () => {
  let baselineCounts: Counts;

  const unique = () => `${Date.now()}-${randomBytes(4).toString('hex')}`;
  const reference = () =>
    `INC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomBytes(4)
      .toString('hex')
      .toUpperCase()}`;

  const readCounts = async (): Promise<Counts> => ({
    users: await prisma.user.count(),
    cases: await prisma.incidentCase.count(),
    histories: await prisma.incidentCaseHistory.count(),
    notes: await prisma.incidentCaseNote.count(),
    evidences: await prisma.incidentCaseEvidence.count(),
    securityEvents: await prisma.securityEvent.count(),
    auditLogs: await prisma.auditLog.count(),
  });

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
        email: `c6-${label}-${unique()}@example.test`,
        full_name: `C6 ${label}`,
        account_type: 'Individual',
        role,
        status: 'Verified',
        is_test_data: true,
      },
    });

  const createSecurityEvent = (tx: Prisma.TransactionClient) => {
    const now = new Date();
    return tx.securityEvent.create({
      data: {
        event_code: 'C6_TEST_EVENT',
        source_type: 'AUDIT_LOG',
        source_record_id: `c6-source-${unique()}`,
        security_domain: 'IDENTITY_AND_ACCESS',
        event_category: 'C6_TEST',
        event_classification: 'OBSERVATION',
        severity: 'LOW',
        environment: 'TEST',
        lifecycle_type: 'TEST',
        idempotency_key: `c6-event-${unique()}`,
        occurred_at: now,
        source_received_at: now,
      },
    });
  };

  const handlers = (
    database: Prisma.TransactionClient,
    actorUserId: string | null,
  ) =>
    createIncidentCaseApiHandlers({
      database,
      getAuthenticatedUser: jest
        .fn()
        .mockResolvedValue(actorUserId ? { id: actorUserId } : null),
    });

  const getRequest = (path: string) =>
    new Request(new URL(path, 'http://localhost'));

  const postRequest = (path: string, body: unknown) =>
    new Request(new URL(path, 'http://localhost'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  const context = (caseId: string): IncidentCaseRouteContext => ({
    params: Promise.resolve({ caseId }),
  });

  const json = async (response: Response) =>
    (await response.json()) as Record<string, unknown>;

  const transitionBody = (
    expectedStatus: IncidentCaseStatus,
    newStatus: IncidentCaseStatus,
    expectedVersion: number,
  ) => ({
    expected_status: expectedStatus,
    expected_version: expectedVersion,
    new_status: newStatus,
    idempotency_key: `c6-transition-${unique()}`,
  });

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    baselineCounts = await readCounts();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('uses only the guarded local database and restricted test role', async () => {
    const [role] = await prisma.$queryRaw<RoleMetadata[]>`
      SELECT
        current_user AS rolname,
        current_database() AS database_name,
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
      database_name: 'rentipid_test_soc',
      rolcanlogin: true,
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolreplication: false,
      rolbypassrls: false,
    });
  });

  it('proves behaviors 1-16, 19-23, and 27-30 through the published API and writers', async () => {
    await withRollback(async (tx) => {
      const analyst = await createUser(tx, 'SOC_ANALYST', 'analyst');
      const supervisor = await createUser(tx, 'SOC_SUPERVISOR', 'supervisor');
      const firstAssignee = await createUser(tx, 'SOC_ANALYST', 'first-assignee');
      const secondAssignee = await createUser(
        tx,
        'SOC_ANALYST',
        'second-assignee',
      );
      const renter = await createUser(tx, 'Renter', 'renter');
      const provider = await createUser(tx, 'Individual Provider', 'provider');

      const domainBefore = {
        cases: await tx.incidentCase.count(),
        histories: await tx.incidentCaseHistory.count(),
        notes: await tx.incidentCaseNote.count(),
        evidences: await tx.incidentCaseEvidence.count(),
        securityEvents: await tx.securityEvent.count(),
      };
      const unrelatedBefore = {
        bookings: await tx.booking.count(),
        listings: await tx.listing.count(),
        notifications: await tx.notification.count(),
      };

      // 1. Unauthenticated access is rejected before database mutation.
      const unauthenticated = await handlers(tx, null).listCases(
        getRequest('/api/admin/security/cases'),
      );
      expect(unauthenticated.status).toBe(401);
      expect({
        cases: await tx.incidentCase.count(),
        histories: await tx.incidentCaseHistory.count(),
      }).toEqual({
        cases: domainBefore.cases,
        histories: domainBefore.histories,
      });

      // 2. Ordinary renter and provider access is denied.
      expect(
        (
          await handlers(tx, renter.id).listCases(
            getRequest('/api/admin/security/cases'),
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await handlers(tx, provider.id).listCases(
            getRequest('/api/admin/security/cases'),
          )
        ).status,
      ).toBe(403);

      const securityEvent = await createSecurityEvent(tx);
      const securityEventBefore = await tx.securityEvent.findUniqueOrThrow({
        where: { id: securityEvent.id },
      });

      // 3-5 and 19. Analyst creation starts OPEN, atomically appends CREATED,
      // and links an existing event without mutating that event.
      const createResponse = await handlers(tx, analyst.id).createCase(
        postRequest('/api/admin/security/cases', {
          severity: 'HIGH',
          origin: 'SECURITY_EVENT',
          title: 'C6 integrated incident workflow',
          summary: 'Bounded integrated workflow summary.',
          security_event_id: securityEvent.id,
          initial_status: 'OPEN',
          idempotency_key: `c6-create-${unique()}`,
        }),
      );
      expect(createResponse.status).toBe(201);
      const incidentCase = await tx.incidentCase.findFirstOrThrow({
        where: { originating_security_event_id: securityEvent.id },
      });
      expect(incidentCase).toMatchObject({
        status: 'OPEN',
        version: 1,
        assigned_user_id: null,
        origin: 'SECURITY_EVENT',
      });
      expect(
        await tx.incidentCaseHistory.findMany({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toEqual([
        expect.objectContaining({
          previous_status: null,
          new_status: 'OPEN',
          reason: 'CREATED',
          actor_user_id: analyst.id,
        }),
      ]);
      expect(
        await tx.securityEvent.findUniqueOrThrow({
          where: { id: securityEvent.id },
        }),
      ).toEqual(securityEventBefore);

      // 6. Analyst performs the two approved analyst lifecycle transitions.
      expect(
        (
          await handlers(tx, analyst.id).transitionCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/status`,
              transitionBody('OPEN', 'TRIAGED', 1),
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await handlers(tx, analyst.id).transitionCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/status`,
              transitionBody('TRIAGED', 'INVESTIGATING', 2),
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(200);

      // 7. Analyst cannot assign or request containment; no domain row changes.
      const beforeAnalystDenials = await tx.incidentCase.findUniqueOrThrow({
        where: { id: incidentCase.id },
      });
      const historyBeforeAnalystDenials = await tx.incidentCaseHistory.count({
        where: { incident_case_id: incidentCase.id },
      });
      expect(
        (
          await handlers(tx, analyst.id).assignCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/assignment`,
              {
                assignee_user_id: firstAssignee.id,
                expected_version: 3,
                idempotency_key: `c6-analyst-assignment-${unique()}`,
              },
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await handlers(tx, analyst.id).transitionCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/status`,
              transitionBody('INVESTIGATING', 'CONTAINMENT_PENDING', 3),
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(403);
      expect(
        await tx.incidentCase.findUniqueOrThrow({
          where: { id: incidentCase.id },
        }),
      ).toEqual(beforeAnalystDenials);
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(historyBeforeAnalystDenials);

      // 8-9. Supervisor assignment and reassignment append non-status history.
      expect(
        (
          await handlers(tx, supervisor.id).assignCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/assignment`,
              {
                assignee_user_id: firstAssignee.id,
                expected_version: 3,
                idempotency_key: `c6-assign-${unique()}`,
              },
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await handlers(tx, supervisor.id).assignCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/assignment`,
              {
                assignee_user_id: secondAssignee.id,
                expected_version: 4,
                idempotency_key: `c6-reassign-${unique()}`,
              },
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(200);
      const assignmentHistory = await tx.incidentCaseHistory.findMany({
        where: {
          incident_case_id: incidentCase.id,
          reason: { in: ['ASSIGNED', 'REASSIGNED'] },
        },
        orderBy: [{ occurred_at: 'asc' }, { id: 'asc' }],
      });
      expect(assignmentHistory).toHaveLength(2);
      expect(assignmentHistory).toEqual(expect.arrayContaining([
        expect.objectContaining({
          reason: 'ASSIGNED',
          previous_status: 'INVESTIGATING',
          new_status: 'INVESTIGATING',
          assigned_to_user_id: firstAssignee.id,
        }),
        expect.objectContaining({
          reason: 'REASSIGNED',
          previous_status: 'INVESTIGATING',
          new_status: 'INVESTIGATING',
          assigned_to_user_id: secondAssignee.id,
        }),
      ]));

      // 10-12. Supervisor containment, resolution, closure, and reopen follow
      // the published lifecycle and timestamp contract.
      const supervisorTransitions: Array<
        [IncidentCaseStatus, IncidentCaseStatus, number]
      > = [
        ['INVESTIGATING', 'CONTAINMENT_PENDING', 5],
        ['CONTAINMENT_PENDING', 'RESOLVED', 6],
        ['RESOLVED', 'CLOSED', 7],
        ['CLOSED', 'REOPENED', 8],
      ];
      for (const [from, to, version] of supervisorTransitions) {
        expect(
          (
            await handlers(tx, supervisor.id).transitionCase(
              postRequest(
                `/api/admin/security/cases/${incidentCase.id}/status`,
                transitionBody(from, to, version),
              ),
              context(incidentCase.id),
            )
          ).status,
        ).toBe(200);
      }
      const reopened = await tx.incidentCase.findUniqueOrThrow({
        where: { id: incidentCase.id },
      });
      expect(reopened).toMatchObject({
        status: 'REOPENED',
        version: 9,
        assigned_user_id: secondAssignee.id,
        resolved_at: expect.any(Date),
        closed_at: expect.any(Date),
        reopened_at: expect.any(Date),
      });
      expect(reopened.reopened_at!.getTime()).toBeGreaterThanOrEqual(
        reopened.closed_at!.getTime(),
      );

      // 13. Prohibited transition is rejected without partial writes.
      const historyBeforeConflict = await tx.incidentCaseHistory.count({
        where: { incident_case_id: incidentCase.id },
      });
      expect(
        (
          await handlers(tx, supervisor.id).transitionCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/status`,
              transitionBody('REOPENED', 'RESOLVED', 9),
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(409);
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(historyBeforeConflict);

      // 14. Stale transition is rejected without a silent overwrite.
      expect(
        (
          await handlers(tx, analyst.id).transitionCase(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/status`,
              transitionBody('REOPENED', 'INVESTIGATING', 8),
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(409);
      expect(
        await tx.incidentCase.findUniqueOrThrow({
          where: { id: incidentCase.id },
        }),
      ).toMatchObject({
        status: 'REOPENED',
        version: 9,
        assigned_user_id: secondAssignee.id,
      });
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(historyBeforeConflict);

      // 15. Notes append without changing root status or assignment.
      const noteContent = 'C6 bounded authorized investigation observation.';
      for (const content of [noteContent, 'C6 second ordered note.']) {
        expect(
          (
            await handlers(tx, analyst.id).appendNote(
              postRequest(
                `/api/admin/security/cases/${incidentCase.id}/notes`,
                {
                  note_type: 'INVESTIGATION',
                  content,
                  idempotency_key: `c6-note-${unique()}`,
                },
              ),
              context(incidentCase.id),
            )
          ).status,
        ).toBe(200);
      }
      expect(
        await tx.incidentCase.findUniqueOrThrow({
          where: { id: incidentCase.id },
        }),
      ).toMatchObject({
        status: 'REOPENED',
        version: 9,
        assigned_user_id: secondAssignee.id,
      });

      // 16. Evidence references append without changing root state.
      const evidenceReference = `system-log:${unique()}`;
      for (const referenceKey of [
        evidenceReference,
        `system-log:${unique()}`,
      ]) {
        expect(
          (
            await handlers(tx, analyst.id).appendEvidence(
              postRequest(
                `/api/admin/security/cases/${incidentCase.id}/evidence`,
                {
                  evidence_type: 'SYSTEM_LOG',
                  source: 'INTERNAL_SYSTEM',
                  reference_key: referenceKey,
                  integrity_hash: 'a'.repeat(64),
                  collected_at: new Date().toISOString(),
                  content_type: 'application/json',
                  size_bytes: 256,
                  idempotency_key: `c6-evidence-${unique()}`,
                },
              ),
              context(incidentCase.id),
            )
          ).status,
        ).toBe(200);
      }
      expect(
        await tx.incidentCase.findUniqueOrThrow({
          where: { id: incidentCase.id },
        }),
      ).toMatchObject({
        status: 'REOPENED',
        version: 9,
        assigned_user_id: secondAssignee.id,
      });

      // 20. Invalid SecurityEvent linkage is rejected without partial writes.
      const beforeInvalidLink = {
        cases: await tx.incidentCase.count(),
        histories: await tx.incidentCaseHistory.count(),
      };
      expect(
        (
          await handlers(tx, analyst.id).createCase(
            postRequest('/api/admin/security/cases', {
              severity: 'MEDIUM',
              origin: 'SECURITY_EVENT',
              title: 'Rejected missing event link',
              security_event_id: `missing-${unique()}`,
              idempotency_key: `c6-invalid-link-${unique()}`,
            }),
          )
        ).status,
      ).toBe(404);
      expect({
        cases: await tx.incidentCase.count(),
        histories: await tx.incidentCaseHistory.count(),
      }).toEqual(beforeInvalidLink);

      // 21. List API is bounded and safely serialized.
      const listResponse = await handlers(tx, analyst.id).listCases(
        getRequest(
          `/api/admin/security/cases?limit=1&security_event_id=${securityEvent.id}`,
        ),
      );
      expect(listResponse.status).toBe(200);
      const listPayload = (await json(listResponse)) as {
        data: Array<Record<string, unknown>>;
        pagination: { limit: number; next_cursor: string | null };
      };
      expect(listPayload.data).toHaveLength(1);
      expect(listPayload.pagination).toEqual({
        limit: 1,
        next_cursor: null,
      });
      expect(listPayload.data[0]).toMatchObject({
        case_reference: incidentCase.case_reference,
        status: 'REOPENED',
      });
      expect(listPayload.data[0]).not.toHaveProperty('summary');
      expect(listPayload.data[0]).not.toHaveProperty('notes');
      expect(listPayload.data[0]).not.toHaveProperty('evidences');

      // 22. Detail API returns every child collection deterministically.
      const detailResponse = await handlers(tx, analyst.id).readCase(
        getRequest(`/api/admin/security/cases/${incidentCase.id}`),
        context(incidentCase.id),
      );
      expect(detailResponse.status).toBe(200);
      const detailPayload = (await json(detailResponse)) as {
        data: {
          histories: Array<{ id: string; occurred_at: string }>;
          notes: Array<{ id: string; created_at: string }>;
          evidences: Array<{ id: string; collected_at: string }>;
        };
      };
      const ordered = <T extends { id: string }>(
        values: T[],
        date: (value: T) => string,
      ) =>
        [...values].sort(
          (left, right) =>
            new Date(date(left)).getTime() - new Date(date(right)).getTime() ||
            left.id.localeCompare(right.id),
        );
      expect(detailPayload.data.histories).toEqual(
        ordered(detailPayload.data.histories, (value) => value.occurred_at),
      );
      expect(detailPayload.data.notes).toEqual(
        ordered(detailPayload.data.notes, (value) => value.created_at),
      );
      expect(detailPayload.data.evidences).toEqual(
        ordered(detailPayload.data.evidences, (value) => value.collected_at),
      );

      // 23. Unauthorized API mutation creates no case-domain changes.
      const beforeUnauthorizedMutation = {
        cases: await tx.incidentCase.count(),
        histories: await tx.incidentCaseHistory.count(),
        notes: await tx.incidentCaseNote.count(),
        evidences: await tx.incidentCaseEvidence.count(),
      };
      expect(
        (
          await handlers(tx, renter.id).appendNote(
            postRequest(
              `/api/admin/security/cases/${incidentCase.id}/notes`,
              {
                note_type: 'INTERNAL',
                content: 'Rejected unauthorized note.',
                idempotency_key: `c6-denied-note-${unique()}`,
              },
            ),
            context(incidentCase.id),
          )
        ).status,
      ).toBe(403);
      expect({
        cases: await tx.incidentCase.count(),
        histories: await tx.incidentCaseHistory.count(),
        notes: await tx.incidentCaseNote.count(),
        evidences: await tx.incidentCaseEvidence.count(),
      }).toEqual(beforeUnauthorizedMutation);

      // 27. API and UI errors expose no implementation or credential detail.
      const failingIncidentCaseDelegate = new Proxy(tx.incidentCase, {
        get(target, property, receiver) {
          if (property === 'findMany') {
            return async () => {
              throw new Error(
                'Prisma SQL password DATABASE_URL connection_string sentinel',
              );
            };
          }
          return Reflect.get(target, property, receiver);
        },
      });
      const failingDatabase = new Proxy(tx, {
        get(target, property, receiver) {
          if (property === 'incidentCase') return failingIncidentCaseDelegate;
          return Reflect.get(target, property, receiver);
        },
      }) as Prisma.TransactionClient;
      const failingList = await handlers(
        failingDatabase,
        analyst.id,
      ).listCases(getRequest('/api/admin/security/cases'));
      expect(failingList.status).toBe(500);
      const serializedApiError = JSON.stringify(await json(failingList));
      expect(serializedApiError).not.toMatch(
        /Prisma|SQL|password|token|database_url|connection_string|postgres/i,
      );
      expect(safeCaseErrorMessage(500)).not.toMatch(
        /Prisma|SQL|password|token|database|connection/i,
      );

      // 28. Audit output excludes note/evidence content and credential fields.
      const audits = JSON.stringify(
        await tx.auditLog.findMany({
          where: {
            actor_user_id: {
              in: [analyst.id, supervisor.id, renter.id, provider.id],
            },
          },
        }),
      );
      expect(audits).not.toContain(noteContent);
      expect(audits).not.toContain(evidenceReference);
      expect(audits).not.toMatch(
        /password|access_token|refresh_token|database_url|connection_string|raw_session/i,
      );

      // 29. The workflow creates no unrelated records.
      expect({
        bookings: await tx.booking.count(),
        listings: await tx.listing.count(),
        notifications: await tx.notification.count(),
      }).toEqual(unrelatedBefore);

      // 30. Final case and child counts exactly match successful operations.
      expect(
        await tx.incidentCase.count({ where: { id: incidentCase.id } }),
      ).toBe(1);
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(9);
      expect(
        await tx.incidentCaseNote.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(2);
      expect(
        await tx.incidentCaseEvidence.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(2);
      expect(await tx.securityEvent.count()).toBe(domainBefore.securityEvents + 1);
    });
  });

  const assertForensicMutationRejected = async (
    table: 'history' | 'note' | 'evidence',
    operation: 'update' | 'delete',
  ) => {
    await expect(
      prisma.$transaction(async (tx) => {
        const actor = await createUser(
          tx,
          'SOC_SUPERVISOR',
          `${table}-${operation}`,
        );
        const incidentCase = await tx.incidentCase.create({
          data: {
            case_reference: reference(),
            status: 'OPEN',
            severity: 'MEDIUM',
            origin: 'MANUAL',
            title: 'C6 append-only trigger probe',
            opened_at: new Date(),
            created_by_user_id: actor.id,
          },
        });
        const history = await tx.incidentCaseHistory.create({
          data: {
            incident_case_id: incidentCase.id,
            previous_status: null,
            new_status: 'OPEN',
            reason: 'CREATED',
            actor_user_id: actor.id,
            occurred_at: new Date(),
            idempotency_key: `c6-history-${unique()}`,
          },
        });
        const content = 'C6 append-only note.';
        const note = await tx.incidentCaseNote.create({
          data: {
            incident_case_id: incidentCase.id,
            actor_user_id: actor.id,
            note_type: 'INTERNAL',
            content,
            content_hash: createHash('sha256').update(content).digest('hex'),
            idempotency_key: `c6-note-${unique()}`,
          },
        });
        const evidence = await tx.incidentCaseEvidence.create({
          data: {
            incident_case_id: incidentCase.id,
            evidence_type: 'SYSTEM_LOG',
            source_classification: 'INTERNAL_SYSTEM',
            added_by_user_id: actor.id,
            collected_at: new Date(),
            reference_key: `system-log:${unique()}`,
            integrity_hash: 'b'.repeat(64),
            idempotency_key: `c6-evidence-${unique()}`,
          },
        });

        if (table === 'history' && operation === 'update') {
          await tx.incidentCaseHistory.update({
            where: { id: history.id },
            data: { reason_note: 'Rejected update.' },
          });
        } else if (table === 'history') {
          await tx.incidentCaseHistory.delete({ where: { id: history.id } });
        } else if (table === 'note' && operation === 'update') {
          await tx.incidentCaseNote.update({
            where: { id: note.id },
            data: { content: 'Rejected update.' },
          });
        } else if (table === 'note') {
          await tx.incidentCaseNote.delete({ where: { id: note.id } });
        } else if (operation === 'update') {
          await tx.incidentCaseEvidence.update({
            where: { id: evidence.id },
            data: { reference_key: `system-log:${unique()}` },
          });
        } else {
          await tx.incidentCaseEvidence.delete({ where: { id: evidence.id } });
        }
      }),
    ).rejects.toThrow();
  };

  it('17. rejects every history, note, and evidence update', async () => {
    for (const table of ['history', 'note', 'evidence'] as const) {
      await assertForensicMutationRejected(table, 'update');
    }
  });

  it('18. rejects every history, note, and evidence delete', async () => {
    for (const table of ['history', 'note', 'evidence'] as const) {
      await assertForensicMutationRejected(table, 'delete');
    }
  });

  it('24-26. exposes analyst UI controls correctly and reserves supervisor controls', () => {
    const analystOpen = TRANSITION_OPTIONS.OPEN.filter((option) =>
      hasPermission(analystPermissions, option.permission),
    );
    const analystTriaged = TRANSITION_OPTIONS.TRIAGED.filter((option) =>
      hasPermission(analystPermissions, option.permission),
    );
    const analystInvestigating = TRANSITION_OPTIONS.INVESTIGATING.filter(
      (option) => hasPermission(analystPermissions, option.permission),
    );
    const supervisorInvestigating = TRANSITION_OPTIONS.INVESTIGATING.filter(
      (option) => hasPermission(supervisorPermissions, option.permission),
    );

    expect(analystOpen.map(({ label }) => label)).toEqual(['Mark triaged']);
    expect(analystTriaged.map(({ label }) => label)).toEqual([
      'Start investigation',
    ]);
    expect(analystInvestigating).toEqual([]);
    expect(
      hasPermission(analystPermissions, INCIDENT_CASE_PERMISSIONS.ADD_NOTE),
    ).toBe(true);
    expect(
      hasPermission(analystPermissions, INCIDENT_CASE_PERMISSIONS.ADD_EVIDENCE),
    ).toBe(true);
    expect(
      hasPermission(analystPermissions, INCIDENT_CASE_PERMISSIONS.ASSIGN),
    ).toBe(false);
    expect(supervisorInvestigating.map(({ label }) => label)).toEqual([
      'Request containment',
      'Resolve case',
    ]);
    expect(
      hasPermission(supervisorPermissions, INCIDENT_CASE_PERMISSIONS.ASSIGN),
    ).toBe(true);
    expect(
      hasPermission(supervisorPermissions, INCIDENT_CASE_PERMISSIONS.REASSIGN),
    ).toBe(true);
  });

  it('leaves no persistent workflow, forensic, event, user, or audit records', async () => {
    expect(await readCounts()).toEqual(baselineCounts);
  });
});
