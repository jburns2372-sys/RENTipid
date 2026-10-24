import { Prisma, type PrismaClient } from "@prisma/client";
import type { InsurancePolicy } from "../types";
import type {
  InsuranceTransactionRepository,
  InsuranceWebhookEventRecord,
  NewInsuranceOrder,
  NewInsuranceSelection,
  NewInsuranceWebhookEvent,
  PersistIssuedPolicyInput,
} from "./repository";
import type {
  InsuranceOrderRecord,
  InsuranceSelectionRecord,
} from "./types";
import { InsuranceTransactionError } from "./types";

type SelectionRow = Awaited<
  ReturnType<PrismaClient["insuranceSelection"]["findUnique"]>
>;
type OrderRow = Awaited<
  ReturnType<PrismaClient["insuranceOrder"]["findUnique"]>
>;

function selectionFromRow(row: NonNullable<SelectionRow>): InsuranceSelectionRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    userId: row.user_id,
    offerId: row.offer_reference,
    partnerKey: row.partner_key,
    productCode: row.product_code,
    disclosureVersion: row.disclosure_version,
    premiumMinor: row.premium_minor,
    currency: row.currency,
    coverageStart: row.coverage_start,
    coverageEnd: row.coverage_end,
    offerExpiresAt: row.offer_expires_at,
    consentedAt: row.consented_at,
    idempotencyKey: row.idempotency_key,
    requestHash: row.request_hash,
    status: row.status as InsuranceSelectionRecord["status"],
    createdAt: row.created_at,
  };
}

