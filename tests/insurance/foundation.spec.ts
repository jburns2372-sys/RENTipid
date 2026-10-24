import {
  ConfigInsuranceKillSwitch,
  readInsuranceRuntimeConfig,
} from "@/lib/insurance/InsuranceConfig";
import { InsuranceDomainService } from "@/lib/insurance/InsuranceDomainService";
import type { PartnerAdapter } from "@/lib/insurance/PartnerAdapter";
import {
  InsuranceAdapterRegistryError,
  PartnerAdapterRegistry,
} from "@/lib/insurance/PartnerAdapterRegistry";
import {
  MockInsuranceAdapter,
  type MockInsuranceScenario,
} from "@/lib/insurance/adapters/MockInsuranceAdapter";
import {
  InsuranceDomainError,
  type InsuranceAuditRecord,
  type InsuranceAuditSink,
  type InsuranceEligibilityRequest,
  type InsuranceRuntimeConfig,
} from "@/lib/insurance/types";

const fixedNow = new Date("2026-01-01T00:00:00.000Z");

function eligibilityRequest(
  bookingId = "booking-eligible",
): InsuranceEligibilityRequest {
  return {
    requestId: `request-${bookingId}`,
    userId: "user-1",
    bookingId,
    listingId: "listing-1",
    listingCategory: "Equipment",
    rentalValue: { amountMinor: 100_000, currency: "php" },
    rentalStart: new Date("2026-02-01T00:00:00.000Z"),
    rentalEnd: new Date("2026-02-03T00:00:00.000Z"),
  };
}

