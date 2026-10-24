import type { InsurancePolicy } from "../types";
import type {
  InsuranceOrderRecord,
  InsuranceOrderStatus,
  InsurancePaymentDependencyStatus,
  InsuranceSelectionRecord,
} from "./types";

export type NewInsuranceSelection = Omit<
  InsuranceSelectionRecord,
  "id" | "createdAt"
>;

export type NewInsuranceOrder = Omit<
  InsuranceOrderRecord,
  "id" | "createdAt" | "updatedAt"
>;

export interface NewInsuranceWebhookEvent {
  partnerKey: string;
  externalEventId: string;
  eventType: string;
  bodyHash: string;
  occurredAt: Date;
  receivedAt: Date;
}

export interface InsuranceWebhookEventRecord extends NewInsuranceWebhookEvent {
  id: string;
  created: boolean;
  processingStatus: "PENDING" | "PROCESSED" | "IGNORED" | "REJECTED";
}

export interface PersistIssuedPolicyInput {
  order: InsuranceOrderRecord;
  selection: InsuranceSelectionRecord;
  policy: InsurancePolicy;
  idempotencyKey: string;
}

export interface InsuranceTransactionRepository {
  findSelectionByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<InsuranceSelectionRecord | null>;
  findSelectionByBookingId(
    bookingId: string,
  ): Promise<InsuranceSelectionRecord | null>;
  createSelection(
    input: NewInsuranceSelection,
  ): Promise<InsuranceSelectionRecord>;
  findSelectionById(id: string): Promise<InsuranceSelectionRecord | null>;
  findOrderByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<InsuranceOrderRecord | null>;
  findOrderBySelectionId(
    selectionId: string,
  ): Promise<InsuranceOrderRecord | null>;
  findOrderById(id: string): Promise<InsuranceOrderRecord | null>;
  createOrder(input: NewInsuranceOrder): Promise<InsuranceOrderRecord>;
  updateOrder(
    orderId: string,
    update: {
      status?: InsuranceOrderStatus;
      paymentDependencyStatus?: InsurancePaymentDependencyStatus;
      paymentReference?: string;
      issuanceIdempotencyKey?: string;
      issuanceRequestHash?: string;
      externalOrderId?: string;
      failureCode?: string;
    },
  ): Promise<InsuranceOrderRecord>;
  persistIssuedPolicy(input: PersistIssuedPolicyInput): Promise<InsurancePolicy>;
  findPolicyByOrderId(orderId: string): Promise<InsurancePolicy | null>;
  findWebhookEvent(
    partnerKey: string,
    externalEventId: string,
  ): Promise<InsuranceWebhookEventRecord | null>;
  createWebhookEvent(
    input: NewInsuranceWebhookEvent,
  ): Promise<InsuranceWebhookEventRecord>;
  completeWebhookEvent(
    eventId: string,
    status: "PROCESSED" | "IGNORED" | "REJECTED",
    failureCode?: string,
  ): Promise<void>;
  updatePolicyStatusByExternalId(
    partnerKey: string,
    externalPolicyId: string,
    status: InsurancePolicy["status"],
    occurredAt: Date,
  ): Promise<boolean>;
}
