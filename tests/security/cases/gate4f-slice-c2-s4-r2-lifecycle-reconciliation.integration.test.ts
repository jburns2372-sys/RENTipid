import { Prisma, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';

const prisma = new PrismaClient();

class IntentionalRollback extends Error {}

type ConstraintMetadata = {
  conname: string;
  definition: string;
};

type TriggerMetadata = {
  table_name: string;
  trigger_name: string;
};

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

describe('Gate 4F Slice C2-S4-R2: Incident Case Lifecycle Reconciliation', () => {
  let baselineCounts: TableCounts;

  const uniqueSuffix = () => `${Date.now()}-${randomBytes(4).toString('hex')}`;

  const caseReference = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INC-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
  };

  const withRollback = async (work: (tx: Prisma.TransactionClient) => Promise<void>) => {
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

  const createCase = (
    tx: Prisma.TransactionClient,
    data: Partial<Prisma.IncidentCaseUncheckedCreateInput> = {},
  ) =>
    tx.incidentCase.create({
      data: {
        case_reference: caseReference(),
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: `C2-S4-R2 lifecycle ${uniqueSuffix()}`,
        opened_at: new Date('2026-07-24T01:00:00.000Z'),
        ...data,
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

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    baselineCounts = await readCounts();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('uses only the guarded local test database and restricted test role', async () => {
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

  it('installs exactly the approved reopened timestamp constraints', async () => {
    const constraints = await prisma.$queryRaw<ConstraintMetadata[]>`
      SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = '"IncidentCase"'::regclass
        AND conname IN (
          'chk_incidentcase_reopened_at_req',
          'chk_incidentcase_reopened_at'
        )
      ORDER BY conname
    `;

    const normalized = Object.fromEntries(
      constraints.map(({ conname, definition }) => [
        conname,
        definition.replace(/["()\s]/g, '').toLowerCase(),
      ]),
    );

    expect(normalized).toEqual({
      chk_incidentcase_reopened_at:
        'checkreopened_atisnullorclosed_atisnotnullandreopened_at>=closed_atorclosed_atisnullandresolved_atisnotnullandreopened_at>=resolved_at',
      chk_incidentcase_reopened_at_req:
        'checkreopened_atisnullorresolved_atisnotnull',
    });
  });

  it('keeps every existing IncidentCase row valid without a backfill', async () => {
    const [violations] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "IncidentCase"
      WHERE
        ("reopened_at" IS NOT NULL AND "resolved_at" IS NULL)
        OR (
          "reopened_at" IS NOT NULL
          AND "closed_at" IS NOT NULL
          AND "reopened_at" < "closed_at"
        )
        OR (
          "reopened_at" IS NOT NULL
          AND "closed_at" IS NULL
          AND "reopened_at" < "resolved_at"
        )
    `;

    expect(violations.count.toString()).toBe('0');
  });

  it('accepts RESOLVED to REOPENED without fabricating a CLOSED timestamp', async () => {
    await withRollback(async (tx) => {
      const resolvedAt = new Date('2026-07-24T02:00:00.000Z');
      const reopenedAt = new Date('2026-07-24T03:00:00.000Z');
      const incidentCase = await createCase(tx, {
        status: 'RESOLVED',
        resolved_at: resolvedAt,
      });

      const reopened = await tx.incidentCase.update({
        where: { id: incidentCase.id },
        data: {
          status: 'REOPENED',
          reopened_at: reopenedAt,
          version: { increment: 1 },
        },
      });

      expect(reopened.status).toBe('REOPENED');
      expect(reopened.resolved_at).toEqual(resolvedAt);
      expect(reopened.closed_at).toBeNull();
      expect(reopened.reopened_at).toEqual(reopenedAt);
      expect(reopened.version).toBe(2);
    });
  });

  it('rejects RESOLVED to REOPENED when reopened_at precedes resolved_at', async () => {
    await expect(
      withRollback(async (tx) => {
        const incidentCase = await createCase(tx, {
          status: 'RESOLVED',
          resolved_at: new Date('2026-07-24T03:00:00.000Z'),
        });

        await tx.incidentCase.update({
          where: { id: incidentCase.id },
          data: {
            status: 'REOPENED',
            reopened_at: new Date('2026-07-24T02:00:00.000Z'),
          },
        });
      }),
    ).rejects.toThrow();
  });

  it('preserves CLOSED to REOPENED chronology enforcement', async () => {
    await withRollback(async (tx) => {
      const incidentCase = await createCase(tx, {
        status: 'CLOSED',
        resolved_at: new Date('2026-07-24T02:00:00.000Z'),
        closed_at: new Date('2026-07-24T03:00:00.000Z'),
      });

      const reopened = await tx.incidentCase.update({
        where: { id: incidentCase.id },
        data: {
          status: 'REOPENED',
          reopened_at: new Date('2026-07-24T04:00:00.000Z'),
        },
      });

      expect(reopened.status).toBe('REOPENED');
      expect(reopened.reopened_at).toEqual(new Date('2026-07-24T04:00:00.000Z'));
    });

    await expect(
      withRollback(async (tx) => {
        const incidentCase = await createCase(tx, {
          status: 'CLOSED',
          resolved_at: new Date('2026-07-24T02:00:00.000Z'),
          closed_at: new Date('2026-07-24T04:00:00.000Z'),
        });

        await tx.incidentCase.update({
          where: { id: incidentCase.id },
          data: {
            status: 'REOPENED',
            reopened_at: new Date('2026-07-24T03:00:00.000Z'),
          },
        });
      }),
    ).rejects.toThrow();
  });

  it('still rejects REOPENED without reopened_at', async () => {
    await expect(
      withRollback(async (tx) => {
        const incidentCase = await createCase(tx, {
          status: 'RESOLVED',
          resolved_at: new Date('2026-07-24T02:00:00.000Z'),
        });

        await tx.incidentCase.update({
          where: { id: incidentCase.id },
          data: { status: 'REOPENED' },
        });
      }),
    ).rejects.toThrow();
  });

  it('keeps the IncidentCase root mutable and forensic child tables append-only', async () => {
    const triggers = await prisma.$queryRaw<TriggerMetadata[]>`
      SELECT DISTINCT event_object_table AS table_name, trigger_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND event_object_table IN (
          'IncidentCase',
          'IncidentCaseHistory',
          'IncidentCaseNote',
          'IncidentCaseEvidence'
        )
      ORDER BY event_object_table, trigger_name
    `;

    expect(triggers).toEqual([
      {
        table_name: 'IncidentCaseEvidence',
        trigger_name: 'trigger_prevent_update_delete_evidence',
      },
      {
        table_name: 'IncidentCaseHistory',
        trigger_name: 'trigger_prevent_update_delete_history',
      },
      {
        table_name: 'IncidentCaseHistory',
        trigger_name: 'trigger_require_incident_case_assignment_target',
      },
      {
        table_name: 'IncidentCaseNote',
        trigger_name: 'trigger_prevent_update_delete_note',
      },
    ]);
    expect(triggers.filter(({ table_name }) => table_name === 'IncidentCase')).toHaveLength(0);

    await withRollback(async (tx) => {
      const incidentCase = await createCase(tx);
      const updated = await tx.incidentCase.update({
        where: { id: incidentCase.id },
        data: {
          title: 'Mutable lifecycle root',
          version: { increment: 1 },
        },
      });
      expect(updated.version).toBe(2);
    });

    const assertHistoryMutationRejected = async (operation: 'update' | 'delete') => {
      await expect(
        withRollback(async (tx) => {
          const incidentCase = await createCase(tx);
          const history = await tx.incidentCaseHistory.create({
            data: {
              incident_case_id: incidentCase.id,
              previous_status: null,
              new_status: 'OPEN',
              reason: 'CREATED',
              occurred_at: new Date(),
              idempotency_key: `history-${uniqueSuffix()}`,
            },
          });
          if (operation === 'update') {
            await tx.incidentCaseHistory.update({
              where: { id: history.id },
              data: { reason_note: 'Forbidden mutation' },
            });
          } else {
            await tx.incidentCaseHistory.delete({ where: { id: history.id } });
          }
        }),
      ).rejects.toThrow();
    };

    const assertNoteMutationRejected = async (operation: 'update' | 'delete') => {
      await expect(
        withRollback(async (tx) => {
          const incidentCase = await createCase(tx);
          const note = await tx.incidentCaseNote.create({
            data: {
              incident_case_id: incidentCase.id,
              note_type: 'INTERNAL',
              content: 'Bounded lifecycle reconciliation note',
              content_hash: 'a'.repeat(64),
              idempotency_key: `note-${uniqueSuffix()}`,
            },
          });
          if (operation === 'update') {
            await tx.incidentCaseNote.update({
              where: { id: note.id },
              data: { content: 'Forbidden mutation' },
            });
          } else {
            await tx.incidentCaseNote.delete({ where: { id: note.id } });
          }
        }),
      ).rejects.toThrow();
    };

    const assertEvidenceMutationRejected = async (operation: 'update' | 'delete') => {
      await expect(
        withRollback(async (tx) => {
          const incidentCase = await createCase(tx);
          const evidence = await tx.incidentCaseEvidence.create({
            data: {
              incident_case_id: incidentCase.id,
              evidence_type: 'DOCUMENT_REFERENCE',
              source_classification: 'INTERNAL_SYSTEM',
              collected_at: new Date(),
              reference_key: `case-reference:${incidentCase.case_reference}`,
              integrity_hash: 'b'.repeat(64),
              idempotency_key: `evidence-${uniqueSuffix()}`,
            },
          });
          if (operation === 'update') {
            await tx.incidentCaseEvidence.update({
              where: { id: evidence.id },
              data: { reference_key: 'forbidden-mutation' },
            });
          } else {
            await tx.incidentCaseEvidence.delete({ where: { id: evidence.id } });
          }
        }),
      ).rejects.toThrow();
    };

    await assertHistoryMutationRejected('update');
    await assertHistoryMutationRejected('delete');
    await assertNoteMutationRejected('update');
    await assertNoteMutationRejected('delete');
    await assertEvidenceMutationRejected('update');
    await assertEvidenceMutationRejected('delete');
  });

  it('preserves optional, validated, non-mutating SecurityEvent linkage', async () => {
    await withRollback(async (tx) => {
      const event = await tx.securityEvent.create({
        data: {
          event_code: 'GATE4F_C2_S4_R2_RECONCILIATION',
          source_type: 'AUDIT_LOG',
          source_record_id: `c2-s4-r2-${uniqueSuffix()}`,
          security_domain: 'IDENTITY_AND_ACCESS',
          event_category: 'lifecycle_contract',
          event_classification: 'OBSERVATION',
          severity: 'LOW',
          environment: 'TEST',
          lifecycle_type: 'TEST',
          idempotency_key: `c2-s4-r2-event-${uniqueSuffix()}`,
          occurred_at: new Date(),
          source_received_at: new Date(),
        },
      });
      const eventBefore = await tx.securityEvent.findUniqueOrThrow({ where: { id: event.id } });

      const unlinked = await createCase(tx);
      const linked = await createCase(tx, {
        origin: 'SECURITY_EVENT',
        originating_security_event_id: event.id,
      });
      const eventAfter = await tx.securityEvent.findUniqueOrThrow({ where: { id: event.id } });

      expect(unlinked.originating_security_event_id).toBeNull();
      expect(linked.originating_security_event_id).toBe(event.id);
      expect(eventAfter).toEqual(eventBefore);
    });

    await expect(
      withRollback(async (tx) => {
        await createCase(tx, {
          origin: 'SECURITY_EVENT',
          originating_security_event_id: 'nonexistent-security-event',
        });
      }),
    ).rejects.toThrow();

    await expect(
      withRollback(async (tx) => {
        const event = await tx.securityEvent.create({
          data: {
            event_code: 'GATE4F_C2_S4_R2_RESTRICT',
            source_type: 'AUDIT_LOG',
            source_record_id: `c2-s4-r2-restrict-${uniqueSuffix()}`,
            security_domain: 'IDENTITY_AND_ACCESS',
            event_category: 'lifecycle_contract',
            event_classification: 'OBSERVATION',
            severity: 'LOW',
            environment: 'TEST',
            lifecycle_type: 'TEST',
            idempotency_key: `c2-s4-r2-restrict-event-${uniqueSuffix()}`,
            occurred_at: new Date(),
            source_received_at: new Date(),
          },
        });
        await createCase(tx, {
          origin: 'SECURITY_EVENT',
          originating_security_event_id: event.id,
        });
        await tx.securityEvent.delete({ where: { id: event.id } });
      }),
    ).rejects.toThrow();
  });

  it('creates no persistent case, evidence, event, or unrelated audit records', async () => {
    expect(await readCounts()).toEqual(baselineCounts);
  });
});