function enabledMockConfig(
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

class MemoryAuditSink implements InsuranceAuditSink {
  readonly records: InsuranceAuditRecord[] = [];

  async record(event: InsuranceAuditRecord): Promise<void> {
    this.records.push(event);
  }
}

function serviceFor(
  scenarios: Readonly<Record<string, MockInsuranceScenario>> = {},
  config = enabledMockConfig(),
): InsuranceDomainService {
  const adapter = new MockInsuranceAdapter({
    scenarioByBookingId: scenarios,
    now: () => new Date(fixedNow),
  });
  return new InsuranceDomainService(
    new PartnerAdapterRegistry([adapter]),
    config,
    new ConfigInsuranceKillSwitch(config),
    new MemoryAuditSink(),
  );
}

describe("Insurance Technical Foundation Slice 1", () => {
  test("PartnerAdapter contract is satisfied by the Mock adapter", () => {
    const adapter: PartnerAdapter = new MockInsuranceAdapter();
    expect(adapter.id).toBe("mock");
    expect(adapter.getCapabilities()).toEqual(
      expect.objectContaining({
        CHECK_ELIGIBILITY: true,
        GET_OFFERS: true,
        CREATE_ORDER: true,
        VERIFY_WEBHOOK: true,
      }),
    );
  });

  test("registry deterministically resolves the explicitly registered Mock adapter", () => {
    const mock = new MockInsuranceAdapter();
    const registry = new PartnerAdapterRegistry([mock]);
    expect(registry.resolve(" MOCK ")).toBe(mock);
    expect(registry.registeredAdapterIds()).toEqual(["mock"]);
  });

  test("registry fails closed for unknown adapters", () => {
    const registry = new PartnerAdapterRegistry();
    expect(() => registry.resolve("unsupported")).toThrow(
      InsuranceAdapterRegistryError,
    );
  });

  test("duplicate registration is idempotent for the same instance and rejects replacement", () => {
    const first = new MockInsuranceAdapter();
    const registry = new PartnerAdapterRegistry([first]);
    expect(() => registry.register(first)).not.toThrow();
    expect(() => registry.register(new MockInsuranceAdapter())).toThrow(
      expect.objectContaining({ code: "DUPLICATE_ADAPTER" }),
    );
  });

  test("INS-TEST-001 returns deterministic eligible and ineligible decisions", async () => {
    const adapter = new MockInsuranceAdapter({
      scenarioByBookingId: { denied: "ineligible" },
      now: () => new Date(fixedNow),
    });
    await expect(adapter.checkEligibility(eligibilityRequest())).resolves.toEqual({
      eligible: true,
      reasonCodes: ["MOCK_ELIGIBLE"],
      assessedAt: fixedNow,
    });
    await expect(
      adapter.checkEligibility(eligibilityRequest("denied")),
    ).resolves.toEqual({
      eligible: false,
      reasonCodes: ["MOCK_NOT_ELIGIBLE"],
      assessedAt: fixedNow,
    });
  });

  test("INS-TEST-002 and INS-TEST-023 return stable offers without random values", async () => {
    const adapter = new MockInsuranceAdapter({ now: () => new Date(fixedNow) });
    const request = eligibilityRequest();
    const first = await adapter.getOffers(request);
    const second = await adapter.getOffers(request);
    expect(second).toEqual(first);
    expect(first.offers).toHaveLength(1);
    expect(first.offers[0]).toEqual(
      expect.objectContaining({
        offerId: expect.stringMatching(/^mock-offer-/),
        productCode: "MOCK-FOUNDATION",
        premium: { amountMinor: 1000, currency: "PHP" },
        termsReference: "mock-terms-not-insurance-v1",
      }),
    );
  });

  test("no-offer scenario returns a deterministic empty response", async () => {
    const adapter = new MockInsuranceAdapter({
      scenarioByBookingId: { "no-offer": "no-offer" },
      now: () => new Date(fixedNow),
    });
    await expect(
      adapter.getOffers(eligibilityRequest("no-offer")),
    ).resolves.toEqual({
      bookingId: "no-offer",
      offers: [],
      generatedAt: fixedNow,
    });
  });

  test.each(["unavailable", "timeout", "failure"] as const)(
    "INS-TEST-020/021 maps deterministic %s scenarios to safe domain errors",
    async (scenario) => {
      const service = serviceFor({ failed: scenario });
      await expect(
        service.getOffers(eligibilityRequest("failed")),
      ).rejects.toEqual(
        expect.objectContaining({
          name: "InsuranceDomainError",
          code:
            scenario === "failure"
              ? "INSURANCE_OPERATION_FAILED"
              : "INSURANCE_ADAPTER_UNAVAILABLE",
          message: "The insurance operation could not be completed.",
        }),
      );
    },
  );

  test("configuration defaults disable Insurance, live issuance, Mock, and activate the kill switch", () => {
    expect(readInsuranceRuntimeConfig({})).toEqual({
      enabled: false,
      liveIssuanceEnabled: false,
      killSwitchEnabled: true,
      mockEnabled: false,
      adapterId: "",
    });
  });

  test("Mock adapter must be explicitly enabled", async () => {
    const service = serviceFor({}, enabledMockConfig({ mockEnabled: false }));
    await expect(service.getOffers(eligibilityRequest())).rejects.toEqual(
      expect.objectContaining({ code: "INSURANCE_CONFIGURATION_INVALID" }),
    );
  });

  test("INS-TEST-022 kill switch blocks new insurance operations", async () => {
    const service = serviceFor(
      {},
      enabledMockConfig({ killSwitchEnabled: true }),
    );
    await expect(service.getOffers(eligibilityRequest())).rejects.toEqual(
      expect.objectContaining({ code: "INSURANCE_KILL_SWITCH_ACTIVE" }),
    );
  });

  test("disabled Insurance fails safely without resolving an adapter", async () => {
    const service = serviceFor({}, enabledMockConfig({ enabled: false }));
    await expect(service.getOffers(eligibilityRequest())).rejects.toBeInstanceOf(
      InsuranceDomainError,
    );
  });

  test("live policy issuance remains disabled for a non-Mock adapter", async () => {
    const mock = new MockInsuranceAdapter({ now: () => new Date(fixedNow) });
    const nonMockAdapter: PartnerAdapter = {
      id: "fixture-live-adapter",
      checkEligibility: mock.checkEligibility.bind(mock),
      getOffers: mock.getOffers.bind(mock),
      createOrder: mock.createOrder.bind(mock),
      getPolicy: mock.getPolicy.bind(mock),
      cancelPolicy: mock.cancelPolicy.bind(mock),
      createClaim: mock.createClaim.bind(mock),
      getClaim: mock.getClaim.bind(mock),
      verifyWebhook: mock.verifyWebhook.bind(mock),
      reconcile: mock.reconcile.bind(mock),
      getCapabilities: mock.getCapabilities.bind(mock),
      healthCheck: mock.healthCheck.bind(mock),
    };
    const config = enabledMockConfig({
      adapterId: "fixture-live-adapter",
      mockEnabled: false,
    });
    const service = new InsuranceDomainService(
      new PartnerAdapterRegistry([nonMockAdapter]),
      config,
      new ConfigInsuranceKillSwitch(config),
      new MemoryAuditSink(),
    );

    await expect(
      service.createOrder(
        {
          requestId: "request-order-1",
          userId: "user-1",
          bookingId: "booking-1",
          offerId: "offer-1",
          consent: {
            accepted: true,
            wordingVersion: "test-wording-v1",
            acceptedAt: fixedNow,
          },
        },
        { mode: "DEFERRED" },
      ),
    ).rejects.toEqual(
      expect.objectContaining({ code: "INSURANCE_LIVE_ISSUANCE_DISABLED" }),
    );
  });

  test("state-changing Mock order orchestration invokes the audit boundary", async () => {
    const adapter = new MockInsuranceAdapter({ now: () => new Date(fixedNow) });
    const config = enabledMockConfig();
    const auditSink = new MemoryAuditSink();
    const service = new InsuranceDomainService(
      new PartnerAdapterRegistry([adapter]),
      config,
      new ConfigInsuranceKillSwitch(config),
      auditSink,
    );

    const result = await service.createOrder(
      {
        requestId: "request-audited-order",
        userId: "user-1",
        bookingId: "booking-audited-order",
        offerId: "mock-offer-audited",
        consent: {
          accepted: true,
          wordingVersion: "test-wording-v1",
          acceptedAt: fixedNow,
        },
      },
      {
        mode: "MOCK",
        authorizedAmount: { amountMinor: 1000, currency: "PHP" },
      },
    );

    expect(result.status).toBe("ISSUED");
    expect(auditSink.records).toEqual([
      expect.objectContaining({
        action: "INSURANCE_ORDER_CREATED",
        targetId: result.orderId,
        actorUserId: "user-1",
        bookingId: "booking-audited-order",
        safeMetadata: { adapterId: "mock", status: "ISSUED" },
      }),
    ]);
  });

  test("a second normalized adapter can be injected without core provider branching", async () => {
    const mock = new MockInsuranceAdapter({ now: () => new Date(fixedNow) });
    const alternate: PartnerAdapter = {
      id: "fixture-adapter",
      checkEligibility: mock.checkEligibility.bind(mock),
      getOffers: mock.getOffers.bind(mock),
      createOrder: mock.createOrder.bind(mock),
      getPolicy: mock.getPolicy.bind(mock),
      cancelPolicy: mock.cancelPolicy.bind(mock),
      createClaim: mock.createClaim.bind(mock),
      getClaim: mock.getClaim.bind(mock),
      verifyWebhook: mock.verifyWebhook.bind(mock),
      reconcile: mock.reconcile.bind(mock),
      getCapabilities: mock.getCapabilities.bind(mock),
      healthCheck: mock.healthCheck.bind(mock),
    };
    const config = enabledMockConfig({
      adapterId: "fixture-adapter",
      mockEnabled: false,
    });
    const service = new InsuranceDomainService(
      new PartnerAdapterRegistry([alternate]),
      config,
      new ConfigInsuranceKillSwitch(config),
      new MemoryAuditSink(),
    );
    await expect(service.getOffers(eligibilityRequest())).resolves.toEqual(
      expect.objectContaining({ bookingId: "booking-eligible" }),
    );
  });
});
