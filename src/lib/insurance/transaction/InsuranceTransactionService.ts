import type { InsuranceDomainService } from "../InsuranceDomainService";
import type {
  InsuranceKillSwitch,
  InsuranceRuntimeConfig,
} from "../types";
import { InsuranceDomainError } from "../types";
import { insuranceDigest, stableRequestHash } from "./idempotency";
import type { InsuranceTransactionRepository } from "./repository";
import type {
  InsuranceCheckoutAvailability,
  InsuranceIssuanceResult,
  InsuranceOrderRecord,
  InsurancePaymentDependency,
  InsuranceSelectionCommand,
  InsuranceSelectionRecord,
  InsuranceTransactionAuditEvent,
  InsuranceTransactionAuditSink,
  InsuranceWebhookCommand,
  InsuranceWebhookResult,
  TransactionEligibilityResult,
  TransactionInsuranceOffer,
} from "./types";
import { InsuranceTransactionError } from "./types";

const WEBHOOK_REPLAY_WINDOW_MS = 5 * 60 * 1000;

export class InsuranceTransactionService {
  constructor(
    private readonly domain: InsuranceDomainService,
    private readonly repository: InsuranceTransactionRepository,
    private readonly paymentDependency: InsurancePaymentDependency,
    private readonly auditSink: InsuranceTransactionAuditSink,
    private readonly config: InsuranceRuntimeConfig,
    private readonly killSwitch: InsuranceKillSwitch,
    private readonly now: () => Date = () => new Date(),
    private readonly claimService?: {
      processWebhookStatusUpdate(
        externalClaimId: string,
        newStatus: string,
        bookingId?: string,
      ): Promise<void>;
    }
  ) {}

  async prepareCheckout(
    context: InsuranceSelectionCommand["eligibilityContext"],
  ): Promise<InsuranceCheckoutAvailability> {
    this.validateEligibilityContext(context);
    try {
      const decision = await this.domain.checkEligibility(context);
      const eligibility: TransactionEligibilityResult = {
        status: decision.eligible ? "ELIGIBLE" : "INELIGIBLE",
        reasonCodes: decision.reasonCodes,
        assessedAt: decision.assessedAt,
      };
      await this.recordAudit({
        action: "INSURANCE_ELIGIBILITY_CHECKED",
        targetId: context.bookingId,
        actorUserId: context.userId,
        bookingId: context.bookingId,
        safeMetadata: {
          status: eligibility.status,
          reasonCodes: eligibility.reasonCodes.join(","),
        },
        occurredAt: this.now(),
      });

      if (!decision.eligible) {
        return { status: "UNAVAILABLE", eligibility, offers: [], optional: true };
      }

      const response = await this.domain.getOffers(context);
      const offers = response.offers.map((offer) => this.normalizeOffer(offer));
      for (const offer of offers) {
        await this.recordAudit({
          action: "INSURANCE_OFFER_PRESENTED",
          targetId: offer.offerId,
          actorUserId: context.userId,
          bookingId: context.bookingId,
          safeMetadata: {
            productCode: offer.productCode,
            currency: offer.currency,
            premiumMinor: String(offer.premiumMinor),
            disclosureVersion: offer.disclosureVersion,
            mock: String(offer.mock),
          },
          occurredAt: this.now(),
        });
      }
      return {
        status: offers.length > 0 ? "AVAILABLE" : "UNAVAILABLE",
        eligibility,
        offers,
        optional: true,
      };
    } catch (error) {
      if (error instanceof InsuranceDomainError) {
        return {
          status: "UNAVAILABLE",
          eligibility: {
            status: "TEMPORARILY_UNAVAILABLE",
            reasonCodes: [error.code],
            assessedAt: this.now(),
          },
          offers: [],
          optional: true,
        };
      }
      throw error;
    }
  }

