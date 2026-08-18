import {
  IncidentCaseStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';
import {
  addIncidentCaseEvidence,
  addIncidentCaseNote,
  APPROVED_INCIDENT_CASE_TRANSITIONS,
  assignIncidentCase,
  createIncidentCase,
  IncidentCaseDatabase,
  transitionIncidentCaseStatus,
} from '../../../src/lib/security/cases/incident-case-writers.service';

const prisma = new PrismaClient();

class IntentionalRollback extends Error {}

type RoleMetadata = {
  database_name: string;
  rolcanlogin: boolean;
  rolsuper: boolean;
  rolcreatedb: boolean;
  rolcreaterole: boolean;
  rolreplication: boolean;
  rolbypassrls: boolean;
};

type TableCounts = {
  cases: number;
  histories: number;
  notes: number;
  evidences: number;
  securityEvents: number;
  auditLogs: number;
};

describe('Gate 4F Slice C2-S6: Incident Case Transactional Service Writers', () => {
  let baselineCounts: TableCounts;

  const unique = () => `${Date.now()}-${randomBytes(4).toString('hex')}`;
  const caseReference = () =>
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
      if (!(error instanceof IntentionalRollback)) {
        throw error;
      }
    }
  };

  const createUser = (
    tx: Prisma.TransactionClient,
    label: string,
    id?: string,
  ) =>
    tx.user.create({
      data: {
        ...(id ? { id } : {}),
        email: `c2-s6-${label}-${unique()}@example.test`,
        full_name: `C2-S6 ${label}`,
        account_type: 'Individual',
        role: 'Super Admin',
        status: 'Verified',
        is_test_data: true,
      },
    });

  const statusTimestamps = (status: IncidentCaseStatus) => {
    const openedAt = new Date('2026-07-24T01:00:00.000Z');
    const resolvedAt = new Date('2026-07-24T02:00:00.000Z');
    const closedAt = new Date('2026-07-24T03:00:00.000Z');
    const reopenedAt = new Date('2026-07-24T04:00:00.000Z');
    return {
      opened_at: openedAt,
      resolved_at:
        status === 'RESOLVED' || status === 'CLOSED' || status === 'REOPENED'
          ? resolvedAt
          : null,
      closed_at: status === 'CLOSED' ? closedAt : null,
      reopened_at: status === 'REOPENED' ? reopenedAt : null,
    };
  };

  const seedCase = (
    tx: Prisma.TransactionClient,
    status: IncidentCaseStatus,
    actorUserId: string,
    id?: string,
  ) =>
    tx.incidentCase.create({
      data: {
        ...(id ? { id } : {}),
        case_reference: caseReference(),
        status,
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: `C2-S6 ${status} case`,
        created_by_user_id: actorUserId,
        ...statusTimestamps(status),
      },
    });

  const readCounts = async (): Promise<TableCounts> => ({
    cases: await prisma.incidentCase.count(),
    histories: await prisma.incidentCaseHistory.count(),
    notes: await prisma.incidentCaseNote.count(),
    evidences: await prisma.incidentCaseEvidence.count(),
    securityEvents: await prisma.securityEvent.count(),
    auditLogs: await prisma.auditLog.count(),
  });

  const historyFailureProxy = (
    tx: Prisma.TransactionClient,
  ): Prisma.TransactionClient =>
    new Proxy(tx, {
      get(target, property, receiver) {
        if (property === 'incidentCaseHistory') {
          return new Proxy(target.incidentCaseHistory, {
            get(historyTarget, historyProperty, historyReceiver) {
              if (historyProperty === 'create') {
                return async () => {
                  throw new Error('C2_S6_INJECTED_HISTORY_FAILURE');
                };
              }
              return Reflect.get(
                historyTarget,
                historyProperty,
                historyReceiver,
              );
            },
          });
        }
        return Reflect.get(target, property, receiver);
      },
    });

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    baselineCounts = await readCounts();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('uses only rentipid_test_soc through the restricted test role', async () => {
    const [role] = await prisma.$queryRaw<RoleMetadata[]>`
      SELECT
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
      database_name: 'rentipid_test_soc',
      rolcanlogin: true,
      rolsuper: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolreplication: false,
      rolbypassrls: false,
    });
  });

  it('creates OPEN cases with reconciled CREATED history and actor attribution', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'creator');
      const result = await createIncidentCase(tx, {
        severity: 'HIGH',
        origin: 'MANUAL',
        title: 'Authoritative creation writer',
        summary: 'Bounded test summary',
        actorUserId: actor.id,
        occurredAt: new Date('2026-07-24T05:00:00.000Z'),
        historyIdempotencyKey: `create-${unique()}`,
      });

      expect(result.incidentCase.status).toBe('OPEN');
      expect(result.incidentCase.version).toBe(1);
      expect(result.incidentCase.created_by_user_id).toBe(actor.id);
      expect(result.history).toMatchObject({
        incident_case_id: result.incidentCase.id,
        previous_status: null,
        new_status: 'OPEN',
        reason: 'CREATED',
        actor_user_id: actor.id,
      });
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: result.incidentCase.id },
        }),
      ).toBe(1);
    });
  });

  it('rejects caller-selected non-OPEN status and invalid SecurityEvent linkage', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'invalid-create');

      await expect(
        createIncidentCase(tx, {
          severity: 'MEDIUM',
          origin: 'MANUAL',
          title: 'Invalid initial status',
          actorUserId: actor.id,
          initialStatus: 'TRIAGED',
          historyIdempotencyKey: `invalid-status-${unique()}`,
        }),
      ).rejects.toThrow('INITIAL_STATUS_MUST_BE_OPEN');
      await expect(
        createIncidentCase(tx, {
          severity: 'MEDIUM',
          origin: 'SECURITY_EVENT',
          title: 'Missing SecurityEvent',
          actorUserId: actor.id,
          securityEventId: `missing-event-${unique()}`,
          historyIdempotencyKey: `invalid-event-${unique()}`,
        }),
      ).rejects.toThrow('SECURITY_EVENT_NOT_FOUND');
      expect(await tx.incidentCase.count()).toBe(baselineCounts.cases);
    });
  });

  it('links an existing SecurityEvent without mutating or duplicating it', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'event-link');
      const event = await tx.securityEvent.create({
        data: {
          event_code: 'GATE4F_C2_S6_LINK',
          source_type: 'AUDIT_LOG',
          source_record_id: `c2-s6-${unique()}`,
          security_domain: 'IDENTITY_AND_ACCESS',
          event_category: 'case_linkage',
          event_classification: 'OBSERVATION',
          severity: 'MEDIUM',
          environment: 'TEST',
          lifecycle_type: 'TEST',
          idempotency_key: `event-${unique()}`,
          occurred_at: new Date(),
          source_received_at: new Date(),
        },
      });
      const before = await tx.securityEvent.findUniqueOrThrow({
        where: { id: event.id },
      });
      const result = await createIncidentCase(tx, {
        severity: 'MEDIUM',
        origin: 'SECURITY_EVENT',
        title: 'Linked case',
        actorUserId: actor.id,
        securityEventId: event.id,
        historyIdempotencyKey: `linked-${unique()}`,
      });
      const after = await tx.securityEvent.findUniqueOrThrow({
        where: { id: event.id },
      });

      expect(result.incidentCase.originating_security_event_id).toBe(event.id);
      expect(after).toEqual(before);
      expect(
        await tx.securityEvent.count({ where: { id: event.id } }),
      ).toBe(1);
    });
  });

  it('rolls back case creation when initial history insertion fails', async () => {
    const actorId = `c2-s6-atomic-actor-${unique()}`;
    const reference = caseReference();
    const failingRunner: IncidentCaseDatabase = {
      $transaction: async (operation) =>
        prisma.$transaction(async (tx) => {
          await createUser(tx, 'atomic-create', actorId);
          return operation(historyFailureProxy(tx));
        }),
    };

    await expect(
      createIncidentCase(failingRunner, {
        severity: 'CRITICAL',
        origin: 'MANUAL',
        title: 'Atomic creation failure',
        actorUserId: actorId,
        caseReference: reference,
        historyIdempotencyKey: `atomic-create-${unique()}`,
      }),
    ).rejects.toThrow('C2_S6_INJECTED_HISTORY_FAILURE');
    expect(
      await prisma.incidentCase.findUnique({
        where: { case_reference: reference },
      }),
    ).toBeNull();
    expect(await prisma.user.findUnique({ where: { id: actorId } })).toBeNull();
  });

  it('executes all 12 approved transitions with exact status history mapping', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'all-transitions');

      for (const [index, approved] of APPROVED_INCIDENT_CASE_TRANSITIONS.entries()) {
        const incidentCase = await seedCase(
          tx,
          approved.previousStatus,
          actor.id,
        );
        const result = await transitionIncidentCaseStatus(tx, {
          incidentCaseId: incidentCase.id,
          expectedStatus: approved.previousStatus,
          expectedVersion: 1,
          newStatus: approved.newStatus,
          actorUserId: actor.id,
          occurredAt: new Date(`2026-07-25T${String(index + 1).padStart(2, '0')}:00:00.000Z`),
          historyIdempotencyKey: `transition-${index}-${unique()}`,
        });

        expect(result.incidentCase.status).toBe(approved.newStatus);
        expect(result.incidentCase.version).toBe(2);
        expect(result.history).toMatchObject({
          previous_status: approved.previousStatus,
          new_status: approved.newStatus,
          reason: approved.reason,
          actor_user_id: actor.id,
        });
      }
      expect(APPROVED_INCIDENT_CASE_TRANSITIONS).toHaveLength(12);
    });
  });

  it('applies reconciled RESOLVED/CLOSED reopen chronology and resets the next resolution cycle', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'reopen');
      const resolved = await seedCase(tx, 'RESOLVED', actor.id);
      const resolvedReopen = await transitionIncidentCaseStatus(tx, {
        incidentCaseId: resolved.id,
        expectedStatus: 'RESOLVED',
        expectedVersion: 1,
        newStatus: 'REOPENED',
        actorUserId: actor.id,
        occurredAt: new Date('2026-07-24T05:00:00.000Z'),
        historyIdempotencyKey: `resolved-reopen-${unique()}`,
      });
      expect(resolvedReopen.incidentCase.closed_at).toBeNull();
      expect(resolvedReopen.incidentCase.reopened_at).toEqual(
        new Date('2026-07-24T05:00:00.000Z'),
      );

      const closed = await seedCase(tx, 'CLOSED', actor.id);
      const closedReopen = await transitionIncidentCaseStatus(tx, {
        incidentCaseId: closed.id,
        expectedStatus: 'CLOSED',
        expectedVersion: 1,
        newStatus: 'REOPENED',
        actorUserId: actor.id,
        occurredAt: new Date('2026-07-24T06:00:00.000Z'),
        historyIdempotencyKey: `closed-reopen-${unique()}`,
      });
      expect(closedReopen.incidentCase.closed_at).toEqual(
        new Date('2026-07-24T03:00:00.000Z'),
      );

      const investigating = await transitionIncidentCaseStatus(tx, {
        incidentCaseId: resolved.id,
        expectedStatus: 'REOPENED',
        expectedVersion: 2,
        newStatus: 'INVESTIGATING',
        actorUserId: actor.id,
        historyIdempotencyKey: `reopen-investigating-${unique()}`,
      });
      const reResolved = await transitionIncidentCaseStatus(tx, {
        incidentCaseId: resolved.id,
        expectedStatus: 'INVESTIGATING',
        expectedVersion: investigating.incidentCase.version,
        newStatus: 'RESOLVED',
        actorUserId: actor.id,
        occurredAt: new Date('2026-07-24T07:00:00.000Z'),
        historyIdempotencyKey: `re-resolved-${unique()}`,
      });
      expect(reResolved.incidentCase.resolved_at).toEqual(
        new Date('2026-07-24T07:00:00.000Z'),
      );
      expect(reResolved.incidentCase.reopened_at).toBeNull();
    });
  });

  it('rejects self, prohibited, and stale transitions without new history', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'invalid-transition');
      const incidentCase = await seedCase(tx, 'OPEN', actor.id);

      await expect(
        transitionIncidentCaseStatus(tx, {
          incidentCaseId: incidentCase.id,
          expectedStatus: 'OPEN',
          expectedVersion: 1,
          newStatus: 'OPEN',
          actorUserId: actor.id,
          historyIdempotencyKey: `self-${unique()}`,
        }),
      ).rejects.toThrow('SELF_TRANSITION_REJECTED');
      await expect(
        transitionIncidentCaseStatus(tx, {
          incidentCaseId: incidentCase.id,
          expectedStatus: 'OPEN',
          expectedVersion: 1,
          newStatus: 'CLOSED',
          actorUserId: actor.id,
          historyIdempotencyKey: `prohibited-${unique()}`,
        }),
      ).rejects.toThrow('TRANSITION_NOT_APPROVED');

      await transitionIncidentCaseStatus(tx, {
        incidentCaseId: incidentCase.id,
        expectedStatus: 'OPEN',
        expectedVersion: 1,
        newStatus: 'TRIAGED',
        actorUserId: actor.id,
        historyIdempotencyKey: `fresh-${unique()}`,
      });
      await expect(
        transitionIncidentCaseStatus(tx, {
          incidentCaseId: incidentCase.id,
          expectedStatus: 'OPEN',
          expectedVersion: 1,
          newStatus: 'TRIAGED',
          actorUserId: actor.id,
          historyIdempotencyKey: `stale-${unique()}`,
        }),
      ).rejects.toThrow('STALE_TRANSITION_CONFLICT');
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(1);
    });
  });

  it('rolls back a status update when transition history insertion fails', async () => {
    const actorId = `c2-s6-transition-actor-${unique()}`;
    const caseId = `c2-s6-transition-case-${unique()}`;
    const failingRunner: IncidentCaseDatabase = {
      $transaction: async (operation) =>
        prisma.$transaction(async (tx) => {
          await createUser(tx, 'atomic-transition', actorId);
          await seedCase(tx, 'OPEN', actorId, caseId);
          return operation(historyFailureProxy(tx));
        }),
    };

    await expect(
      transitionIncidentCaseStatus(failingRunner, {
        incidentCaseId: caseId,
        expectedStatus: 'OPEN',
        expectedVersion: 1,
        newStatus: 'TRIAGED',
        actorUserId: actorId,
        historyIdempotencyKey: `atomic-transition-${unique()}`,
      }),
    ).rejects.toThrow('C2_S6_INJECTED_HISTORY_FAILURE');
    expect(await prisma.incidentCase.findUnique({ where: { id: caseId } })).toBeNull();
  });

  it('records initial assignment and reassignment as non-status history', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'assigner');
      const first = await createUser(tx, 'first-assignee');
      const second = await createUser(tx, 'second-assignee');
      const incidentCase = await seedCase(tx, 'INVESTIGATING', actor.id);

      const assigned = await assignIncidentCase(tx, {
        incidentCaseId: incidentCase.id,
        assigneeUserId: first.id,
        actorUserId: actor.id,
        expectedVersion: 1,
        historyIdempotencyKey: `assigned-${unique()}`,
      });
      expect(assigned.incidentCase.status).toBe('INVESTIGATING');
      expect(assigned.history).toMatchObject({
        reason: 'ASSIGNED',
        previous_status: 'INVESTIGATING',
        new_status: 'INVESTIGATING',
        actor_user_id: actor.id,
        assigned_to_user_id: first.id,
      });

      const reassigned = await assignIncidentCase(tx, {
        incidentCaseId: incidentCase.id,
        assigneeUserId: second.id,
        actorUserId: actor.id,
        expectedVersion: 2,
        historyIdempotencyKey: `reassigned-${unique()}`,
      });
      expect(reassigned.incidentCase.status).toBe('INVESTIGATING');
      expect(reassigned.incidentCase.assigned_user_id).toBe(second.id);
      expect(reassigned.history.reason).toBe('REASSIGNED');
      expect(reassigned.history.previous_status).toBe(
        reassigned.history.new_status,
      );
    });
  });

  it('rejects same or nonexistent assignees without partial assignment', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'assignment-rejection');
      const assignee = await createUser(tx, 'existing-assignee');
      const incidentCase = await seedCase(tx, 'TRIAGED', actor.id);
      const assigned = await assignIncidentCase(tx, {
        incidentCaseId: incidentCase.id,
        assigneeUserId: assignee.id,
        actorUserId: actor.id,
        expectedVersion: 1,
        historyIdempotencyKey: `assign-once-${unique()}`,
      });

      await expect(
        assignIncidentCase(tx, {
          incidentCaseId: incidentCase.id,
          assigneeUserId: assignee.id,
          actorUserId: actor.id,
          expectedVersion: assigned.incidentCase.version,
          historyIdempotencyKey: `same-${unique()}`,
        }),
      ).rejects.toThrow('SAME_ASSIGNEE_REJECTED');
      await expect(
        assignIncidentCase(tx, {
          incidentCaseId: incidentCase.id,
          assigneeUserId: `missing-user-${unique()}`,
          actorUserId: actor.id,
          expectedVersion: assigned.incidentCase.version,
          historyIdempotencyKey: `missing-${unique()}`,
        }),
      ).rejects.toThrow('ASSIGNEE_NOT_FOUND');
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: incidentCase.id },
        }),
      ).toBe(1);
    });
  });

  it('rolls back assignment when assignment history insertion fails', async () => {
    const actorId = `c2-s6-assign-actor-${unique()}`;
    const assigneeId = `c2-s6-assignee-${unique()}`;
    const caseId = `c2-s6-assignment-case-${unique()}`;
    const failingRunner: IncidentCaseDatabase = {
      $transaction: async (operation) =>
        prisma.$transaction(async (tx) => {
          await createUser(tx, 'atomic-assignment-actor', actorId);
          await createUser(tx, 'atomic-assignment-target', assigneeId);
          await seedCase(tx, 'TRIAGED', actorId, caseId);
          return operation(historyFailureProxy(tx));
        }),
    };

    await expect(
      assignIncidentCase(failingRunner, {
        incidentCaseId: caseId,
        assigneeUserId: assigneeId,
        actorUserId: actorId,
        expectedVersion: 1,
        historyIdempotencyKey: `atomic-assignment-${unique()}`,
      }),
    ).rejects.toThrow('C2_S6_INJECTED_HISTORY_FAILURE');
    expect(await prisma.incidentCase.findUnique({ where: { id: caseId } })).toBeNull();
  });

  it('appends approved notes without changing root lifecycle or assignment', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'note');
      const assignee = await createUser(tx, 'note-assignee');
      const incidentCase = await seedCase(tx, 'TRIAGED', actor.id);
      await tx.incidentCase.update({
        where: { id: incidentCase.id },
        data: { assigned_user_id: assignee.id },
      });
      const before = await tx.incidentCase.findUniqueOrThrow({
        where: { id: incidentCase.id },
      });
      const note = await addIncidentCaseNote(tx, {
        incidentCaseId: incidentCase.id,
        noteType: 'INVESTIGATION',
        content: 'Bounded investigation observation.',
        actorUserId: actor.id,
        idempotencyKey: `note-${unique()}`,
      });
      const after = await tx.incidentCase.findUniqueOrThrow({
        where: { id: incidentCase.id },
      });

      expect(note.actor_user_id).toBe(actor.id);
      expect(note.content_hash).toMatch(/^[0-9a-f]{64}$/);
      expect(after).toEqual(before);
      await expect(
        addIncidentCaseNote(tx, {
          incidentCaseId: `missing-case-${unique()}`,
          noteType: 'INTERNAL',
          content: 'Bounded internal observation.',
          actorUserId: actor.id,
          idempotencyKey: `missing-note-${unique()}`,
        }),
      ).rejects.toThrow('CASE_NOT_FOUND');
      await expect(
        addIncidentCaseNote(tx, {
          incidentCaseId: incidentCase.id,
          noteType: 'INTERNAL',
          content: 'Password fields must not be stored.',
          actorUserId: actor.id,
          idempotencyKey: `private-note-${unique()}`,
        }),
      ).rejects.toThrow('PRIVACY_REJECTED');
      await expect(
        addIncidentCaseNote(tx, {
          incidentCaseId: incidentCase.id,
          noteType: 'UNAPPROVED' as never,
          content: 'Bounded invalid-type observation.',
          actorUserId: actor.id,
          idempotencyKey: `invalid-note-type-${unique()}`,
        }),
      ).rejects.toThrow('INVALID_NOTE_TYPE');
    });
  });

  it('appends supported evidence without changing root lifecycle or assignment', async () => {
    await withRollback(async (tx) => {
      const actor = await createUser(tx, 'evidence');
      const incidentCase = await seedCase(tx, 'CONTAINMENT_PENDING', actor.id);
      const before = await tx.incidentCase.findUniqueOrThrow({
        where: { id: incidentCase.id },
      });
      const evidence = await addIncidentCaseEvidence(tx, {
        incidentCaseId: incidentCase.id,
        evidenceType: 'SYSTEM_LOG',
        source: 'INTERNAL_SYSTEM',
        referenceKey: `system-log:${unique()}`,
        integrityHash: 'a'.repeat(64),
        actorUserId: actor.id,
        collectedAt: new Date(),
        contentType: 'application/json',
        sizeBytes: 128,
        idempotencyKey: `evidence-${unique()}`,
      });
      const after = await tx.incidentCase.findUniqueOrThrow({
        where: { id: incidentCase.id },
      });

      expect(evidence.added_by_user_id).toBe(actor.id);
      expect(after).toEqual(before);
      await expect(
        addIncidentCaseEvidence(tx, {
          incidentCaseId: `missing-case-${unique()}`,
          evidenceType: 'SYSTEM_LOG',
          source: 'INTERNAL_SYSTEM',
          referenceKey: `system-log:${unique()}`,
          integrityHash: 'b'.repeat(64),
          actorUserId: actor.id,
          collectedAt: new Date(),
          idempotencyKey: `missing-evidence-${unique()}`,
        }),
      ).rejects.toThrow('CASE_NOT_FOUND');
      await expect(
        addIncidentCaseEvidence(tx, {
          incidentCaseId: incidentCase.id,
          evidenceType: 'SYSTEM_LOG',
          source: 'INTERNAL_SYSTEM',
          referenceKey: 'https://example.test/raw',
          integrityHash: 'c'.repeat(64),
          actorUserId: actor.id,
          collectedAt: new Date(),
          idempotencyKey: `unsupported-evidence-${unique()}`,
        }),
      ).rejects.toThrow('UNSUPPORTED_EVIDENCE_REFERENCE');
      await expect(
        addIncidentCaseEvidence(tx, {
          incidentCaseId: incidentCase.id,
          evidenceType: 'UNAPPROVED' as never,
          source: 'INTERNAL_SYSTEM',
          referenceKey: `other:${unique()}`,
          integrityHash: 'e'.repeat(64),
          actorUserId: actor.id,
          collectedAt: new Date(),
          idempotencyKey: `invalid-evidence-type-${unique()}`,
        }),
      ).rejects.toThrow('INVALID_EVIDENCE_TYPE');
      await expect(
        addIncidentCaseEvidence(tx, {
          incidentCaseId: incidentCase.id,
          evidenceType: 'OTHER',
          source: 'UNAPPROVED' as never,
          referenceKey: `other:${unique()}`,
          integrityHash: 'f'.repeat(64),
          actorUserId: actor.id,
          collectedAt: new Date(),
          idempotencyKey: `invalid-evidence-source-${unique()}`,
        }),
      ).rejects.toThrow('INVALID_EVIDENCE_SOURCE');
    });
  });

  it('keeps history, notes, and evidence append-only for update and delete', async () => {
    const assertMutationRejected = async (
      table: 'history' | 'note' | 'evidence',
      operation: 'update' | 'delete',
    ) => {
      await expect(
        withRollback(async (tx) => {
          const actor = await createUser(tx, `${table}-${operation}`);
          const incidentCase = await seedCase(tx, 'OPEN', actor.id);
          if (table === 'history') {
            const row = await tx.incidentCaseHistory.create({
              data: {
                incident_case_id: incidentCase.id,
                previous_status: null,
                new_status: 'OPEN',
                reason: 'CREATED',
                actor_user_id: actor.id,
                occurred_at: new Date(),
                idempotency_key: `history-${unique()}`,
              },
            });
            if (operation === 'update') {
              await tx.incidentCaseHistory.update({
                where: { id: row.id },
                data: { reason_note: 'Rejected mutation' },
              });
            } else {
              await tx.incidentCaseHistory.delete({ where: { id: row.id } });
            }
          } else if (table === 'note') {
            const row = await addIncidentCaseNote(tx, {
              incidentCaseId: incidentCase.id,
              noteType: 'INTERNAL',
              content: 'Append-only note.',
              actorUserId: actor.id,
              idempotencyKey: `note-${unique()}`,
            });
            if (operation === 'update') {
              await tx.incidentCaseNote.update({
                where: { id: row.id },
                data: { content: 'Rejected mutation' },
              });
            } else {
              await tx.incidentCaseNote.delete({ where: { id: row.id } });
            }
          } else {
            const row = await addIncidentCaseEvidence(tx, {
              incidentCaseId: incidentCase.id,
              evidenceType: 'DOCUMENT_REFERENCE',
              source: 'ADMINISTRATIVE',
              referenceKey: `document:${unique()}`,
              integrityHash: 'd'.repeat(64),
              actorUserId: actor.id,
              collectedAt: new Date(),
              idempotencyKey: `evidence-${unique()}`,
            });
            if (operation === 'update') {
              await tx.incidentCaseEvidence.update({
                where: { id: row.id },
                data: { reference_key: `document:${unique()}` },
              });
            } else {
              await tx.incidentCaseEvidence.delete({ where: { id: row.id } });
            }
          }
        }),
      ).rejects.toThrow();
    };

    for (const table of ['history', 'note', 'evidence'] as const) {
      await assertMutationRejected(table, 'update');
      await assertMutationRejected(table, 'delete');
    }
  });

  it('leaves no persistent case-writer or unrelated audit records', async () => {
    expect(await readCounts()).toEqual(baselineCounts);
  });
});
