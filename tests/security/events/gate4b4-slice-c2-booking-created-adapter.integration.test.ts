import { PrismaClient } from '@prisma/client';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';
import { BookingStatusHistoryAdapter } from '../../../src/lib/security/events/adapters/booking-status-history-adapter';
import { getAdapterForRecord } from '../../../src/lib/security/events/adapters/registry';
import { SecurityLifecycle, SecurityEnvironment } from '../../../src/lib/security/events/taxonomy';
import { pseudonymizeTelemetryContext } from '../../../src/lib/security/telemetry-hmac';

const prisma = new PrismaClient();

describe('Gate 4B-4 Slice C2: BookingStatusHistory Security Telemetry Adapter', () => {
  const fixtureNamespace = `gate4b4-slice-c2-${Date.now()}`;
  let adapter: BookingStatusHistoryAdapter;
  let testHistoryId: string;
  let testBookingId: string = `booking-${fixtureNamespace}`;
  let testActorId: string = `actor-${fixtureNamespace}`;

  beforeAll(() => {
    assertSafeLocalTestDatabaseTarget();
    process.env.SECURITY_TELEMETRY_HMAC_KEY = 'test-hmac-key-1234567890123456789012345678901234567890';
    adapter = new BookingStatusHistoryAdapter();
  });

  afterAll(async () => {
    // Fixture cleanup limited to the Slice C2 namespace
    await prisma.bookingStatusHistory.deleteMany({
      where: { notes: { startsWith: fixtureNamespace } }
    });
    await prisma.$disconnect();
  });

  it('registry routes the exact record to the BookingStatusHistory adapter', () => {
    const record = {
      id: `history-${fixtureNamespace}`,
      booking_id: testBookingId,
      old_status: 'SYSTEM_CREATION',
      new_status: 'PENDING_PAYMENT',
      changed_by: testActorId,
      notes: fixtureNamespace,
      created_at: new Date()
    };
    
    const resolvedAdapter = getAdapterForRecord(record);
    expect(resolvedAdapter).toBeInstanceOf(BookingStatusHistoryAdapter);
    expect(resolvedAdapter?.supports(record)).toBe(true);
  });

  it('emits exactly one BOOKING_CREATED SecurityEvent for explicit creation history record', () => {
    const occurredAt = new Date('2026-07-20T12:00:00Z');
    const record = {
      id: `history-${fixtureNamespace}-1`,
      booking_id: testBookingId,
      old_status: 'SYSTEM_CREATION',
      new_status: 'PENDING_PAYMENT',
      changed_by: testActorId,
      notes: fixtureNamespace,
      created_at: occurredAt
    } as any; // Cast for testing since we aren't using the full Prisma object

    const result = adapter.normalize(record, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);

    expect(result.event_code).toBe('BOOKING_CREATED');
    expect(result.source_record_id).toBe(record.id);
    expect(result.occurred_at).toBe(occurredAt);
    expect(result.event_classification).toBe('FRAUD_INDICATOR');
    expect(result.severity).toBe('HIGH');
    expect(result.event_category).toBe('Booking');
    
    // HMAC Actor Correlation
    const expectedActorHash = pseudonymizeTelemetryContext('booking-creation-actor', testActorId);
    expect(result.correlation_key).toBe(expectedActorHash);
    expect(result.correlation_key).not.toContain(testActorId);
    
    // HMAC Booking Reference
    const expectedBookingHash = pseudonymizeTelemetryContext('booking-reference', testBookingId);
    const summary = result.source_summary as any;
    expect(summary.booking_reference).toBe(expectedBookingHash);
    expect(summary.booking_reference).not.toContain(testBookingId);
    
    // Idempotency
    expect(result.idempotency_key).toBeDefined();
  });

  it('reprocessing the same history row creates an identical idempotency key (duplicate protection)', () => {
    const record = {
      id: `history-${fixtureNamespace}-1`,
      booking_id: testBookingId,
      old_status: 'SYSTEM_CREATION',
      new_status: 'PENDING_PAYMENT',
      changed_by: testActorId,
      notes: fixtureNamespace,
      created_at: new Date()
    } as any;

    const result1 = adapter.normalize(record, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);
    const result2 = adapter.normalize(record, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);

    expect(result1.idempotency_key).toBe(result2.idempotency_key);
  });

  it('a different valid creation-history row creates a distinct idempotency key', () => {
    const record1 = {
      id: `history-${fixtureNamespace}-1`,
      booking_id: testBookingId,
      old_status: 'SYSTEM_CREATION',
      new_status: 'PENDING_PAYMENT',
      changed_by: testActorId,
      notes: fixtureNamespace,
      created_at: new Date()
    } as any;
    
    const record2 = {
      ...record1,
      id: `history-${fixtureNamespace}-2`,
    };

    const result1 = adapter.normalize(record1, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);
    const result2 = adapter.normalize(record2, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);

    expect(result1.idempotency_key).not.toBe(result2.idempotency_key);
  });

  it('an ordinary status-update history row emits no BOOKING_CREATED event', () => {
    const record = {
      id: `history-${fixtureNamespace}-3`,
      booking_id: testBookingId,
      old_status: 'PENDING_PAYMENT',
      new_status: 'PAID',
      changed_by: testActorId,
      notes: fixtureNamespace,
      created_at: new Date()
    } as any;

    const result = adapter.normalize(record, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);
    expect(result.event_code).toBe('BOOKING_STATUS_UPDATE');
    expect(result.event_classification).toBe('OBSERVATION');
  });

  it('a cancellation history row emits no BOOKING_CREATED event', () => {
    const record = {
      id: `history-${fixtureNamespace}-4`,
      booking_id: testBookingId,
      old_status: 'PENDING_PAYMENT',
      new_status: 'CANCELLED',
      changed_by: testActorId,
      notes: fixtureNamespace,
      created_at: new Date()
    } as any;

    const result = adapter.normalize(record, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);
    expect(result.event_code).toBe('BOOKING_CANCELLED');
    expect(result.event_classification).toBe('OBSERVATION');
  });

  it('a completion history row emits no BOOKING_CREATED event', () => {
    const record = {
      id: `history-${fixtureNamespace}-5`,
      booking_id: testBookingId,
      old_status: 'ACTIVE',
      new_status: 'COMPLETED',
      changed_by: testActorId,
      notes: fixtureNamespace,
      created_at: new Date()
    } as any;

    const result = adapter.normalize(record, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);
    expect(result.event_code).toBe('BOOKING_COMPLETED');
    expect(result.event_classification).toBe('OBSERVATION');
  });

  it('missing actor source fails safely', () => {
    const record = {
      id: `history-${fixtureNamespace}-6`,
      booking_id: testBookingId,
      old_status: 'SYSTEM_CREATION',
      new_status: 'PENDING_PAYMENT',
      changed_by: null,
      notes: fixtureNamespace,
      created_at: new Date()
    } as any;

    const result = adapter.normalize(record, 'DRAFT' as SecurityLifecycle, 'TEST' as SecurityEnvironment);
    expect(result.correlation_key).toBeNull();
  });
});
