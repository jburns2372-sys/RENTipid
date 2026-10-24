import { IncidentCaseStatus, Prisma, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';
import {
  addIncidentCaseEvidence,
  addIncidentCaseNote,
  assignIncidentCase,
  createIncidentCase,
  requireIncidentCasePermission,
  transitionIncidentCaseStatus,
} from '../../../src/lib/security/cases/incident-case-writers.service';
import {
  SECURITY_PERMISSIONS,
  SOC_ANALYST_CASE_PERMISSIONS,
  SOC_SUPERVISOR_CASE_PERMISSIONS,
} from '../../../src/lib/security/permissions';

const prisma = new PrismaClient();
class IntentionalRollback extends Error {}

describe('Gate 4F Slice C3: SOC Incident-Case RBAC Foundation', () => {
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

  const user = (tx: Prisma.TransactionClient, role: string, label: string) =>
    tx.user.create({
      data: {
        email: `c3-${label}-${unique()}@example.test`,
        full_name: `C3 ${label}`,
        account_type: 'Individual',
        role,
        status: 'Verified',
        is_test_data: true,
      },
    });

  const timestamps = (status: IncidentCaseStatus) => ({
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

  const incidentCase = (
    tx: Prisma.TransactionClient,
    status: IncidentCaseStatus,
    actorUserId: string,
    assignedUserId?: string,
  ) =>
    tx.incidentCase.create({
      data: {
        case_reference: reference(),
        status,
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: `C3 ${status} case`,
        created_by_user_id: actorUserId,
        assigned_user_id: assignedUserId,
        ...timestamps(status),
      },
    });

  const createInput = (actorUserId: string) => ({
    severity: 'MEDIUM' as const,
    origin: 'MANUAL' as const,
    title: 'C3 authorized case',
    actorUserId,
    historyIdempotencyKey: `create-${unique()}`,
  });

  const transitionInput = (
    caseId: string,
    actorUserId: string,
    from: IncidentCaseStatus,
    to: IncidentCaseStatus,
  ) => ({
    incidentCaseId: caseId,
    expectedStatus: from,
    expectedVersion: 1,
    newStatus: to,
    actorUserId,
    historyIdempotencyKey: `transition-${unique()}`,
  });

  const expectDenied = async (operation: Promise<unknown>) => {
    await expect(operation).rejects.toThrow('INCIDENT_CASE_PERMISSION_DENIED');
  };

  beforeAll(() => assertSafeLocalTestDatabaseTarget());
  afterAll(async () => prisma.$disconnect());

  it('1. SOC_ANALYST can view cases', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'view');
      const context = await requireIncidentCasePermission(
        tx,
        analyst.id,
        SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW,
      );
      expect(context.role).toBe('SOC_ANALYST');
    });
  });

  it('2. SOC_ANALYST can create a case', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'create');
      const result = await createIncidentCase(tx, createInput(analyst.id));
      expect(result.incidentCase.status).toBe('OPEN');
      expect(result.history.reason).toBe('CREATED');
    });
  });

  it('3. SOC_ANALYST can triage a case', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'triage');
      const row = await incidentCase(tx, 'OPEN', analyst.id);
      const result = await transitionIncidentCaseStatus(
        tx,
        transitionInput(row.id, analyst.id, 'OPEN', 'TRIAGED'),
      );
      expect(result.incidentCase.status).toBe('TRIAGED');
    });
  });

  it('4. SOC_ANALYST can start investigation', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'investigate');
      const row = await incidentCase(tx, 'TRIAGED', analyst.id);
      const result = await transitionIncidentCaseStatus(
        tx,
        transitionInput(row.id, analyst.id, 'TRIAGED', 'INVESTIGATING'),
      );
      expect(result.history.reason).toBe('INVESTIGATION_STARTED');
    });
  });

  it('5. SOC_ANALYST can add notes', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'note');
      const row = await incidentCase(tx, 'INVESTIGATING', analyst.id);
      const note = await addIncidentCaseNote(tx, {
        incidentCaseId: row.id,
        noteType: 'INVESTIGATION',
        content: 'Bounded analyst observation.',
        actorUserId: analyst.id,
        idempotencyKey: `note-${unique()}`,
      });
      expect(note.actor_user_id).toBe(analyst.id);
    });
  });

  it('6. SOC_ANALYST can add evidence', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'evidence');
      const row = await incidentCase(tx, 'INVESTIGATING', analyst.id);
      const evidence = await addIncidentCaseEvidence(tx, {
        incidentCaseId: row.id,
        evidenceType: 'SYSTEM_LOG',
        source: 'INTERNAL_SYSTEM',
        referenceKey: `system-log:${unique()}`,
        integrityHash: 'a'.repeat(64),
        actorUserId: analyst.id,
        collectedAt: new Date(),
        idempotencyKey: `evidence-${unique()}`,
      });
      expect(evidence.added_by_user_id).toBe(analyst.id);
    });
  });

  it('7. SOC_ANALYST cannot assign', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'assign-denied');
      const target = await user(tx, 'SOC_ANALYST', 'assign-target');
      const row = await incidentCase(tx, 'TRIAGED', analyst.id);
      await expectDenied(
        assignIncidentCase(tx, {
          incidentCaseId: row.id,
          assigneeUserId: target.id,
          actorUserId: analyst.id,
          expectedVersion: 1,
          historyIdempotencyKey: `assign-${unique()}`,
        }),
      );
    });
  });

  it('8. SOC_ANALYST cannot reassign', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'reassign-denied');
      const first = await user(tx, 'SOC_ANALYST', 'first');
      const second = await user(tx, 'SOC_ANALYST', 'second');
      const row = await incidentCase(tx, 'TRIAGED', analyst.id, first.id);
      await expectDenied(
        assignIncidentCase(tx, {
          incidentCaseId: row.id,
          assigneeUserId: second.id,
          actorUserId: analyst.id,
          expectedVersion: 1,
          historyIdempotencyKey: `reassign-${unique()}`,
        }),
      );
    });
  });

  const analystDeniedTransition = async (
    from: IncidentCaseStatus,
    to: IncidentCaseStatus,
    label: string,
  ) =>
    withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', label);
      const row = await incidentCase(tx, from, analyst.id);
      await expectDenied(
        transitionIncidentCaseStatus(
          tx,
          transitionInput(row.id, analyst.id, from, to),
        ),
      );
    });

  it('9. SOC_ANALYST cannot request containment', () =>
    analystDeniedTransition('TRIAGED', 'CONTAINMENT_PENDING', 'containment'));
  it('10. SOC_ANALYST cannot resolve', () =>
    analystDeniedTransition('INVESTIGATING', 'RESOLVED', 'resolve'));
  it('11. SOC_ANALYST cannot close', () =>
    analystDeniedTransition('RESOLVED', 'CLOSED', 'close'));
  it('12. SOC_ANALYST cannot reopen', () =>
    analystDeniedTransition('RESOLVED', 'REOPENED', 'reopen'));

  it('13. SOC_ANALYST cannot escalate', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'escalate');
      await expectDenied(
        requireIncidentCasePermission(
          tx,
          analyst.id,
          SECURITY_PERMISSIONS.INCIDENT_CASE_ESCALATE,
        ),
      );
    });
  });

  it('14. SOC_SUPERVISOR has every analyst permission', async () => {
    await withRollback(async (tx) => {
      const supervisor = await user(tx, 'SOC_SUPERVISOR', 'analyst-matrix');
      for (const permission of SOC_ANALYST_CASE_PERMISSIONS) {
        await expect(
          requireIncidentCasePermission(tx, supervisor.id, permission),
        ).resolves.toMatchObject({ role: 'SOC_SUPERVISOR', permission });
      }
    });
  });

  it('15. SOC_SUPERVISOR can assign and reassign', async () => {
    await withRollback(async (tx) => {
      const supervisor = await user(tx, 'SOC_SUPERVISOR', 'assignment');
      const first = await user(tx, 'SOC_ANALYST', 'assigned-first');
      const second = await user(tx, 'SOC_ANALYST', 'assigned-second');
      const row = await incidentCase(tx, 'TRIAGED', supervisor.id);
      const assigned = await assignIncidentCase(tx, {
        incidentCaseId: row.id,
        assigneeUserId: first.id,
        actorUserId: supervisor.id,
        expectedVersion: 1,
        historyIdempotencyKey: `assigned-${unique()}`,
      });
      const reassigned = await assignIncidentCase(tx, {
        incidentCaseId: row.id,
        assigneeUserId: second.id,
        actorUserId: supervisor.id,
        expectedVersion: 2,
        historyIdempotencyKey: `reassigned-${unique()}`,
      });
      expect(assigned.history.reason).toBe('ASSIGNED');
      expect(reassigned.history.reason).toBe('REASSIGNED');
    });
  });

  const supervisorTransition = async (
    from: IncidentCaseStatus,
    to: IncidentCaseStatus,
    label: string,
  ) =>
    withRollback(async (tx) => {
      const supervisor = await user(tx, 'SOC_SUPERVISOR', label);
      const row = await incidentCase(tx, from, supervisor.id);
      const result = await transitionIncidentCaseStatus(
        tx,
        transitionInput(row.id, supervisor.id, from, to),
      );
      expect(result.incidentCase.status).toBe(to);
    });

  it('16. SOC_SUPERVISOR can request containment', () =>
    supervisorTransition('TRIAGED', 'CONTAINMENT_PENDING', 'containment'));
  it('17. SOC_SUPERVISOR can resolve', () =>
    supervisorTransition('INVESTIGATING', 'RESOLVED', 'resolve'));
  it('18. SOC_SUPERVISOR can close', () =>
    supervisorTransition('RESOLVED', 'CLOSED', 'close'));
  it('19. SOC_SUPERVISOR can reopen', () =>
    supervisorTransition('RESOLVED', 'REOPENED', 'reopen'));

  it('20. SOC_SUPERVISOR can escalate', async () => {
    await withRollback(async (tx) => {
      const supervisor = await user(tx, 'SOC_SUPERVISOR', 'escalate');
      await expect(
        requireIncidentCasePermission(
          tx,
          supervisor.id,
          SECURITY_PERMISSIONS.INCIDENT_CASE_ESCALATE,
        ),
      ).resolves.toMatchObject({ role: 'SOC_SUPERVISOR' });
    });
  });

  const expectRoleDeniedAll = (role: string, label: string) =>
    withRollback(async (tx) => {
      const actor = await user(tx, role, label);
      for (const permission of SOC_SUPERVISOR_CASE_PERMISSIONS) {
        await expectDenied(
          requireIncidentCasePermission(tx, actor.id, permission),
        );
      }
    });

  it('21. Ordinary renter is denied every case permission', () =>
    expectRoleDeniedAll('Renter', 'renter'));
  it('22. Ordinary provider is denied every case permission', () =>
    expectRoleDeniedAll('Individual Provider', 'provider'));
  it('23. Finance-only role is denied every case permission', () =>
    expectRoleDeniedAll('Finance Admin', 'finance'));

  it('24. Denied creation creates no case or history', async () => {
    await withRollback(async (tx) => {
      const renter = await user(tx, 'Renter', 'denied-create');
      const beforeCases = await tx.incidentCase.count();
      const beforeHistory = await tx.incidentCaseHistory.count();
      await expectDenied(createIncidentCase(tx, createInput(renter.id)));
      expect(await tx.incidentCase.count()).toBe(beforeCases);
      expect(await tx.incidentCaseHistory.count()).toBe(beforeHistory);
    });
  });

  it('25. Denied transition changes neither root nor history', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'denied-transition');
      const row = await incidentCase(tx, 'INVESTIGATING', analyst.id);
      const beforeHistory = await tx.incidentCaseHistory.count({
        where: { incident_case_id: row.id },
      });
      await expectDenied(
        transitionIncidentCaseStatus(
          tx,
          transitionInput(row.id, analyst.id, 'INVESTIGATING', 'RESOLVED'),
        ),
      );
      expect(await tx.incidentCase.findUnique({ where: { id: row.id } })).toMatchObject({
        status: 'INVESTIGATING',
        version: 1,
      });
      expect(
        await tx.incidentCaseHistory.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(beforeHistory);
    });
  });

  it('26. Denied note append creates no note', async () => {
    await withRollback(async (tx) => {
      const renter = await user(tx, 'Renter', 'denied-note');
      const row = await incidentCase(tx, 'OPEN', renter.id);
      await expectDenied(
        addIncidentCaseNote(tx, {
          incidentCaseId: row.id,
          noteType: 'INTERNAL',
          content: 'Denied bounded note.',
          actorUserId: renter.id,
          idempotencyKey: `denied-note-${unique()}`,
        }),
      );
      expect(
        await tx.incidentCaseNote.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(0);
    });
  });

  it('27. Denied evidence append creates no evidence', async () => {
    await withRollback(async (tx) => {
      const provider = await user(tx, 'Business Provider', 'denied-evidence');
      const row = await incidentCase(tx, 'OPEN', provider.id);
      await expectDenied(
        addIncidentCaseEvidence(tx, {
          incidentCaseId: row.id,
          evidenceType: 'SYSTEM_LOG',
          source: 'INTERNAL_SYSTEM',
          referenceKey: `system-log:${unique()}`,
          integrityHash: 'b'.repeat(64),
          actorUserId: provider.id,
          collectedAt: new Date(),
          idempotencyKey: `denied-evidence-${unique()}`,
        }),
      );
      expect(
        await tx.incidentCaseEvidence.count({
          where: { incident_case_id: row.id },
        }),
      ).toBe(0);
    });
  });

  it('28. Caller-supplied fake role cannot bypass database role', async () => {
    await withRollback(async (tx) => {
      const renter = await user(tx, 'Renter', 'fake-role');
      const untrustedInput = {
        ...createInput(renter.id),
        role: 'SOC_SUPERVISOR',
      };
      await expectDenied(createIncidentCase(tx, untrustedInput));
      const denial = await tx.auditLog.findFirstOrThrow({
        where: {
          actor_user_id: renter.id,
          action: 'SOC_INCIDENT_CASE_AUTHORIZATION_DENIED',
        },
      });
      expect(denial.details).toContain('security.incident_cases.create');
    });
  });

  it('29. Existing Super Admin retains every case permission', async () => {
    await withRollback(async (tx) => {
      const superAdmin = await user(tx, 'Super Admin', 'super-admin');
      for (const permission of SOC_SUPERVISOR_CASE_PERMISSIONS) {
        await expect(
          requireIncidentCasePermission(tx, superAdmin.id, permission),
        ).resolves.toMatchObject({ role: 'Super Admin', permission });
      }
      await expect(
        createIncidentCase(tx, createInput(superAdmin.id)),
      ).resolves.toHaveProperty('incidentCase.status', 'OPEN');
    });
  });

  it('30. Authorization audits omit credentials and private content', async () => {
    await withRollback(async (tx) => {
      const analyst = await user(tx, 'SOC_ANALYST', 'audit');
      const row = await incidentCase(tx, 'INVESTIGATING', analyst.id);
      const noteContent = 'Private bounded investigation observation.';
      await addIncidentCaseNote(tx, {
        incidentCaseId: row.id,
        noteType: 'INVESTIGATION',
        content: noteContent,
        actorUserId: analyst.id,
        idempotencyKey: `audit-note-${unique()}`,
      });
      await expectDenied(
        requireIncidentCasePermission(
          tx,
          analyst.id,
          SECURITY_PERMISSIONS.INCIDENT_CASE_CLOSE,
        ),
      );
      const audits = await tx.auditLog.findMany({
        where: { actor_user_id: analyst.id },
      });
      const serialized = JSON.stringify(audits);
      expect(serialized).not.toContain(noteContent);
      expect(serialized).not.toMatch(
        /password|access_token|database_url|connection_string|raw_session/i,
      );
      expect(audits.map(({ action }) => action)).toEqual(
        expect.arrayContaining([
          'SOC_INCIDENT_CASE_NOTE_APPENDED',
          'SOC_INCIDENT_CASE_AUTHORIZATION_DENIED',
        ]),
      );
    });
  });
});
