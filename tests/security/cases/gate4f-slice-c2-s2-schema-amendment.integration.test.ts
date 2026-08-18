import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

type ColumnMetadata = {
  is_nullable: string;
  column_default: string | null;
  data_type: string;
};

type ForeignKeyMetadata = {
  delete_action: string;
  update_action: string;
};

type TriggerMetadata = {
  table_name: string;
  trigger_name: string;
};

type RoleMetadata = {
  rolcanlogin: boolean;
  rolsuper: boolean;
  rolcreatedb: boolean;
  rolcreaterole: boolean;
  rolreplication: boolean;
  rolbypassrls: boolean;
};

type AssignmentHistoryRow = {
  assigned_to_user_id: string | null;
  actor_user_id: string | null;
  assigned_email: string | null;
};

describe('Gate 4F Slice C2-S2: Incident Case Minimum Schema Amendment', () => {
  const createdUserIds: string[] = [];
  let actorUserId: string;
  let assignedUserId: string;
  let securityEventId: string;
  let legacyCaseId: string;
  let auditLogCountBefore: number;

  const uniqueSuffix = () => `${Date.now()}-${randomBytes(4).toString('hex')}`;

  const caseReference = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INC-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
  };

  const createUser = async (label: string) => {
    const user = await prisma.user.create({
      data: {
        email: `c2-s2-${label}-${uniqueSuffix()}@example.com`,
        full_name: `C2-S2 ${label}`,
        account_type: 'Individual',
        role: 'Admin',
        status: 'Verified',
      },
    });
    createdUserIds.push(user.id);
    return user;
  };

  const createCase = async (title: string, originatingSecurityEventId?: string) =>
    prisma.incidentCase.create({
      data: {
        case_reference: caseReference(),
        severity: 'MEDIUM',
        origin: originatingSecurityEventId ? 'SECURITY_EVENT' : 'MANUAL',
        title,
        opened_at: new Date(),
        created_by_user_id: actorUserId,
        originating_security_event_id: originatingSecurityEventId,
      },
    });

  beforeAll(async () => {
    auditLogCountBefore = await prisma.auditLog.count();

    actorUserId = (await createUser('actor')).id;
    assignedUserId = (await createUser('assigned')).id;

    const securityEvent = await prisma.securityEvent.create({
      data: {
        event_code: 'GATE4F_C2_S2_SCHEMA_TEST',
        source_type: 'AUDIT_LOG',
        source_record_id: `c2-s2-${uniqueSuffix()}`,
        security_domain: 'IDENTITY_AND_ACCESS',
        event_category: 'schema_contract',
        event_classification: 'OBSERVATION',
        severity: 'LOW',
        environment: 'TEST',
        lifecycle_type: 'TEST',
        idempotency_key: `c2-s2-event-${uniqueSuffix()}`,
        occurred_at: new Date(),
        source_received_at: new Date(),
      },
    });
    securityEventId = securityEvent.id;

    const legacyCase = await createCase('Legacy-compatible case');
    legacyCaseId = legacyCase.id;
    await prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: legacyCase.id,
        previous_status: null,
        new_status: 'OPEN',
        reason: 'CREATED',
        actor_user_id: actorUserId,
        occurred_at: new Date(),
        idempotency_key: `created-${uniqueSuffix()}`,
      },
    });
  });

  afterAll(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCaseEvidence" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCaseNote" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCaseHistory" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCase" CASCADE`;
    await prisma.securityEvent.deleteMany({ where: { id: securityEventId } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
  });

  it('adds only the approved nullable assignment-target column and User relation', async () => {
    const columns = await prisma.$queryRaw<ColumnMetadata[]>`
      SELECT is_nullable, column_default, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'IncidentCaseHistory'
        AND column_name = 'assigned_to_user_id'
    `;

    expect(columns).toEqual([
      {
        is_nullable: 'YES',
        column_default: null,
        data_type: 'text',
      },
    ]);

    const foreignKeys = await prisma.$queryRaw<ForeignKeyMetadata[]>`
      SELECT
        confdeltype::text AS delete_action,
        confupdtype::text AS update_action
      FROM pg_constraint
      WHERE conname = 'IncidentCaseHistory_assigned_to_user_id_fkey'
    `;

    expect(foreignKeys).toEqual([
      {
        delete_action: 'n',
        update_action: 'c',
      },
    ]);
  });

  it('preserves the approved trigger topology and keeps the IncidentCase root mutable', async () => {
    const triggers = await prisma.$queryRaw<TriggerMetadata[]>`
      SELECT
        event_object_table AS table_name,
        trigger_name
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

    expect(triggers).toEqual(
      expect.arrayContaining([
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
        {
          table_name: 'IncidentCaseEvidence',
          trigger_name: 'trigger_prevent_update_delete_evidence',
        },
      ]),
    );
    expect(triggers.filter((trigger) => trigger.table_name === 'IncidentCase')).toHaveLength(0);

    const updated = await prisma.incidentCase.update({
      where: { id: legacyCaseId },
      data: {
        status: 'TRIAGED',
        version: { increment: 1 },
      },
    });
    expect(updated.status).toBe('TRIAGED');
    expect(updated.version).toBe(2);
  });

  it('keeps legacy-form rows valid without an assignment-target backfill', async () => {
    const rows = await prisma.$queryRaw<Array<{ assigned_to_user_id: string | null }>>`
      SELECT assigned_to_user_id
      FROM "IncidentCaseHistory"
      WHERE incident_case_id = ${legacyCaseId}
        AND reason = 'CREATED'
    `;

    expect(rows).toEqual([{ assigned_to_user_id: null }]);
  });

  it('records assignment targets with equal status snapshots and enforces the User foreign key', async () => {
    const incidentCase = await createCase('Assignment relation case');
    const historyId = `c2-s2-assigned-${uniqueSuffix()}`;

    await prisma.$executeRaw`
      INSERT INTO "IncidentCaseHistory" (
        id,
        incident_case_id,
        previous_status,
        new_status,
        reason,
        actor_user_id,
        assigned_to_user_id,
        occurred_at,
        idempotency_key
      ) VALUES (
        ${historyId},
        ${incidentCase.id},
        'OPEN'::"IncidentCaseStatus",
        'OPEN'::"IncidentCaseStatus",
        'ASSIGNED'::"IncidentCaseHistoryReason",
        ${actorUserId},
        ${assignedUserId},
        NOW(),
        ${`assigned-${uniqueSuffix()}`}
      )
    `;

    const joinedRows = await prisma.$queryRaw<AssignmentHistoryRow[]>`
      SELECT
        history.assigned_to_user_id,
        history.actor_user_id,
        assigned.email AS assigned_email
      FROM "IncidentCaseHistory" AS history
      LEFT JOIN "User" AS assigned
        ON assigned.id = history.assigned_to_user_id
      WHERE history.id = ${historyId}
    `;

    expect(joinedRows).toEqual([
      {
        assigned_to_user_id: assignedUserId,
        actor_user_id: actorUserId,
        assigned_email: expect.stringContaining('c2-s2-assigned-'),
      },
    ]);

    await expect(
      prisma.$executeRaw`
        INSERT INTO "IncidentCaseHistory" (
          id,
          incident_case_id,
          previous_status,
          new_status,
          reason,
          actor_user_id,
          assigned_to_user_id,
          occurred_at,
          idempotency_key
        ) VALUES (
          ${`c2-s2-missing-target-${uniqueSuffix()}`},
          ${incidentCase.id},
          'OPEN'::"IncidentCaseStatus",
          'OPEN'::"IncidentCaseStatus",
          'REASSIGNED'::"IncidentCaseHistoryReason",
          ${actorUserId},
          NULL,
          NOW(),
          ${`missing-target-${uniqueSuffix()}`}
        )
      `,
    ).rejects.toThrow();

    await expect(
      prisma.$executeRaw`
        INSERT INTO "IncidentCaseHistory" (
          id,
          incident_case_id,
          previous_status,
          new_status,
          reason,
          actor_user_id,
          assigned_to_user_id,
          occurred_at,
          idempotency_key
        ) VALUES (
          ${`c2-s2-invalid-target-${uniqueSuffix()}`},
          ${incidentCase.id},
          'OPEN'::"IncidentCaseStatus",
          'OPEN'::"IncidentCaseStatus",
          'REASSIGNED'::"IncidentCaseHistoryReason",
          ${actorUserId},
          ${`missing-user-${uniqueSuffix()}`},
          NOW(),
          ${`invalid-target-${uniqueSuffix()}`}
        )
      `,
    ).rejects.toThrow();

    await prisma.user.delete({ where: { id: assignedUserId } });
    createdUserIds.splice(createdUserIds.indexOf(assignedUserId), 1);

    const [afterDeletion] = await prisma.$queryRaw<AssignmentHistoryRow[]>`
      SELECT
        assigned_to_user_id,
        actor_user_id,
        NULL::text AS assigned_email
      FROM "IncidentCaseHistory"
      WHERE id = ${historyId}
    `;

    expect(afterDeletion.assigned_to_user_id).toBeNull();
    expect(afterDeletion.actor_user_id).toBe(actorUserId);
  });

  it('enforces status-changing and non-status history reason semantics', async () => {
    const incidentCase = await createCase('History reason contract case');

    await prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        previous_status: 'OPEN',
        new_status: 'OPEN',
        reason: 'CORRECTION_RECORDED',
        reason_note: 'Append-only correction record.',
        actor_user_id: actorUserId,
        occurred_at: new Date(),
        idempotency_key: `correction-${uniqueSuffix()}`,
      },
    });

    await expect(
      prisma.incidentCaseHistory.create({
        data: {
          incident_case_id: incidentCase.id,
          previous_status: 'OPEN',
          new_status: 'OPEN',
          reason: 'TRIAGED',
          actor_user_id: actorUserId,
          occurred_at: new Date(),
          idempotency_key: `invalid-transition-${uniqueSuffix()}`,
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.$executeRaw`
        INSERT INTO "IncidentCaseHistory" (
          id,
          incident_case_id,
          previous_status,
          new_status,
          reason,
          actor_user_id,
          assigned_to_user_id,
          occurred_at,
          idempotency_key
        ) VALUES (
          ${`c2-s2-invalid-assignment-status-${uniqueSuffix()}`},
          ${incidentCase.id},
          'OPEN'::"IncidentCaseStatus",
          'TRIAGED'::"IncidentCaseStatus",
          'ASSIGNED'::"IncidentCaseHistoryReason",
          ${actorUserId},
          ${actorUserId},
          NOW(),
          ${`invalid-assignment-status-${uniqueSuffix()}`}
        )
      `,
    ).rejects.toThrow();
  });

  it('retains append-only protection for history, notes, and evidence', async () => {
    const incidentCase = await createCase('Append-only contract case');
    const history = await prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        previous_status: 'OPEN',
        new_status: 'TRIAGED',
        reason: 'TRIAGED',
        actor_user_id: actorUserId,
        occurred_at: new Date(),
        idempotency_key: `history-append-only-${uniqueSuffix()}`,
      },
    });
    const note = await prisma.incidentCaseNote.create({
      data: {
        incident_case_id: incidentCase.id,
        actor_user_id: actorUserId,
        note_type: 'TRIAGE',
        content: 'Bounded schema-amendment test note.',
        content_hash: 'A'.repeat(64),
        idempotency_key: `note-append-only-${uniqueSuffix()}`,
      },
    });
    const evidence = await prisma.incidentCaseEvidence.create({
      data: {
        incident_case_id: incidentCase.id,
        evidence_type: 'SYSTEM_LOG',
        source_classification: 'INTERNAL_SYSTEM',
        added_by_user_id: actorUserId,
        collected_at: new Date(),
        reference_key: `schema-test-${uniqueSuffix()}`,
        integrity_hash: 'B'.repeat(64),
        content_type: 'application/reference',
        size_bytes: 1,
        idempotency_key: `evidence-append-only-${uniqueSuffix()}`,
      },
    });

    await expect(
      prisma.incidentCaseHistory.update({
        where: { id: history.id },
        data: { reason_note: 'Mutation rejected' },
      }),
    ).rejects.toThrow();
    await expect(prisma.incidentCaseHistory.delete({ where: { id: history.id } })).rejects.toThrow();

    await expect(
      prisma.incidentCaseNote.update({
        where: { id: note.id },
        data: { content: 'Mutation rejected' },
      }),
    ).rejects.toThrow();
    await expect(prisma.incidentCaseNote.delete({ where: { id: note.id } })).rejects.toThrow();

    await expect(
      prisma.incidentCaseEvidence.update({
        where: { id: evidence.id },
        data: { reference_key: 'mutation-rejected' },
      }),
    ).rejects.toThrow();
    await expect(prisma.incidentCaseEvidence.delete({ where: { id: evidence.id } })).rejects.toThrow();
  });

  it('preserves optional and non-mutating SecurityEvent linkage', async () => {
    const eventBefore = await prisma.securityEvent.findUniqueOrThrow({
      where: { id: securityEventId },
    });
    const unlinkedCase = await createCase('Optional SecurityEvent case');
    const linkedCase = await createCase('Linked SecurityEvent case', securityEventId);
    const eventAfter = await prisma.securityEvent.findUniqueOrThrow({
      where: { id: securityEventId },
    });

    expect(unlinkedCase.originating_security_event_id).toBeNull();
    expect(linkedCase.originating_security_event_id).toBe(securityEventId);
    expect(eventAfter).toEqual(eventBefore);

    await expect(
      prisma.incidentCase.create({
        data: {
          case_reference: caseReference(),
          severity: 'LOW',
          origin: 'SECURITY_EVENT',
          title: 'Invalid SecurityEvent relation',
          opened_at: new Date(),
          originating_security_event_id: `missing-event-${uniqueSuffix()}`,
        },
      }),
    ).rejects.toThrow();
  });

  it('uses a restricted local test role and creates no unrelated audit records', async () => {
    const roles = await prisma.$queryRaw<RoleMetadata[]>`
      SELECT
        rolcanlogin,
        rolsuper,
        rolcreatedb,
        rolcreaterole,
        rolreplication,
        rolbypassrls
      FROM pg_roles
      WHERE rolname = current_user
    `;

    expect(roles).toEqual([
      {
        rolcanlogin: true,
        rolsuper: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false,
      },
    ]);
    expect(await prisma.auditLog.count()).toBe(auditLogCountBefore);
  });
});
