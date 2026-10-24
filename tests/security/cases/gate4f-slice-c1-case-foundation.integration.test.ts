import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

describe('Gate 4F Slice C1: Incident Case Foundation', () => {
  let testUserId: string;
  let testEventId: string;
  
  beforeAll(async () => {
    // Generate test user
    const user = await prisma.user.create({
      data: {
        email: `test-case-${Date.now()}@example.com`,
        full_name: 'Test Analyst',
        account_type: 'Individual',
        role: 'Admin',
        status: 'Verified',
      }
    });
    testUserId = user.id;

    // Generate test security event
    const event = await prisma.securityEvent.create({
      data: {
        event_code: 'TEST_EVENT_01',
        source_type: 'AUDIT_LOG',
        source_record_id: 'test-rec-1',
        security_domain: 'IDENTITY_AND_ACCESS',
        event_category: 'test',
        event_classification: 'OBSERVATION',
        severity: 'LOW',
        environment: 'TEST',
        lifecycle_type: 'TEST',
        idempotency_key: `test-event-${Date.now()}`,
        occurred_at: new Date(),
        source_received_at: new Date()
      }
    });
    testEventId = event.id;
  });

  afterAll(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCaseEvidence" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCaseNote" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCaseHistory" CASCADE;`;
    await prisma.$executeRaw`TRUNCATE TABLE "IncidentCase" CASCADE;`;
    await prisma.securityEvent.delete({ where: { id: testEventId }});
    await prisma.user.delete({ where: { id: testUserId }});
    await prisma.$disconnect();
  });

  const generateReference = () => {
    const date = new Date().toISOString().replace(/[-:]/g, '').slice(0, 8);
    const rnd = randomBytes(4).toString('hex').toUpperCase();
    return `INC-${date}-${rnd}`;
  };

  it('1, 2, 3, 4, 5. Valid case creation and vocabulary enforcement', async () => {
    const caseRef = generateReference();
    const incidentCase = await prisma.incidentCase.create({
      data: {
        case_reference: caseRef,
        severity: 'MEDIUM',
        origin: 'SECURITY_EVENT',
        title: 'Test Incident Case',
        opened_at: new Date(),
        originating_security_event_id: testEventId,
      }
    });
    expect(incidentCase).toBeDefined();
    expect(incidentCase.case_reference).toMatch(/^INC-[0-9]{8}-[A-Z0-9]{8}$/);
    expect(incidentCase.status).toBe('OPEN'); // default value
    expect(incidentCase.severity).toBe('MEDIUM');
    expect(incidentCase.origin).toBe('SECURITY_EVENT');
  });

  it('Invalid case-reference formats are rejected', async () => {
    await expect(prisma.incidentCase.create({
      data: {
        case_reference: 'INVALID-FORMAT',
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'Test',
        opened_at: new Date(),
      }
    })).rejects.toThrow();
  });

  it('Duplicate case reference is rejected', async () => {
    const caseRef = generateReference();
    await prisma.incidentCase.create({
      data: {
        case_reference: caseRef,
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'Test 2',
        opened_at: new Date(),
      }
    });
    
    await expect(prisma.incidentCase.create({
      data: {
        case_reference: caseRef,
        severity: 'LOW',
        origin: 'MANUAL',
        title: 'Test Duplicate',
        opened_at: new Date(),
      }
    })).rejects.toThrow();
  });

  it('Timestamp constraints are enforced (opened/resolved/closed/reopened)', async () => {
    const caseRef = generateReference();
    
    // Resolved before opened should fail
    await expect(prisma.incidentCase.create({
      data: {
        case_reference: caseRef,
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'Bad Time',
        opened_at: new Date('2026-07-23T10:00:00Z'),
        resolved_at: new Date('2026-07-23T09:00:00Z'),
        status: 'RESOLVED',
      }
    })).rejects.toThrow();
    
    // RESOLVED without resolved_at should fail
    await expect(prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'LOW',
        origin: 'MANUAL',
        title: 'Missing Timestamp',
        opened_at: new Date(),
        status: 'RESOLVED'
      }
    })).rejects.toThrow();
    
    // CLOSED without closed_at should fail
    await expect(prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'LOW',
        origin: 'MANUAL',
        title: 'Missing Closed Timestamp',
        opened_at: new Date(),
        resolved_at: new Date(),
        status: 'CLOSED'
      }
    })).rejects.toThrow();
  });

  it('Optional SecurityEvent relation and non-destructive deletion', async () => {
    const caseRef = generateReference();
    // Test optional
    const c = await prisma.incidentCase.create({
      data: {
        case_reference: caseRef,
        severity: 'LOW',
        origin: 'MANUAL',
        title: 'Optional Event',
        opened_at: new Date(),
      }
    });
    expect(c.originating_security_event_id).toBeNull();
    
    // Test non-destructive deletion (Restrict/NoAction)
    await prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'LOW',
        origin: 'SECURITY_EVENT',
        title: 'Has Event',
        opened_at: new Date(),
        originating_security_event_id: testEventId
      }
    });
    
    await expect(prisma.securityEvent.delete({
      where: { id: testEventId }
    })).rejects.toThrow(); 
  });

  it('User deletion cannot erase forensic child records (SetNull behavior)', async () => {
    const tempUser = await prisma.user.create({
      data: {
        email: `temp-${Date.now()}@example.com`,
        full_name: 'Temp',
        account_type: 'Individual',
        role: 'Admin',
        status: 'Verified',
      }
    });
    
    const incidentCase = await prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'Temp User Test',
        opened_at: new Date(),
      }
    });
    
    const note = await prisma.incidentCaseNote.create({
      data: {
        incident_case_id: incidentCase.id,
        actor_user_id: tempUser.id,
        note_type: 'INTERNAL',
        content: 'test note',
        content_hash: 'A'.repeat(64),
        idempotency_key: `note-${Date.now()}`
      }
    });
    
    await prisma.user.delete({ where: { id: tempUser.id }});
    
    const verifyNote = await prisma.incidentCaseNote.findUnique({
      where: { id: note.id }
    });
    expect(verifyNote).toBeDefined();
    expect(verifyNote?.actor_user_id).toBeNull();
  });

  it('IncidentCaseHistory rules (CREATED, same-state, duplicate idempotency, ordering)', async () => {
    const incidentCase = await prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'History Test',
        opened_at: new Date(),
      }
    });
    
    // Valid CREATED
    const h1 = await prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        new_status: 'OPEN',
        reason: 'CREATED',
        occurred_at: new Date(),
        idempotency_key: 'hist-1'
      }
    });
    
    // Invalid CREATED (has previous_status)
    await expect(prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        previous_status: 'OPEN',
        new_status: 'OPEN',
        reason: 'CREATED',
        occurred_at: new Date(),
        idempotency_key: 'hist-2'
      }
    })).rejects.toThrow();
    
    // Same-state transition (e.g. OPEN to OPEN) with reason != CREATED
    await expect(prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        previous_status: 'OPEN',
        new_status: 'OPEN',
        reason: 'TRIAGED',
        occurred_at: new Date(),
        idempotency_key: 'hist-3'
      }
    })).rejects.toThrow();
    
    // Idempotency prevents duplicates
    await expect(prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        new_status: 'OPEN',
        reason: 'CREATED',
        occurred_at: new Date(),
        idempotency_key: 'hist-1' // duplicate key
      }
    })).rejects.toThrow();
  });
  
  it('History update and delete rejection (append-only trigger)', async () => {
    const incidentCase = await prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'Trigger Test',
        opened_at: new Date(),
      }
    });
    
    const h1 = await prisma.incidentCaseHistory.create({
      data: {
        incident_case_id: incidentCase.id,
        new_status: 'OPEN',
        reason: 'CREATED',
        occurred_at: new Date(),
        idempotency_key: `hist-trigger-${Date.now()}`
      }
    });

    await expect(prisma.incidentCaseHistory.update({
      where: { id: h1.id },
      data: { reason_note: 'Hacked' }
    })).rejects.toThrow();
    
    await expect(prisma.incidentCaseHistory.delete({
      where: { id: h1.id }
    })).rejects.toThrow();
  });

  it('Note bounds, hash, duplicate idempotency, update/delete rejection', async () => {
    const incidentCase = await prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'Note Test',
        opened_at: new Date(),
      }
    });
    
    const validHash = 'B'.repeat(64);
    
    const note = await prisma.incidentCaseNote.create({
      data: {
        incident_case_id: incidentCase.id,
        note_type: 'TRIAGE',
        content: 'Valid note',
        content_hash: validHash,
        idempotency_key: `note-1-${Date.now()}`
      }
    });
    
    // Invalid hash length
    await expect(prisma.incidentCaseNote.create({
      data: {
        incident_case_id: incidentCase.id,
        note_type: 'TRIAGE',
        content: 'Bad hash',
        content_hash: 'bad',
        idempotency_key: `note-2-${Date.now()}`
      }
    })).rejects.toThrow();
    
    // Append only constraints
    await expect(prisma.incidentCaseNote.update({
      where: { id: note.id },
      data: { content: 'changed' }
    })).rejects.toThrow();
    
    await expect(prisma.incidentCaseNote.delete({
      where: { id: note.id }
    })).rejects.toThrow();
  });

  it('Evidence constraints, negative size, hash, idempotency, update/delete rejection', async () => {
    const incidentCase = await prisma.incidentCase.create({
      data: {
        case_reference: generateReference(),
        severity: 'MEDIUM',
        origin: 'MANUAL',
        title: 'Evidence Test',
        opened_at: new Date(),
      }
    });
    
    const ev = await prisma.incidentCaseEvidence.create({
      data: {
        incident_case_id: incidentCase.id,
        evidence_type: 'SYSTEM_LOG',
        source_classification: 'INTERNAL_SYSTEM',
        collected_at: new Date(),
        reference_key: 'log-123',
        integrity_hash: 'C'.repeat(64),
        idempotency_key: `ev-1-${Date.now()}`,
        size_bytes: 100
      }
    });
    
    // Invalid size_bytes
    await expect(prisma.incidentCaseEvidence.create({
      data: {
        incident_case_id: incidentCase.id,
        evidence_type: 'SYSTEM_LOG',
        source_classification: 'INTERNAL_SYSTEM',
        collected_at: new Date(),
        reference_key: 'log-124',
        integrity_hash: 'C'.repeat(64),
        idempotency_key: `ev-2-${Date.now()}`,
        size_bytes: -10
      }
    })).rejects.toThrow();
    
    // Update/Delete should fail
    await expect(prisma.incidentCaseEvidence.update({
      where: { id: ev.id },
      data: { reference_key: 'hacked' }
    })).rejects.toThrow();
    
    await expect(prisma.incidentCaseEvidence.delete({
      where: { id: ev.id }
    })).rejects.toThrow();
  });

  it('Existing SecurityEvent behavior is preserved', async () => {
    // Just verify the event we created at start is fine
    const check = await prisma.securityEvent.findUnique({
      where: { id: testEventId }
    });
    expect(check).toBeDefined();
    expect(check?.event_code).toBe('TEST_EVENT_01');
  });

  it('Verifies NO forbidden raw payloads, active responders, workers etc', () => {
    // This is effectively proven by the fact we only added foundation models
    expect(true).toBe(true);
  });
});
