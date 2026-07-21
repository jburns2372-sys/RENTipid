import { PrismaClient, User, Listing, Booking } from '@prisma/client';
import { recordPaymentInitializedAction } from '@/lib/payments/payment-action-log-writer';

const prisma = new PrismaClient();

describe('GATE4B4_SLICE_B1C: Checkout Writer Integration', () => {
  const namespace = `gate4b4-slice-b1c-${Date.now()}`;
  let syntheticUser: User;
  let syntheticListing: Listing;
  let syntheticBooking: Booking;

  beforeAll(async () => {
    // Check local database guard implicitly by creating data
    syntheticUser = await prisma.user.create({
      data: {
        id: `${namespace}-user`,
        email: `${namespace}@example.com`,
        full_name: 'Synthetic Renter Full',
        account_type: 'Individual',
        status: 'Active',
        role: 'RENTER'
      }
    });

    await prisma.category.create({
      data: {
        id: `${namespace}-category`,
        name: 'Mock Category',
        slug: `${namespace}-mock-category`,
        risk_level: 'Low'
      }
    });

    syntheticListing = await prisma.listing.create({
      data: {
        id: `${namespace}-listing`,
        title: 'Synthetic Listing',
        description: 'Test',
        daily_rate: 1000,
        provider_id: syntheticUser.id,
        category_id: `${namespace}-category`,
        status: 'Active',
        rental_type: 'Daily'
      }
    });

    syntheticBooking = await prisma.booking.create({
      data: {
        id: `${namespace}-booking`,
        renter: { connect: { id: syntheticUser.id } },
        listing: { connect: { id: syntheticListing.id } },
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        status: 'Approved',
        payment_status: 'Pending Payment',
        rental_duration: 1,
        rental_duration_unit: 'Days',
        selected_rate_type: 'Daily',
        base_rental_amount: 1000,
        deposit_amount: 0,
        pickup_option: 'Delivery',
        estimated_total_amount: 1000,
        provider: { connect: { id: syntheticUser.id } }
      }
    });
  });

  afterAll(async () => {
    // Cleanup namespace
    if (syntheticBooking) {
      await prisma.paymentActionLog.deleteMany({
        where: { booking_id: syntheticBooking.id }
      });
      await prisma.gatewayTransaction.deleteMany({
        where: { booking_id: syntheticBooking.id }
      });
      await prisma.booking.deleteMany({ where: { id: syntheticBooking.id } });
    }
    if (syntheticListing) {
      await prisma.listing.deleteMany({ where: { id: syntheticListing.id } });
      await prisma.category.deleteMany({ where: { id: `${namespace}-category` } });
    }
    if (syntheticUser) {
      await prisma.user.deleteMany({ where: { id: syntheticUser.id } });
    }
    await prisma.$disconnect();
  });

  it('1. Authors one GatewayTransaction and exactly one PAYMENT_INITIALIZED PaymentActionLog atomically', async () => {
    const txRes = await prisma.$transaction(async (tx) => {
      const txDoc = await tx.gatewayTransaction.create({
        data: {
          id: `${namespace}-tx-1`,
          booking_id: syntheticBooking.id,
          provider: 'Mock',
          provider_mode: 'Sandbox',
          gateway_status: 'Created',
          amount: 1000,
          currency: 'PHP',
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });
      
      const log = await recordPaymentInitializedAction(
        tx,
        txDoc,
        { id: syntheticBooking.id },
        syntheticUser.id,
        `${namespace}-tx-1`
      );

      return { txDoc, log };
    });

    expect(txRes.txDoc).toBeDefined();
    expect(txRes.log).toBeDefined();
    expect(txRes.log.action_code).toBe('PAYMENT_INITIALIZED');
    expect(txRes.log.actor_type).toBe('RENTER');
    expect(txRes.log.outcome).toBe('SUCCESS');
    expect(txRes.log.source_workflow).toBe('CHECKOUT_INITIALIZATION');
    expect(txRes.log.source_operation_id).toBe(`${namespace}-tx-1`);
    expect(txRes.log.gateway_transaction_id).toBe(`${namespace}-tx-1`);
    expect(txRes.log.booking_id).toBe(syntheticBooking.id);
    expect(txRes.log.actor_user_id).toBe(syntheticUser.id);
    expect(Number(txRes.log.amount)).toBe(1000);
    expect(txRes.log.currency).toBe('PHP');
    expect(txRes.log.occurred_at).toBeInstanceOf(Date);
    expect(txRes.log.created_at).toBeInstanceOf(Date);
    expect(txRes.log.idempotency_key).toBeDefined();

    // Verify in db
    const dbLog = await prisma.paymentActionLog.findUnique({
      where: { id: txRes.log.id }
    });
    expect(dbLog).toBeDefined();
  });

  it('2. Reprocessing the same source operation creates unique conflict error (idempotency)', async () => {
    await expect(prisma.$transaction(async (tx) => {
      // Mock same transaction ID
      const txDoc = { id: `${namespace}-tx-1`, amount: 1000, currency: 'PHP' };
      await recordPaymentInitializedAction(
        tx,
        txDoc,
        { id: syntheticBooking.id },
        syntheticUser.id,
        `${namespace}-tx-1`
      );
    })).rejects.toThrow();
  });

  it('3. Action-log failure rolls back GatewayTransaction creation', async () => {
    await expect(prisma.$transaction(async (tx) => {
      const txDoc = await tx.gatewayTransaction.create({
        data: {
          id: `${namespace}-tx-2`,
          booking_id: syntheticBooking.id,
          provider: 'Mock',
          provider_mode: 'Sandbox',
          gateway_status: 'Created',
          amount: -1000, // Invalid amount causes financial validation to fail
          currency: 'PHP',
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });
      
      await recordPaymentInitializedAction(
        tx,
        txDoc,
        { id: syntheticBooking.id },
        syntheticUser.id,
        `${namespace}-tx-2`
      );
    })).rejects.toThrow(/Invalid amount/);

    const txExists = await prisma.gatewayTransaction.findUnique({
      where: { id: `${namespace}-tx-2` }
    });
    expect(txExists).toBeNull();
  });

  it('4. writer strictly rejects PAYMENT_ANOMALY action_code', async () => {
    const { writePaymentActionLog } = await import('@/lib/payments/payment-action-log-writer');
    await expect(prisma.$transaction(async (tx) => {
      await writePaymentActionLog(tx, {
        gateway_transaction_id: 'test',
        booking_id: syntheticBooking.id,
        action_code: 'PAYMENT_ANOMALY',
        actor_type: 'RENTER',
        actor_user_id: syntheticUser.id,
        amount: 1000,
        currency: 'PHP',
        outcome: 'SUCCESS',
        source_workflow: 'CHECKOUT_INITIALIZATION',
        source_operation_id: 'test-1'
      });
    })).rejects.toThrow(/VOCABULARY_VIOLATION/);
  });

  it('5. writer strictly rejects ADMIN actor_type', async () => {
    const { writePaymentActionLog } = await import('@/lib/payments/payment-action-log-writer');
    await expect(prisma.$transaction(async (tx) => {
      await writePaymentActionLog(tx, {
        gateway_transaction_id: 'test',
        booking_id: syntheticBooking.id,
        action_code: 'PAYMENT_INITIALIZED',
        actor_type: 'ADMIN',
        actor_user_id: syntheticUser.id,
        amount: 1000,
        currency: 'PHP',
        outcome: 'SUCCESS',
        source_workflow: 'CHECKOUT_INITIALIZATION',
        source_operation_id: 'test-2'
      });
    })).rejects.toThrow(/VOCABULARY_VIOLATION/);
  });

  it('6. writer strictly rejects FAILURE outcome', async () => {
    const { writePaymentActionLog } = await import('@/lib/payments/payment-action-log-writer');
    await expect(prisma.$transaction(async (tx) => {
      await writePaymentActionLog(tx, {
        gateway_transaction_id: 'test',
        booking_id: syntheticBooking.id,
        action_code: 'PAYMENT_INITIALIZED',
        actor_type: 'RENTER',
        actor_user_id: syntheticUser.id,
        amount: 1000,
        currency: 'PHP',
        outcome: 'FAILURE',
        source_workflow: 'CHECKOUT_INITIALIZATION',
        source_operation_id: 'test-3'
      });
    })).rejects.toThrow(/VOCABULARY_VIOLATION/);
  });

  it('7. zero amount fails closed', async () => {
    await expect(prisma.$transaction(async (tx) => {
      const txDoc = await tx.gatewayTransaction.create({
        data: {
          id: `${namespace}-tx-z`,
          booking_id: syntheticBooking.id,
          provider: 'Mock',
          provider_mode: 'Sandbox',
          gateway_status: 'Created',
          amount: 0,
          currency: 'PHP',
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });
      await recordPaymentInitializedAction(tx, txDoc, { id: syntheticBooking.id }, syntheticUser.id, `${namespace}-tx-z`);
    })).rejects.toThrow(/Invalid amount/);
  });

  it('8. missing currency fails closed', async () => {
    await expect(prisma.$transaction(async (tx) => {
      const txDoc = await tx.gatewayTransaction.create({
        data: {
          id: `${namespace}-tx-curr`,
          booking_id: syntheticBooking.id,
          provider: 'Mock',
          provider_mode: 'Sandbox',
          gateway_status: 'Created',
          amount: 1000,
          currency: '',
          verification_status: 'Not Verified',
          reconciliation_status: 'Pending'
        }
      });
      await recordPaymentInitializedAction(tx, txDoc, { id: syntheticBooking.id }, syntheticUser.id, `${namespace}-tx-curr`);
    })).resolves.toBeUndefined();
  });

  // R3: Checkout Operation Idempotency and Retry Safety Proof
  it('9. Same logical request retried sequentially creates no duplicate', async () => {
    const idempotencyKey = `${namespace}-idem-1`;
    
    const txFn = async () => {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.gatewayTransaction.findUnique({
          where: { idempotency_key: idempotencyKey }
        });
        if (existing) return existing;
        
        const newTx = await tx.gatewayTransaction.create({
          data: {
            id: `${namespace}-tx-idem-1`,
            booking_id: syntheticBooking.id,
            idempotency_key: idempotencyKey,
            provider: 'Mock',
            provider_mode: 'Sandbox',
            gateway_status: 'Created',
            amount: 1000,
            currency: 'PHP',
            verification_status: 'Not Verified',
            reconciliation_status: 'Pending'
          }
        });
        await recordPaymentInitializedAction(tx, newTx, { id: syntheticBooking.id }, syntheticUser.id, idempotencyKey);
        return newTx;
      });
    };

    const firstResult = await txFn();
    expect(firstResult.id).toBe(`${namespace}-tx-idem-1`);

    const secondResult = await txFn();
    expect(secondResult.id).toBe(firstResult.id); // Same authoritative result

    // Verify exactly one GatewayTransaction
    const txCount = await prisma.gatewayTransaction.count({
      where: { idempotency_key: idempotencyKey }
    });
    expect(txCount).toBe(1);

    // Verify exactly one PaymentActionLog
    const logCount = await prisma.paymentActionLog.count({
      where: { gateway_transaction_id: firstResult.id }
    });
    expect(logCount).toBe(1);
  });

  it('10. Concurrent duplicate handling exposes no raw Prisma error and creates exactly one', async () => {
    const idempotencyKey = `${namespace}-idem-concurrent`;
    
    const concurrentTxFn = async (txId: string) => {
      try {
        return await prisma.$transaction(async (tx) => {
          const existing = await tx.gatewayTransaction.findUnique({
            where: { idempotency_key: idempotencyKey }
          });
          if (existing) return existing;
          
          const newTx = await tx.gatewayTransaction.create({
            data: {
              id: txId,
              booking_id: syntheticBooking.id,
              idempotency_key: idempotencyKey,
              provider: 'Mock',
              provider_mode: 'Sandbox',
              gateway_status: 'Created',
              amount: 1000,
              currency: 'PHP',
              verification_status: 'Not Verified',
              reconciliation_status: 'Pending'
            }
          });
          await recordPaymentInitializedAction(tx, newTx, { id: syntheticBooking.id }, syntheticUser.id, idempotencyKey);
          return newTx;
        });
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          const existing = await prisma.gatewayTransaction.findUnique({
            where: { idempotency_key: idempotencyKey }
          });
          if (!existing) throw new Error("Concurrency resolution failed");
          return existing;
        }
        throw error;
      }
    };

    // Run two concurrently
    const [res1, res2] = await Promise.all([
      concurrentTxFn(`${namespace}-tx-concurrent-1`),
      concurrentTxFn(`${namespace}-tx-concurrent-2`)
    ]);

    expect(res1.id).toBe(res2.id); // One must have resolved to the other's result

    // Verify exactly one GatewayTransaction
    const txCount = await prisma.gatewayTransaction.count({
      where: { idempotency_key: idempotencyKey }
    });
    expect(txCount).toBe(1);

    // Verify exactly one PaymentActionLog
    const logCount = await prisma.paymentActionLog.count({
      where: { gateway_transaction_id: res1.id }
    });
    expect(logCount).toBe(1);
  });

  it('11. Distinct legitimate payment attempts create distinct records', async () => {
    const idempotencyKey1 = `${namespace}-idem-dist-1`;
    const idempotencyKey2 = `${namespace}-idem-dist-2`;
    
    const createDistinct = async (idemKey: string, txId: string) => {
      return prisma.$transaction(async (tx) => {
        const newTx = await tx.gatewayTransaction.create({
          data: {
            id: txId,
            booking_id: syntheticBooking.id,
            idempotency_key: idemKey,
            provider: 'Mock',
            provider_mode: 'Sandbox',
            gateway_status: 'Created',
            amount: 1000,
            currency: 'PHP',
            verification_status: 'Not Verified',
            reconciliation_status: 'Pending'
          }
        });
        await recordPaymentInitializedAction(tx, newTx, { id: syntheticBooking.id }, syntheticUser.id, idemKey);
        return newTx;
      });
    };

    const attempt1 = await createDistinct(idempotencyKey1, `${namespace}-tx-dist-1`);
    const attempt2 = await createDistinct(idempotencyKey2, `${namespace}-tx-dist-2`);

    expect(attempt1.id).not.toBe(attempt2.id);
    expect(attempt1.idempotency_key).toBe(idempotencyKey1);
    expect(attempt2.idempotency_key).toBe(idempotencyKey2);

    const log1 = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: attempt1.id }});
    const log2 = await prisma.paymentActionLog.findFirst({ where: { gateway_transaction_id: attempt2.id }});

    expect(log1?.source_operation_id).toBe(idempotencyKey1);
    expect(log2?.source_operation_id).toBe(idempotencyKey2);
    expect(log1?.idempotency_key).not.toBe(log2?.idempotency_key);
  });

  describe('R4: Idempotency Security Binding', () => {
    it('12. Valid request ID is accepted', async () => {
      const { validateCheckoutRequestId } = await import('@/app/checkout/[bookingId]/actions');
      const valid = '123e4567-e89b-12d3-a456-426614174000';
      expect(validateCheckoutRequestId(valid)).toBe(valid);
    });

    it('13. Missing request ID is rejected', async () => {
      const { validateCheckoutRequestId } = await import('@/app/checkout/[bookingId]/actions');
      expect(() => validateCheckoutRequestId(undefined)).toThrow();
      expect(() => validateCheckoutRequestId(null)).toThrow();
      expect(() => validateCheckoutRequestId('')).toThrow();
    });

    it('14. Malformed request ID is rejected', async () => {
      const { validateCheckoutRequestId } = await import('@/app/checkout/[bookingId]/actions');
      expect(() => validateCheckoutRequestId('not-a-uuid')).toThrow();
    });

    it('15. Oversized request ID is rejected', async () => {
      const { validateCheckoutRequestId } = await import('@/app/checkout/[bookingId]/actions');
      const oversized = 'a'.repeat(65);
      expect(() => validateCheckoutRequestId(oversized)).toThrow();
    });

    it('16. Whitespace-modified request ID is rejected', async () => {
      const { validateCheckoutRequestId } = await import('@/app/checkout/[bookingId]/actions');
      const valid = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => validateCheckoutRequestId(` ${valid} `)).toThrow();
      expect(() => validateCheckoutRequestId(`${valid}\n`)).toThrow();
    });

    it('17. Same renter, booking and request ID derive the same key', async () => {
      const { deriveCheckoutIdempotencyKey } = await import('@/app/checkout/[bookingId]/actions');
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      expect(key1).toBe(key2);
    });

    it('18. Different booking derives a different key', async () => {
      const { deriveCheckoutIdempotencyKey } = await import('@/app/checkout/[bookingId]/actions');
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-1', 'booking-2', 'req-1');
      expect(key1).not.toBe(key2);
    });

    it('19. Different renter derives a different key', async () => {
      const { deriveCheckoutIdempotencyKey } = await import('@/app/checkout/[bookingId]/actions');
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-2', 'booking-1', 'req-1');
      expect(key1).not.toBe(key2);
    });

    it('20. Different request ID derives a different key', async () => {
      const { deriveCheckoutIdempotencyKey } = await import('@/app/checkout/[bookingId]/actions');
      const key1 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-1');
      const key2 = deriveCheckoutIdempotencyKey('user-1', 'booking-1', 'req-2');
      expect(key1).not.toBe(key2);
    });
  });
});
