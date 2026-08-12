import { PrismaClient } from "@prisma/client";
import { PrismaInsuranceClaimRepository } from "./src/lib/insurance/claims/PrismaInsuranceClaimRepository";
import { InsuranceClaimService } from "./src/lib/insurance/claims/InsuranceClaimService";
import { InsuranceDomainService } from "./src/lib/insurance/InsuranceDomainService";
import { PrismaInsuranceTransactionRepository } from "./src/lib/insurance/transaction/PrismaInsuranceTransactionRepository";
import { MockInsuranceAdapter } from "./src/lib/insurance/adapters/MockInsuranceAdapter";
import { PartnerAdapterRegistry } from "./src/lib/insurance/PartnerAdapterRegistry";

async function main() {
  const prisma = new PrismaClient();
  const claimRepo = new PrismaInsuranceClaimRepository(prisma);
  const transactionRepo = new PrismaInsuranceTransactionRepository(prisma);
  
  const mockAdapter = new MockInsuranceAdapter(
    { enabled: true, liveIssuanceEnabled: false, killSwitchEnabled: false, mockEnabled: true, adapterId: "mock" },
    () => new Date(),
    async (r) => console.log("Audit MockAdapter:", r)
  );
  
  const registry = new PartnerAdapterRegistry();
  registry.register(mockAdapter);

  const domainService = new InsuranceDomainService(
    registry,
    { enabled: true, liveIssuanceEnabled: false, killSwitchEnabled: false, mockEnabled: true, adapterId: "mock" },
    { isActive: async () => false },
    { record: async (r) => console.log("Audit Domain:", r) }
  );

  const claimService = new InsuranceClaimService(
    domainService,
    claimRepo,
    transactionRepo,
    { record: async (r) => console.log("Audit ClaimService:", r) }
  );

  const booking = await prisma.booking.findFirst();
  if (!booking) throw new Error("No booking found in DB");

  // We need a mock policy to attach the claim to
  const mockSelection = await transactionRepo.createSelection({
    bookingId: booking.id,
    userId: booking.renter_id,
    offerId: "mock-offer-1",
    partnerKey: "mock",
    productCode: "MOCK-FOUNDATION",
    disclosureVersion: "1",
    premiumMinor: 0,
    currency: "PHP",
    coverageStart: new Date(),
    coverageEnd: new Date(Date.now() + 86400000),
    offerExpiresAt: new Date(Date.now() + 86400000),
    idempotencyKey: "test-sel-" + Date.now(),
    requestHash: "hash",
    status: "SELECTED",
    consentedAt: new Date(),
  });

  const mockOrder = await transactionRepo.createOrder({
    selectionId: mockSelection.id,
    bookingId: booking.id,
    userId: booking.renter_id,
    idempotencyKey: "test-ord-" + Date.now(),
    requestHash: "hash2",
    status: "ISSUED",
    paymentDependencyStatus: "PENDING"
  });

  const policyResponse = await domainService.createOrder(
    {
      requestId: "test-req-1",
      userId: booking.renter_id,
      bookingId: booking.id,
      offerId: "mock-offer-1",
      consent: { accepted: true, wordingVersion: "1", acceptedAt: new Date() }
    },
    { mode: "MOCK" }
  );

  const localPolicy = await transactionRepo.persistIssuedPolicy({
    selection: mockSelection,
    order: mockOrder,
    policy: policyResponse.policy!,
    idempotencyKey: "test-iss-" + Date.now(),
  });

  console.log("Local Policy saved:", localPolicy.policyId);

  console.log("--- Testing Claim Initiation ---");
  const claim = await claimService.initiateClaim({
    requestId: "claim-req-" + Date.now(),
    policyId: localPolicy.policyId,
    userId: booking.renter_id,
    incident: {
      type: "DAMAGE",
      occurredAt: new Date(),
      summary: "Test claim incident"
    },
    claimedAmount: { amountMinor: 10000, currency: "PHP" }
  });

  console.log("Initiated Claim:", claim);

  console.log("--- Testing Add Evidence ---");
  const evidence = await claimService.addEvidence({
    requestId: "ev-req-" + Date.now(),
    claimId: claim.id,
    userId: booking.renter_id,
    evidenceType: "PHOTO",
    fileReference: "file:///test/image.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024
  });

  console.log("Added Evidence:", evidence);
  
  console.log("--- Testing Idempotency ---");
  const claim2 = await claimService.initiateClaim({
    requestId: claim.idempotencyKey,
    policyId: localPolicy.policyId,
    userId: booking.renter_id,
    incident: {
      type: "DAMAGE",
      occurredAt: claim.incidentAt,
      summary: "Test claim incident"
    },
    claimedAmount: { amountMinor: 10000, currency: "PHP" }
  });
  console.log("Idempotent Claim replay returns same claim ID:", claim2.id === claim.id);

  console.log("--- Testing Webhook Status Update ---");
  await claimService.processWebhookStatusUpdate(claim.externalClaimId!, "APPROVED", booking.id);
  const updated = await claimRepo.findClaimById(claim.id);
  console.log("Updated Claim via Webhook:", updated);

  await prisma.$disconnect();
}

main().catch(console.error);