  async selectOffer(
    command: InsuranceSelectionCommand,
  ): Promise<InsuranceSelectionRecord> {
    if (
      command.consent.accepted !== true ||
      !command.consent.disclosureVersion.trim()
    ) {
      throw new InsuranceTransactionError(
        "AFFIRMATIVE_CONSENT_REQUIRED",
        "Affirmative insurance consent is required.",
      );
    }
    if (
      command.userId !== command.eligibilityContext.userId ||
      command.bookingId !== command.eligibilityContext.bookingId
    ) {
      throw new InsuranceTransactionError(
        "INVALID_REQUEST",
        "Insurance transaction scope is invalid.",
      );
    }

    const checkout = await this.prepareCheckout(command.eligibilityContext);
    const offer = checkout.offers.find((candidate) => candidate.offerId === command.offerId);
    if (!offer) {
      throw new InsuranceTransactionError(
        "OFFER_NOT_FOUND",
        "The selected insurance offer is unavailable.",
      );
    }
    if (offer.expiresAt.getTime() <= this.now().getTime()) {
      throw new InsuranceTransactionError(
        "OFFER_EXPIRED",
        "The selected insurance offer has expired.",
      );
    }
    if (
      command.consent.disclosureVersion !== offer.disclosureVersion ||
      command.consent.premiumPresentedMinor !== offer.premiumMinor ||
      command.consent.currency.toUpperCase() !== offer.currency
    ) {
      throw new InsuranceTransactionError(
        "OFFER_MISMATCH",
        "The consent evidence does not match the selected offer.",
      );
    }

    const idempotencyKey = insuranceDigest("INSURANCE_SELECTION_V1", [
      command.userId,
      command.bookingId,
      command.requestId,
    ]);
    const requestHash = stableRequestHash({
      userId: command.userId,
      bookingId: command.bookingId,
      offerId: offer.offerId,
      disclosureVersion: offer.disclosureVersion,
      premiumMinor: offer.premiumMinor,
      currency: offer.currency,
    });
    const existing =
      (await this.repository.findSelectionByIdempotencyKey(idempotencyKey)) ??
      (await this.repository.findSelectionByBookingId(command.bookingId));
    if (existing) {
      this.assertSameRequest(existing.requestHash, requestHash);
      return existing;
    }

    const selection = await this.repository.createSelection({
      bookingId: command.bookingId,
      userId: command.userId,
      offerId: offer.offerId,
      partnerKey: offer.partnerKey,
      productCode: offer.productCode,
      disclosureVersion: offer.disclosureVersion,
      premiumMinor: offer.premiumMinor,
      currency: offer.currency,
      coverageStart: offer.coverageStart,
      coverageEnd: offer.coverageEnd,
      offerExpiresAt: offer.expiresAt,
      consentedAt: command.consent.consentedAt,
      idempotencyKey,
      requestHash,
      status: "SELECTED",
    });
    await this.recordAudit({
      action: "INSURANCE_SELECTED",
      targetId: selection.id,
      actorUserId: command.userId,
      bookingId: command.bookingId,
      safeMetadata: { offerId: offer.offerId, productCode: offer.productCode },
      occurredAt: this.now(),
    });
    await this.recordAudit({
      action: "INSURANCE_CONSENT_RECORDED",
      targetId: selection.id,
      actorUserId: command.userId,
      bookingId: command.bookingId,
      safeMetadata: {
        disclosureVersion: offer.disclosureVersion,
        currency: offer.currency,
        premiumMinor: String(offer.premiumMinor),
      },
      occurredAt: command.consent.consentedAt,
    });
    return selection;
  }

  async createOrder(
    selectionId: string,
    userId: string,
    requestId: string,
  ): Promise<InsuranceOrderRecord> {
    const selection = await this.requireOwnedSelection(selectionId, userId);
    const idempotencyKey = insuranceDigest("INSURANCE_ORDER_V1", [
      userId,
      selection.bookingId,
      requestId,
    ]);
    const requestHash = stableRequestHash({
      selectionId,
      userId,
      bookingId: selection.bookingId,
    });
    const existing =
      (await this.repository.findOrderByIdempotencyKey(idempotencyKey)) ??
      (await this.repository.findOrderBySelectionId(selectionId));
    if (existing) {
      this.assertSameRequest(existing.requestHash, requestHash);
      return existing;
    }

    const payment = await this.paymentDependency.check({
      bookingId: selection.bookingId,
      userId,
      expectedPremium: {
        amountMinor: selection.premiumMinor,
        currency: selection.currency,
      },
    });
    const status =
      payment.status === "AUTHORIZED" || payment.status === "SETTLED"
        ? "READY_FOR_ISSUANCE"
        : payment.status === "FAILED"
          ? "FAILED"
          : "PENDING_PAYMENT_DEPENDENCY";
    const order = await this.repository.createOrder({
      selectionId,
      bookingId: selection.bookingId,
      userId,
      idempotencyKey,
      requestHash,
      status,
      paymentDependencyStatus: payment.status,
      paymentReference: payment.paymentReference,
      failureCode:
        payment.status === "FAILED" ? "PAYMENT_DEPENDENCY_FAILED" : undefined,
    });
    await this.recordAudit({
      action: "INSURANCE_ORDER_CREATED",
      targetId: order.id,
      actorUserId: userId,
      bookingId: order.bookingId,
      safeMetadata: {
        status: order.status,
        paymentDependencyStatus: order.paymentDependencyStatus,
      },
      occurredAt: this.now(),
    });
    return order;
  }

