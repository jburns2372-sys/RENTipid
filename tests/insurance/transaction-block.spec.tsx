/** @jest-environment jsdom */

import { act, render, screen } from "@testing-library/react";
import { InsuranceCheckoutOption } from "@/app/checkout/[bookingId]/InsuranceCheckoutOption";
import { ConfigInsuranceKillSwitch } from "@/lib/insurance/InsuranceConfig";
import { InsuranceDomainService } from "@/lib/insurance/InsuranceDomainService";
import { PartnerAdapterRegistry } from "@/lib/insurance/PartnerAdapterRegistry";
import {
  MockInsuranceAdapter,
  type MockInsuranceScenario,
} from "@/lib/insurance/adapters/MockInsuranceAdapter";
import { InsuranceTransactionService } from "@/lib/insurance/transaction/InsuranceTransactionService";
import {
  DeferredInsurancePaymentDependency,
  FixtureInsurancePaymentDependency,
} from "@/lib/insurance/transaction/payment-dependency";
import type {
  InsuranceTransactionRepository,
  InsuranceWebhookEventRecord,
  NewInsuranceOrder,
  NewInsuranceSelection,
  NewInsuranceWebhookEvent,
  PersistIssuedPolicyInput,
} from "@/lib/insurance/transaction/repository";
import type {
  InsuranceOrderRecord,
  InsuranceSelectionRecord,
  InsuranceTransactionAuditEvent,
  InsuranceTransactionAuditSink,
} from "@/lib/insurance/transaction/types";
import type { InsurancePolicy, InsuranceRuntimeConfig } from "@/lib/insurance/types";

const fixedNow = new Date("2026-01-01T00:00:00.000Z");

function runtimeConfig(
  overrides: Partial<InsuranceRuntimeConfig> = {},
): InsuranceRuntimeConfig {
  return {
    enabled: true,
    liveIssuanceEnabled: false,
    killSwitchEnabled: false,
    mockEnabled: true,
    adapterId: "mock",
    ...overrides,
  };
}

function eligibilityContext(bookingId = "booking-1") {
  return {
    requestId: `eligibility-${bookingId}`,
    userId: "user-1",
    bookingId,
    listingId: "listing-1",
    listingCategory: "Equipment",
    rentalValue: { amountMinor: 100_000, currency: "PHP" },
    rentalStart: new Date("2026-02-01T00:00:00.000Z"),
    rentalEnd: new Date("2026-02-03T00:00:00.000Z"),
  };
}

class MemoryAuditSink implements InsuranceTransactionAuditSink {
  readonly events: InsuranceTransactionAuditEvent[] = [];

  async record(event: InsuranceTransactionAuditEvent) {
    this.events.push(event);
  }
}

class MemoryRepository implements InsuranceTransactionRepository {
  readonly selections = new Map<string, InsuranceSelectionRecord>();
  readonly orders = new Map<string, InsuranceOrderRecord>();
  readonly policies = new Map<string, InsurancePolicy>();
  readonly webhooks = new Map<string, InsuranceWebhookEventRecord>();

  async findSelectionByIdempotencyKey(key: string) {
    return [...this.selections.values()].find((row) => row.idempotencyKey === key) ?? null;
  }

  async findSelectionByBookingId(bookingId: string) {
    return [...this.selections.values()].find((row) => row.bookingId === bookingId) ?? null;
  }

  async findSelectionById(id: string) {
    return this.selections.get(id) ?? null;
  }

  async createSelection(input: NewInsuranceSelection) {
    const row: InsuranceSelectionRecord = {
      ...input,
      id: `selection-${this.selections.size + 1}`,
      createdAt: fixedNow,
    };
    this.selections.set(row.id, row);
    return row;
  }

  async findOrderByIdempotencyKey(key: string) {
    return [...this.orders.values()].find((row) => row.idempotencyKey === key) ?? null;
  }

  async findOrderBySelectionId(selectionId: string) {
    return [...this.orders.values()].find((row) => row.selectionId === selectionId) ?? null;
  }

  async findOrderById(id: string) {
    return this.orders.get(id) ?? null;
  }