function orderFromRow(row: NonNullable<OrderRow>): InsuranceOrderRecord {
  return {
    id: row.id,
    selectionId: row.selection_id,
    bookingId: row.booking_id,
    userId: row.user_id,
    idempotencyKey: row.idempotency_key,
    requestHash: row.request_hash,
    status: row.status as InsuranceOrderRecord["status"],
    paymentDependencyStatus:
      row.payment_dependency_status as InsuranceOrderRecord["paymentDependencyStatus"],
    paymentReference: row.payment_reference ?? undefined,
    issuanceIdempotencyKey: row.issuance_idempotency_key ?? undefined,
    issuanceRequestHash: row.issuance_request_hash ?? undefined,
    externalOrderId: row.external_order_id ?? undefined,
    failureCode: row.failure_code ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function policyFromRow(row: {
  id: string;
  external_policy_id: string;
  booking_id: string;
  status: string;
  premium_amount: Prisma.Decimal;
  currency: string;
  coverage_start: Date;
  coverage_end: Date;
  issued_at: Date | null;
  cancelled_at: Date | null;
  product: { product_code: string };
}): InsurancePolicy {
  return {
    policyId: row.id,
    externalPolicyId: row.external_policy_id,
    bookingId: row.booking_id,
    productCode: row.product.product_code,
    status: row.status as InsurancePolicy["status"],
    premium: {
      amountMinor: Math.round(Number(row.premium_amount) * 100),
      currency: row.currency,
    },
    coverageStart: row.coverage_start,
    coverageEnd: row.coverage_end,
    issuedAt: row.issued_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
  };
}

export class PrismaInsuranceTransactionRepository
  implements InsuranceTransactionRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  async findSelectionByIdempotencyKey(idempotencyKey: string) {
    const row = await this.prisma.insuranceSelection.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    return row ? selectionFromRow(row) : null;
  }

  async findSelectionByBookingId(bookingId: string) {
    const row = await this.prisma.insuranceSelection.findUnique({
      where: { booking_id: bookingId },
    });
    return row ? selectionFromRow(row) : null;
  }

  async findSelectionById(id: string) {
    const row = await this.prisma.insuranceSelection.findUnique({ where: { id } });
    return row ? selectionFromRow(row) : null;
  }

  async createSelection(input: NewInsuranceSelection) {
    try {
      const row = await this.prisma.insuranceSelection.create({
        data: {
          booking_id: input.bookingId,
          user_id: input.userId,
          offer_reference: input.offerId,
          partner_key: input.partnerKey,
          product_code: input.productCode,
          disclosure_version: input.disclosureVersion,
          premium_minor: input.premiumMinor,
          currency: input.currency,
          coverage_start: input.coverageStart,
          coverage_end: input.coverageEnd,
          offer_expires_at: input.offerExpiresAt,
          consent_accepted: true,
          consented_at: input.consentedAt,
          idempotency_key: input.idempotencyKey,
          request_hash: input.requestHash,
          status: input.status,
        },
      });
      return selectionFromRow(row);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const existing =
          (await this.findSelectionByIdempotencyKey(input.idempotencyKey)) ??
          (await this.findSelectionByBookingId(input.bookingId));
        if (existing) {
          if (existing.requestHash !== input.requestHash) {
            throw new InsuranceTransactionError(
              "IDEMPOTENCY_CONFLICT",
              "Conflicting insurance selection replay rejected.",
            );
          }
          return existing;
        }
      }
      throw error;
    }
  }

  async findOrderByIdempotencyKey(idempotencyKey: string) {
    const row = await this.prisma.insuranceOrder.findUnique({
      where: { idempotency_key: idempotencyKey },
    });
    return row ? orderFromRow(row) : null;
  }

  async findOrderBySelectionId(selectionId: string) {
    const row = await this.prisma.insuranceOrder.findUnique({
      where: { selection_id: selectionId },
    });
    return row ? orderFromRow(row) : null;
  }

  async findOrderById(id: string) {
    const row = await this.prisma.insuranceOrder.findUnique({ where: { id } });
    return row ? orderFromRow(row) : null;
  }

  async createOrder(input: NewInsuranceOrder) {
    try {
      const row = await this.prisma.insuranceOrder.create({
        data: {
          selection_id: input.selectionId,
          booking_id: input.bookingId,
          user_id: input.userId,
          idempotency_key: input.idempotencyKey,
          request_hash: input.requestHash,
          status: input.status,
          payment_dependency_status: input.paymentDependencyStatus,
          payment_reference: input.paymentReference,
          issuance_idempotency_key: input.issuanceIdempotencyKey,
          issuance_request_hash: input.issuanceRequestHash,
          external_order_id: input.externalOrderId,
          failure_code: input.failureCode,
        },
      });
      return orderFromRow(row);
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const existing =
          (await this.findOrderByIdempotencyKey(input.idempotencyKey)) ??
          (await this.findOrderBySelectionId(input.selectionId));
        if (existing) {
          if (existing.requestHash !== input.requestHash) {
            throw new InsuranceTransactionError(
              "IDEMPOTENCY_CONFLICT",
              "Conflicting insurance order replay rejected.",
            );
          }
          return existing;
        }
      }
      throw error;
    }
  }

  async updateOrder(
    orderId: string,
    update: Parameters<InsuranceTransactionRepository["updateOrder"]>[1],
  ) {
    const row = await this.prisma.insuranceOrder.update({
      where: { id: orderId },
      data: {
        status: update.status,
        payment_dependency_status: update.paymentDependencyStatus,
        payment_reference: update.paymentReference,
        issuance_idempotency_key: update.issuanceIdempotencyKey,
        issuance_request_hash: update.issuanceRequestHash,
        external_order_id: update.externalOrderId,
        failure_code: update.failureCode,
      },
    });
    return orderFromRow(row);
  }

  async persistIssuedPolicy(input: PersistIssuedPolicyInput) {
    const partner = await this.prisma.insurancePartner.findUnique({
      where: { adapter_key: input.selection.partnerKey },
    });
    if (!partner) {
      throw new InsuranceTransactionError(
        "ISSUANCE_FAILED",
        "Configured insurance partner metadata is unavailable.",
      );
    }
    const product = await this.prisma.insuranceProduct.findUnique({
      where: {
        partner_id_product_code: {
          partner_id: partner.id,
          product_code: input.selection.productCode,
        },
      },
    });
    if (!product) {
      throw new InsuranceTransactionError(
        "ISSUANCE_FAILED",
        "Configured insurance product metadata is unavailable.",
      );
    }

    const row = await this.prisma.insurancePolicy.upsert({
      where: { insurance_order_id: input.order.id },
      update: {
        status: input.policy.status,
        external_policy_id: input.policy.externalPolicyId,
        issued_at: input.policy.issuedAt,
        normalized_snapshot: {
          source: input.selection.partnerKey,
          mock: input.selection.partnerKey === "mock",
        },
      },
      create: {
        partner_id: partner.id,
        product_id: product.id,
        booking_id: input.order.bookingId,
        insurance_order_id: input.order.id,
        external_policy_id: input.policy.externalPolicyId,
        order_reference: input.order.id,
        idempotency_key: input.idempotencyKey,
        status: input.policy.status,
        premium_amount: new Prisma.Decimal(input.selection.premiumMinor).div(100),
        currency: input.selection.currency,
        coverage_start: input.selection.coverageStart,
        coverage_end: input.selection.coverageEnd,
        issued_at: input.policy.issuedAt,
        normalized_snapshot: {
          source: input.selection.partnerKey,
          mock: input.selection.partnerKey === "mock",
        },
      },
      include: { product: { select: { product_code: true } } },
    });
    return policyFromRow(row);
  }

  async findPolicyByOrderId(orderId: string) {
    const row = await this.prisma.insurancePolicy.findUnique({
      where: { insurance_order_id: orderId },
      include: { product: { select: { product_code: true } } },
    });
    return row ? policyFromRow(row) : null;
  }

  async findWebhookEvent(partnerKey: string, externalEventId: string) {
    const row = await this.prisma.insuranceWebhookEvent.findFirst({
      where: {
        partner: { adapter_key: partnerKey },
        external_event_id: externalEventId,
      },
    });
    return row
      ? {
          id: row.id,
          partnerKey,
          externalEventId: row.external_event_id,
          eventType: row.event_type,
          bodyHash: row.body_hash,
          occurredAt: row.occurred_at ?? row.received_at,
          receivedAt: row.received_at,
          created: false,
          processingStatus:
            row.processing_status as InsuranceWebhookEventRecord["processingStatus"],
        }
      : null;
  }

  async createWebhookEvent(input: NewInsuranceWebhookEvent) {
    const partner = await this.prisma.insurancePartner.findUnique({
      where: { adapter_key: input.partnerKey },
    });
    if (!partner) {
      throw new InsuranceTransactionError(
        "WEBHOOK_VERIFICATION_FAILED",
        "Insurance webhook partner is unavailable.",
      );
    }
    try {
      const row = await this.prisma.insuranceWebhookEvent.create({
        data: {
          partner_id: partner.id,
          external_event_id: input.externalEventId,
          event_type: input.eventType,
          body_hash: input.bodyHash,
          signature_valid: true,
          processing_status: "PENDING",
          occurred_at: input.occurredAt,
          received_at: input.receivedAt,
        },
      });
      return {
        ...input,
        id: row.id,
        created: true,
        processingStatus: "PENDING" as const,
      };
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const existing = await this.findWebhookEvent(
          input.partnerKey,
          input.externalEventId,
        );
        if (existing) {
          if (existing.bodyHash !== input.bodyHash) {
            throw new InsuranceTransactionError(
              "WEBHOOK_CONFLICT",
              "Conflicting insurance webhook replay rejected.",
            );
          }
          return existing;
        }
      }
      throw error;
    }
  }

  async completeWebhookEvent(
    eventId: string,
    status: "PROCESSED" | "IGNORED" | "REJECTED",
    failureCode?: string,
  ) {
    await this.prisma.insuranceWebhookEvent.update({
      where: { id: eventId },
      data: {
        processing_status: status,
        processed_at: new Date(),
        failure_code: failureCode,
      },
    });
  }

  async updatePolicyStatusByExternalId(
    partnerKey: string,
    externalPolicyId: string,
    status: InsurancePolicy["status"],
    occurredAt: Date,
  ) {
    const result = await this.prisma.insurancePolicy.updateMany({
      where: {
        partner: { adapter_key: partnerKey },
        external_policy_id: externalPolicyId,
      },
      data: {
        status,
        cancelled_at: status === "CANCELLED" ? occurredAt : undefined,
      },
    });
    return result.count === 1;
  }

  private isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}