  async requestIssuance(
    orderId: string,
    userId: string,
    requestId: string,
  ): Promise<InsuranceIssuanceResult> {
    const order = await this.requireOwnedOrder(orderId, userId);
    const selection = await this.requireOwnedSelection(order.selectionId, userId);
    const idempotencyKey = insuranceDigest("INSURANCE_ISSUANCE_V1", [
      userId,
      order.bookingId,
      requestId,
    ]);
    const requestHash = stableRequestHash({
      orderId,
      selectionId: selection.id,
      premiumMinor: selection.premiumMinor,
      currency: selection.currency,
    });

    if (order.issuanceIdempotencyKey) {
      if (
        order.issuanceIdempotencyKey !== idempotencyKey ||
        order.issuanceRequestHash !== requestHash
      ) {
        throw new InsuranceTransactionError(
          "IDEMPOTENCY_CONFLICT",
          "Conflicting insurance issuance replay rejected.",
        );
      }
      if (order.status === "ISSUED") {
        return {
          order,
          policy: (await this.repository.findPolicyByOrderId(order.id)) ?? undefined,
        };
      }
    }

    const payment = await this.paymentDependency.check({
      bookingId: order.bookingId,
      userId,
      expectedPremium: {
        amountMinor: selection.premiumMinor,
        currency: selection.currency,
      },
    });
    if (payment.status === "PENDING") {
      return {
        order: await this.repository.updateOrder(order.id, {
          status: "PENDING_PAYMENT_DEPENDENCY",
          paymentDependencyStatus: "PENDING",
        }),
      };
    }
    if (
      payment.status === "FAILED" ||
      !payment.authorizedAmount ||
      payment.authorizedAmount.amountMinor !== selection.premiumMinor ||
      payment.authorizedAmount.currency.toUpperCase() !== selection.currency
    ) {
      const failed = await this.repository.updateOrder(order.id, {
        status: "FAILED",
        paymentDependencyStatus: payment.status,
        paymentReference: payment.paymentReference,
        failureCode: "PAYMENT_DEPENDENCY_FAILED",
      });
      await this.recordPolicyFailure(failed, userId, "PAYMENT_DEPENDENCY_FAILED");
      return { order: failed };
    }

    await this.repository.updateOrder(order.id, {
      status: "READY_FOR_ISSUANCE",
      paymentDependencyStatus: payment.status,
      paymentReference: payment.paymentReference,
    });
    const pending = await this.repository.updateOrder(order.id, {
      status: "ISSUANCE_PENDING",
      issuanceIdempotencyKey: idempotencyKey,
      issuanceRequestHash: requestHash,
    });
    await this.recordAudit({
      action: "INSURANCE_ISSUANCE_REQUESTED",
      targetId: pending.id,
      actorUserId: userId,
      bookingId: pending.bookingId,
      safeMetadata: { adapterId: selection.partnerKey },
      occurredAt: this.now(),
    });

    try {
      const response = await this.domain.createOrder(
        {
          requestId: idempotencyKey,
          userId,
          bookingId: selection.bookingId,
          offerId: selection.offerId,
          consent: {
            accepted: true,
            wordingVersion: selection.disclosureVersion,
            acceptedAt: selection.consentedAt,
          },
        },
        {
          mode: selection.partnerKey === "mock" ? "MOCK" : "DEFERRED",
          paymentReference: payment.paymentReference,
          authorizedAmount: payment.authorizedAmount,
        },
      );
      if (response.status !== "ISSUED" || !response.policy) {
        const failed = await this.repository.updateOrder(order.id, {
          status: "FAILED",
          externalOrderId: response.orderId,
          failureCode: "ISSUANCE_FAILED",
        });
        await this.recordPolicyFailure(failed, userId, "ISSUANCE_FAILED");
        return { order: failed };
      }
      const policy = await this.repository.persistIssuedPolicy({
        order: pending,
        selection,
        policy: response.policy,
        idempotencyKey,
      });
      const issued = await this.repository.updateOrder(order.id, {
        status: "ISSUED",
        externalOrderId: response.orderId,
      });
      await this.recordAudit({
        action: "INSURANCE_POLICY_ISSUED",
        targetId: policy.policyId,
        actorUserId: userId,
        bookingId: order.bookingId,
        safeMetadata: { adapterId: selection.partnerKey, status: policy.status },
        occurredAt: this.now(),
      });
      return { order: issued, policy };
    } catch (error) {
      const failed = await this.repository.updateOrder(order.id, {
        status: "FAILED",
        failureCode: "ISSUANCE_FAILED",
      });
      await this.recordPolicyFailure(failed, userId, "ISSUANCE_FAILED");
      if (error instanceof InsuranceDomainError) {
        return { order: failed };
      }
      throw error;
    }
  }