  async createOrder(input: NewInsuranceOrder) {
    const row: InsuranceOrderRecord = {
      ...input,
      id: `order-${this.orders.size + 1}`,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    this.orders.set(row.id, row);
    return row;
  }

  async updateOrder(
    id: string,
    update: Parameters<InsuranceTransactionRepository["updateOrder"]>[1],
  ) {
    const existing = this.orders.get(id);
    if (!existing) throw new Error("Missing test order");
    const row = { ...existing, ...update, updatedAt: fixedNow };
    this.orders.set(id, row);
    return row;
  }

  async persistIssuedPolicy(input: PersistIssuedPolicyInput) {
    const existing = this.policies.get(input.order.id);
    if (existing) return existing;
    this.policies.set(input.order.id, input.policy);
    return input.policy;
  }

  async findPolicyByOrderId(orderId: string) {
    return this.policies.get(orderId) ?? null;
  }

  async findWebhookEvent(partnerKey: string, externalEventId: string) {
    return this.webhooks.get(`${partnerKey}:${externalEventId}`) ?? null;
  }

  async createWebhookEvent(input: NewInsuranceWebhookEvent) {
    const row: InsuranceWebhookEventRecord = {
      ...input,
      id: `webhook-${this.webhooks.size + 1}`,
      created: true,
      processingStatus: "PENDING",
    };
    this.webhooks.set(`${input.partnerKey}:${input.externalEventId}`, row);
    return row;
  }

  async completeWebhookEvent(
    eventId: string,
    status: "PROCESSED" | "IGNORED" | "REJECTED",
  ) {
    for (const [key, row] of this.webhooks) {
      if (row.id === eventId) {
        this.webhooks.set(key, { ...row, processingStatus: status });
      }
    }
  }

  async updatePolicyStatusByExternalId(
    _partnerKey: string,
    externalPolicyId: string,
    status: InsurancePolicy["status"],
    occurredAt: Date,
  ) {
    for (const [key, policy] of this.policies) {
      if (policy.externalPolicyId === externalPolicyId) {
        this.policies.set(key, {
          ...policy,
          status,
          cancelledAt: status === "CANCELLED" ? occurredAt : policy.cancelledAt,
        });
        return true;
      }
    }
    return false;
  }
}

function createService(options: {
  scenarios?: Readonly<Record<string, MockInsuranceScenario>>;
  config?: InsuranceRuntimeConfig;
  repository?: MemoryRepository;
  audit?: MemoryAuditSink;
  payment?: DeferredInsurancePaymentDependency | FixtureInsurancePaymentDependency;
} = {}) {
  const config = options.config ?? runtimeConfig();
  const repository = options.repository ?? new MemoryRepository();
  const audit = options.audit ?? new MemoryAuditSink();
  const adapter = new MockInsuranceAdapter({
    scenarioByBookingId: options.scenarios,
    now: () => new Date(fixedNow),
  });
  const domain = new InsuranceDomainService(
    new PartnerAdapterRegistry([adapter]),
    config,
    new ConfigInsuranceKillSwitch(config),
    { async record() {} },
  );
  return {
    repository,
    audit,
    transaction: new InsuranceTransactionService(
      domain,
      repository,
      options.payment ?? new DeferredInsurancePaymentDependency(),
      audit,
      config,
      new ConfigInsuranceKillSwitch(config),
      () => new Date(fixedNow),
    ),
  };
}

async function select(
  transaction: InsuranceTransactionService,
  requestId = "checkout-1",
) {
  const availability = await transaction.prepareCheckout(eligibilityContext());
  const offer = availability.offers[0];
  return transaction.selectOffer({
    requestId,
    userId: "user-1",
    bookingId: "booking-1",
    eligibilityContext: eligibilityContext(),
    offerId: offer.offerId,
    consent: {
      accepted: true,
      disclosureVersion: offer.disclosureVersion,
      consentedAt: fixedNow,
      premiumPresentedMinor: offer.premiumMinor,
      currency: offer.currency,
    },
  });
}

describe("Insurance Transaction Block", () => {
  afterEach(() => jest.restoreAllMocks());

  test("eligibility and offers are normalized, deterministic, exact-money, and optional", async () => {
    const { transaction } = createService();
    const first = await transaction.prepareCheckout(eligibilityContext());
    const second = await transaction.prepareCheckout(eligibilityContext());
    expect(second).toEqual(first);
    expect(first).toEqual(
      expect.objectContaining({
        status: "AVAILABLE",
        optional: true,
        eligibility: expect.objectContaining({ status: "ELIGIBLE" }),
      }),
    );
    expect(first.offers[0]).toEqual(
      expect.objectContaining({
        currency: "PHP",
        premiumMinor: 1000,
        mock: true,
        disclosureVersion: "mock-terms-not-insurance-v1",
      }),
    );
    expect(Number.isSafeInteger(first.offers[0].premiumMinor)).toBe(true);
  });

  test.each([
    ["ineligible", "INELIGIBLE"],
    ["no-offer", "ELIGIBLE"],
    ["unavailable", "TEMPORARILY_UNAVAILABLE"],
  ] as const)("%s remains an optional unavailable checkout path", async (scenario, status) => {
    const { transaction } = createService({ scenarios: { "booking-1": scenario } });
    await expect(transaction.prepareCheckout(eligibilityContext())).resolves.toEqual(
      expect.objectContaining({
        status: "UNAVAILABLE",
        optional: true,
        eligibility: expect.objectContaining({ status }),
        offers: [],
      }),
    );
  });

  test("invalid money and rental periods fail closed", async () => {
    const { transaction } = createService();
    await expect(
      transaction.prepareCheckout({
        ...eligibilityContext(),
        rentalValue: { amountMinor: 10.5, currency: "PHP" },
      }),
    ).rejects.toEqual(expect.objectContaining({ code: "INVALID_REQUEST" }));
  });

  test("affirmative consent is bound to the presented offer", async () => {
    const { transaction } = createService();
    const availability = await transaction.prepareCheckout(eligibilityContext());
    const offer = availability.offers[0];
    await expect(
      transaction.selectOffer({
        requestId: "checkout-1",
        userId: "user-1",
        bookingId: "booking-1",
        eligibilityContext: eligibilityContext(),
        offerId: offer.offerId,
        consent: {
          accepted: true,
          disclosureVersion: offer.disclosureVersion,
          consentedAt: fixedNow,
          premiumPresentedMinor: offer.premiumMinor + 1,
          currency: offer.currency,
        },
      }),
    ).rejects.toEqual(expect.objectContaining({ code: "OFFER_MISMATCH" }));
  });

  test("selection and order creation are idempotent with payment deferred", async () => {
    const { transaction, repository } = createService();
    const firstSelection = await select(transaction);
    const replaySelection = await select(transaction);
    expect(replaySelection.id).toBe(firstSelection.id);
    expect(repository.selections.size).toBe(1);
    const firstOrder = await transaction.createOrder(firstSelection.id, "user-1", "order-1");
    const replayOrder = await transaction.createOrder(firstSelection.id, "user-1", "order-1");
    expect(replayOrder.id).toBe(firstOrder.id);
    expect(firstOrder.status).toBe("PENDING_PAYMENT_DEPENDENCY");
    expect(repository.orders.size).toBe(1);
  });

  test("authorized Mock issuance creates one policy and identical replay returns it", async () => {
    const payment = new FixtureInsurancePaymentDependency({
      status: "AUTHORIZED",
      paymentReference: "fixture-payment-not-real",
      authorizedAmount: { amountMinor: 1000, currency: "PHP" },
    });
    const { transaction, repository, audit } = createService({ payment });
    const selection = await select(transaction);
    const order = await transaction.createOrder(selection.id, "user-1", "order-1");
    const first = await transaction.requestIssuance(order.id, "user-1", "issue-1");
    const replay = await transaction.requestIssuance(order.id, "user-1", "issue-1");
    expect(first.order.status).toBe("ISSUED");
    expect(replay.policy).toEqual(first.policy);
    expect(repository.policies.size).toBe(1);
    expect(audit.events.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "INSURANCE_CONSENT_RECORDED",
        "INSURANCE_ORDER_CREATED",
        "INSURANCE_ISSUANCE_REQUESTED",
        "INSURANCE_POLICY_ISSUED",
      ]),
    );
    await expect(
      transaction.requestIssuance(order.id, "user-1", "different-request"),
    ).rejects.toEqual(expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT" }));
  });

  test("incorrect authorized payment amount produces a safe failed order", async () => {
    const payment = new FixtureInsurancePaymentDependency({
      status: "AUTHORIZED",
      paymentReference: "fixture-payment-not-real",
      authorizedAmount: { amountMinor: 999, currency: "PHP" },
    });
    const { transaction } = createService({ payment });
    const selection = await select(transaction);
    const order = await transaction.createOrder(selection.id, "user-1", "order-1");
    await expect(transaction.requestIssuance(order.id, "user-1", "issue-1")).resolves.toEqual(
      expect.objectContaining({ order: expect.objectContaining({ status: "FAILED" }) }),
    );
  });

  test("ownership boundaries reject cross-user order access", async () => {
    const { transaction } = createService();
    const selection = await select(transaction);
    await expect(transaction.createOrder(selection.id, "user-2", "order-1")).rejects.toEqual(
      expect.objectContaining({ code: "ORDER_OWNERSHIP_MISMATCH" }),
    );
  });

  test("kill switch blocks checkout and webhooks before adapter side effects", async () => {
    const { transaction, repository } = createService({
      config: runtimeConfig({ killSwitchEnabled: true }),
    });
    await expect(transaction.prepareCheckout(eligibilityContext())).resolves.toEqual(
      expect.objectContaining({ status: "UNAVAILABLE" }),
    );
    await expect(
      transaction.processWebhook({
        partnerKey: "mock",
        headers: { "x-mock-insurance-signature": "mock-signature-valid" },
        body: { eventId: "event-1", eventType: "policy.issued" },
        receivedAt: fixedNow,
      }),
    ).resolves.toEqual({ status: "REJECTED", safeCode: "KILL_SWITCH_ACTIVE" });
    expect(repository.webhooks.size).toBe(0);
  });

  test("webhooks verify identity/signature, deduplicate, reject conflict, and ignore unknown events", async () => {
    const { transaction, repository } = createService();
    const command = {
      partnerKey: "mock",
      headers: { "x-mock-insurance-signature": "mock-signature-valid" },
      body: { eventId: "event-1", eventType: "future.unknown" },
      receivedAt: fixedNow,
    } as const;
    await expect(transaction.processWebhook(command)).resolves.toEqual({
      status: "IGNORED",
      externalEventId: "event-1",
      safeCode: "UNKNOWN_OR_UNMATCHED_EVENT",
    });
    await expect(transaction.processWebhook(command)).resolves.toEqual({
      status: "DUPLICATE",
      externalEventId: "event-1",
    });
    await expect(
      transaction.processWebhook({ ...command, partnerKey: "other" }),
    ).resolves.toEqual({ status: "REJECTED", safeCode: "PARTNER_MISMATCH" });
    await expect(
      transaction.processWebhook({
        ...command,
        body: { eventId: "event-1", eventType: "policy.issued" },
      }),
    ).rejects.toEqual(expect.objectContaining({ code: "WEBHOOK_CONFLICT" }));
    await expect(
      transaction.processWebhook({ ...command, body: { eventId: "event-2" }, headers: {} }),
    ).resolves.toEqual({ status: "REJECTED", safeCode: "VERIFICATION_FAILED" });
    expect(repository.webhooks.size).toBe(1);
  });

  test("webhook replay outside the accepted time window is rejected", async () => {
    const { transaction, repository } = createService();
    await expect(
      transaction.processWebhook({
        partnerKey: "mock",
        headers: { "x-mock-insurance-signature": "mock-signature-valid" },
        body: { eventId: "late-event", eventType: "policy.issued" },
        receivedAt: new Date(fixedNow.getTime() + 6 * 60 * 1000),
      }),
    ).resolves.toEqual(
      expect.objectContaining({ status: "REJECTED", safeCode: "REPLAY_WINDOW_EXCEEDED" }),
    );
    expect(repository.webhooks.size).toBe(0);
  });

  test("checkout UI is not preselected and requires separate affirmative consent", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "AVAILABLE",
        offers: [{
          offerId: "mock-offer-ui",
          productCode: "MOCK-FOUNDATION",
          currency: "PHP",
          premiumMinor: 1000,
          disclosureVersion: "mock-terms-not-insurance-v1",
          expiresAt: "2026-01-02T00:00:00.000Z",
          mock: true,
        }],
      }),
    } as Response);
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchMock,
      writable: true,
    });
    await act(async () => {
      render(<InsuranceCheckoutOption bookingId="booking-1" requestId="checkout-1" />);
    });
    const selection = await screen.findByRole("checkbox", { name: /add the non-live/i });
    expect((selection as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByRole("checkbox", { name: /affirmatively accept/i })).toBeNull();
  });
});