  async processWebhook(
    command: InsuranceWebhookCommand,
  ): Promise<InsuranceWebhookResult> {
    if (command.partnerKey !== this.config.adapterId) {
      await this.recordWebhookRejected(
        command.partnerKey || "missing-partner",
        "PARTNER_MISMATCH",
      );
      return { status: "REJECTED", safeCode: "PARTNER_MISMATCH" };
    }
    if (await this.killSwitch.isActive()) {
      await this.recordWebhookRejected("kill-switch", "KILL_SWITCH_ACTIVE");
      return { status: "REJECTED", safeCode: "KILL_SWITCH_ACTIVE" };
    }
    const verification = await this.domain.verifyWebhook(
      command.headers,
      command.body,
    );
    if (
      !verification.valid ||
      !verification.externalEventId ||
      !verification.eventType ||
      !verification.occurredAt ||
      !verification.bodyHash
    ) {
      await this.recordWebhookRejected("unverified", "VERIFICATION_FAILED");
      return { status: "REJECTED", safeCode: "VERIFICATION_FAILED" };
    }
    if (
      Math.abs(
        command.receivedAt.getTime() - verification.occurredAt.getTime(),
      ) > WEBHOOK_REPLAY_WINDOW_MS
    ) {
      await this.recordWebhookRejected(
        verification.externalEventId,
        "REPLAY_WINDOW_EXCEEDED",
      );
      return {
        status: "REJECTED",
        externalEventId: verification.externalEventId,
        safeCode: "REPLAY_WINDOW_EXCEEDED",
      };
    }

    const existing = await this.repository.findWebhookEvent(
      command.partnerKey,
      verification.externalEventId,
    );
    if (existing) {
      if (existing.bodyHash !== verification.bodyHash) {
        throw new InsuranceTransactionError(
          "WEBHOOK_CONFLICT",
          "Conflicting insurance webhook replay rejected.",
        );
      }
      return {
        status: "DUPLICATE",
        externalEventId: verification.externalEventId,
      };
    }

    const event = await this.repository.createWebhookEvent({
      partnerKey: command.partnerKey,
      externalEventId: verification.externalEventId,
      eventType: verification.eventType,
      bodyHash: verification.bodyHash,
      occurredAt: verification.occurredAt,
      receivedAt: command.receivedAt,
    });
    if (!event.created) {
      return {
        status: "DUPLICATE",
        externalEventId: verification.externalEventId,
      };
    }
    const knownPolicyEvent = [
      "policy.issued",
      "policy.status_changed",
      "policy.cancelled",
      "policy.expired",
      "policy.failed",
    ].includes(verification.eventType);

    const knownClaimEvent = [
      "claim.received",
      "claim.under_review",
      "claim.more_information_required",
      "claim.approved",
      "claim.partially_approved",
      "claim.denied",
      "claim.paid",
      "claim.closed",
    ].includes(verification.eventType);

    const knownEvent = knownPolicyEvent || knownClaimEvent;

    let updated = false;
    if (
      knownPolicyEvent &&
      verification.externalPolicyId &&
      verification.policyStatus
    ) {
      updated = await this.repository.updatePolicyStatusByExternalId(
        command.partnerKey,
        verification.externalPolicyId,
        verification.policyStatus,
        verification.occurredAt,
      );
    } else if (
      knownClaimEvent &&
      verification.externalClaimId &&
      verification.claimStatus &&
      this.claimService
    ) {
      await this.claimService.processWebhookStatusUpdate(
        verification.externalClaimId,
        verification.claimStatus
      );
      updated = true;
    }

    const status = knownEvent && updated ? "PROCESSED" : "IGNORED";
    await this.repository.completeWebhookEvent(event.id, status);
    await this.recordAudit({
      action: "INSURANCE_WEBHOOK_RECEIVED",
      targetId: event.id,
      safeMetadata: {
        partnerKey: command.partnerKey,
        eventType: verification.eventType,
        processingStatus: status,
      },
      occurredAt: command.receivedAt,
    });
    return {
      status,
      externalEventId: verification.externalEventId,
      safeCode: status === "IGNORED" ? "UNKNOWN_OR_UNMATCHED_EVENT" : undefined,
    };
  }

  private normalizeOffer(
    offer: Awaited<ReturnType<InsuranceDomainService["getOffers"]>>["offers"][number],
  ): TransactionInsuranceOffer {
    if (
      !Number.isSafeInteger(offer.premium.amountMinor) ||
      offer.premium.amountMinor < 0 ||
      !/^[A-Za-z]{3}$/.test(offer.premium.currency)
    ) {
      throw new InsuranceTransactionError(
        "INVALID_REQUEST",
        "Insurance offer money is invalid.",
      );
    }
    return {
      offerId: offer.offerId,
      partnerKey: this.config.adapterId,
      productCode: offer.productCode,
      currency: offer.premium.currency.toUpperCase(),
      premiumMinor: offer.premium.amountMinor,
      coverageReference: offer.termsReference,
      coverageStart: offer.coverageStart,
      coverageEnd: offer.coverageEnd,
      expiresAt: offer.expiresAt,
      disclosureVersion: offer.termsReference,
      status: "AVAILABLE",
      mock: this.config.adapterId === "mock",
    };
  }

  private async requireOwnedSelection(
    selectionId: string,
    userId: string,
  ): Promise<InsuranceSelectionRecord> {
    const selection = await this.repository.findSelectionById(selectionId);
    if (!selection) {
      throw new InsuranceTransactionError(
        "SELECTION_NOT_FOUND",
        "Insurance selection was not found.",
      );
    }
    if (selection.userId !== userId) {
      throw new InsuranceTransactionError(
        "ORDER_OWNERSHIP_MISMATCH",
        "Insurance transaction access denied.",
      );
    }
    return selection;
  }

  private validateEligibilityContext(
    context: InsuranceSelectionCommand["eligibilityContext"],
  ): void {
    if (
      !context.userId.trim() ||
      !context.bookingId.trim() ||
      !context.listingId.trim() ||
      !Number.isSafeInteger(context.rentalValue.amountMinor) ||
      context.rentalValue.amountMinor < 0 ||
      !/^[A-Za-z]{3}$/.test(context.rentalValue.currency) ||
      !Number.isFinite(context.rentalStart.getTime()) ||
      !Number.isFinite(context.rentalEnd.getTime()) ||
      context.rentalEnd.getTime() <= context.rentalStart.getTime()
    ) {
      throw new InsuranceTransactionError(
        "INVALID_REQUEST",
        "Insurance eligibility context is invalid.",
      );
    }
  }

  private async requireOwnedOrder(
    orderId: string,
    userId: string,
  ): Promise<InsuranceOrderRecord> {
    const order = await this.repository.findOrderById(orderId);
    if (!order) {
      throw new InsuranceTransactionError(
        "ORDER_NOT_FOUND",
        "Insurance order was not found.",
      );
    }
    if (order.userId !== userId) {
      throw new InsuranceTransactionError(
        "ORDER_OWNERSHIP_MISMATCH",
        "Insurance transaction access denied.",
      );
    }
    return order;
  }

  private assertSameRequest(existingHash: string, requestHash: string): void {
    if (existingHash !== requestHash) {
      throw new InsuranceTransactionError(
        "IDEMPOTENCY_CONFLICT",
        "Conflicting insurance request replay rejected.",
      );
    }
  }

  private async recordPolicyFailure(
    order: InsuranceOrderRecord,
    userId: string,
    failureCode: string,
  ): Promise<void> {
    await this.recordAudit({
      action: "INSURANCE_POLICY_FAILED",
      targetId: order.id,
      actorUserId: userId,
      bookingId: order.bookingId,
      safeMetadata: { failureCode },
      occurredAt: this.now(),
    });
  }

  private async recordWebhookRejected(
    targetId: string,
    safeCode: string,
  ): Promise<void> {
    await this.recordAudit({
      action: "INSURANCE_WEBHOOK_REJECTED",
      targetId,
      safeMetadata: { safeCode },
      occurredAt: this.now(),
    });
  }

  private async recordAudit(event: InsuranceTransactionAuditEvent): Promise<void> {
    await this.auditSink.record(event);
  }
}
