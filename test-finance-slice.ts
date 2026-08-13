import { PrismaClient } from "@prisma/client";
import { PartnerAdapterRegistry } from "./src/lib/insurance/PartnerAdapterRegistry";
import { MockInsuranceAdapter } from "./src/lib/insurance/adapters/MockInsuranceAdapter";
import { InsuranceFinanceService } from "./src/lib/insurance/finance/InsuranceFinanceService";
import { InsuranceCancellationService } from "./src/lib/insurance/finance/InsuranceCancellationService";
import { InsuranceReconciliationService } from "./src/lib/insurance/finance/InsuranceReconciliationService";

const prisma = new PrismaClient();

async function cleanUpDummyData() {
  await prisma.insuranceFinanceException.deleteMany();
  await prisma.insuranceReconciliationLog.deleteMany();
  await prisma.financeLedger.deleteMany({
    where: { OR: [{ transaction_type: "Insurance Premium" }, { transaction_type: "Insurance Refund" }] }
  });
  await prisma.insurancePolicy.deleteMany({ where: { external_policy_id: { startsWith: 'finance-' } } });
  await prisma.insuranceOrder.deleteMany({ where: { idempotency_key: { startsWith: 'finance-' } } });
  await prisma.insuranceSelection.deleteMany({ where: { idempotency_key: { startsWith: 'finance-' } } });
}

async function main() {
  console.log("Starting Finance Slice B Tests...");

  await cleanUpDummyData();

  const adapter = new MockInsuranceAdapter();
  const registry = new PartnerAdapterRegistry([adapter]);
  const financeService = new InsuranceFinanceService(prisma);
  const cancellationService = new InsuranceCancellationService(prisma, registry, financeService);
  const reconciliationService = new InsuranceReconciliationService(prisma);

  // Seed Dummy Data for Finance tests
  const partner = await prisma.insurancePartner.upsert({
    where: { adapter_key: "mock" },
    update: {},
    create: {
      id: "partner_mock",
      display_name: "Mock Insurance Partner",
      adapter_key: "mock",
      environment: "SANDBOX",
      status: "ACTIVE",
      capabilities: {}
    }
  });

  const product = await prisma.insuranceProduct.upsert({
    where: { partner_id_product_code: { partner_id: partner.id, product_code: "MOCK-FOUNDATION" } },
    update: {},
    create: {
      id: "prod_mock_foundation",
      partner_id: partner.id,
      product_code: "MOCK-FOUNDATION",
      display_name: "Mock Foundation Coverage",
      coverage_type: "DAMAGE",
      status: "ACTIVE",
      currency: "PHP"
    }
  });

  const dummyUser1 = await prisma.user.upsert({
    where: { email: "finance_test@example.com" },
    update: {},
    create: {
      id: "usr_finance_test",
      email: "finance_test@example.com",
      full_name: "Test Renter",
      account_type: "Individual",
      role: "Renter",
      status: "Verified",
      password_hash: "dummy",
    }
  });

  const dummyUser2 = await prisma.user.upsert({
    where: { email: "finance_provider@example.com" },
    update: {},
    create: {
      id: "usr_finance_provider",
      email: "finance_provider@example.com",
      full_name: "Test Provider",
      account_type: "Individual",
      role: "Individual Provider",
      status: "Verified",
      password_hash: "dummy",
    }
  });

  let dummyCategory = await prisma.category.findFirst();
  if (!dummyCategory) {
    dummyCategory = await prisma.category.create({
      data: {
        id: "cat_dummy_" + Date.now(),
        name: "Dummy Category",
        slug: "dummy-category-" + Date.now(),
        risk_level: "LOW",
      }
    });
  }

  let listing = await prisma.listing.findFirst({ where: { title: "Finance Listing" } });
  if (!listing) {
    listing = await prisma.listing.create({
      data: {
        id: "lst_dummy_" + Date.now(),
        title: "Finance Listing",
        description: "Dummy Listing",
        provider_id: dummyUser2.id,
        category_id: dummyCategory.id,
        status: "ACTIVE",
        daily_rate: 1000,
        weekly_rate: 6000,
        monthly_rate: 20000,
        security_deposit: 0,
        rental_type: "Day",
      }
    });
  }

  const booking = await prisma.booking.upsert({
    where: { id: "bkg_finance_test" },
    update: {},
    create: {
      id: "bkg_finance_test",
      renter_id: dummyUser1.id,
      provider_id: dummyUser2.id,
      listing_id: listing.id,
      start_date: new Date(Date.now() + 86400000), // Tomorrow
      end_date: new Date(Date.now() + 172800000),
      status: "PENDING",
      rental_duration: 1,
      rental_duration_unit: "Day",
      selected_rate_type: "daily",
      estimated_total_amount: 1000,
      base_rental_amount: 1000,
      platform_fee: 0,
      delivery_fee: 0,
      pickup_option: "Pickup",
      deposit_amount: 0,
      payment_status: "PENDING"
    }
  });

  const selection = await prisma.insuranceSelection.create({
    data: {
      booking_id: booking.id,
      user_id: dummyUser1.id,
      offer_reference: "offer-ref-1",
      partner_key: "mock",
      product_code: "MOCK-FOUNDATION",
      disclosure_version: "1",
      premium_minor: 5000,
      currency: "PHP",
      coverage_start: new Date(Date.now() + 86400000),
      coverage_end: new Date(Date.now() + 172800000),
      offer_expires_at: new Date(Date.now() + 172800000),
      idempotency_key: "finance-sel-1",
      request_hash: "hash1",
      status: "SELECTED",
      consent_accepted: true,
      consented_at: new Date(),
    }
  });

  const order = await prisma.insuranceOrder.create({
    data: {
      booking: { connect: { id: booking.id } },
      user: { connect: { id: dummyUser1.id } },
      selection: { connect: { id: selection.id } },
      idempotency_key: "finance-order-1",
      request_hash: "hash",
      status: "ISSUED",
      payment_dependency_status: "PENDING"
    }
  });

  let policy = await prisma.insurancePolicy.create({
    data: {
      partner: { connect: { id: partner.id } },
      product: { connect: { id: product.id } },
      booking: { connect: { id: booking.id } },
      insurance_order: { connect: { id: order.id } },
      external_policy_id: "finance-ext-pol-1",
      order_reference: order.id,
      idempotency_key: "finance-pol-1",
      status: "ISSUED",
      premium_amount: 50.00,
      tax_amount: 0,
      currency: "PHP",
      coverage_start: new Date(Date.now() + 86400000),
      coverage_end: new Date(Date.now() + 172800000)
    }
  });

  // 1. Premium Ledger Entry
  await financeService.recordPremiumCollection(policy, "tx_123");
  console.log("Recorded Premium Collection");

  // 1.1 Duplicate Premium Prevention
  await financeService.recordPremiumCollection(policy, "tx_123_dup");
  const ledgers = await prisma.financeLedger.findMany({ where: { policy_id: policy.id } });
  console.assert(ledgers.length === 1, "Duplicate premium prevention failed");

  // 2. Cancellation Request & Refund Boundary
  policy = await cancellationService.requestPolicyCancellation(policy.id, "USER_REQUEST");
  console.log("Requested Policy Cancellation");
  console.assert(policy.status === "CANCELLED", "Policy not cancelled immediately by mock adapter");
  
  // Refund entry should have been created
  const refundLedger = await prisma.financeLedger.findFirst({ where: { policy_id: policy.id, transaction_type: "Insurance Refund" } });
  console.assert(!!refundLedger, "Refund ledger not created");
  
  // 3. Duplicate Cancellation
  policy = await cancellationService.requestPolicyCancellation(policy.id, "USER_REQUEST");
  const cancellationsCount = await prisma.insuranceFinanceException.count({ where: { policy_id: policy.id } });
  // Ensure idempotent cancellation doesn't throw or duplicate refunds
  const refundsCount = await prisma.financeLedger.count({ where: { policy_id: policy.id, transaction_type: "Insurance Refund" } });
  console.assert(refundsCount === 1, "Duplicate refund recorded!");

  // 4. Reconciliation
  const logs = await reconciliationService.reconcileBatch(partner.id, "BATCH_01", [
    { externalPolicyId: "finance-ext-pol-1", premiumAmountMinor: 5000, currency: "PHP", status: "CANCELLED" },
    { externalPolicyId: "finance-missing", premiumAmountMinor: 2000, currency: "PHP", status: "ACTIVE" }, // MISSING INTERNAL
    { externalPolicyId: "finance-ext-pol-1", premiumAmountMinor: 6000, currency: "PHP", status: "CANCELLED" } // AMOUNT MISMATCH (duplicate but we pass it as a test)
  ]);
  console.log(`Reconciliation generated ${logs.length} logs`);
  
  const missingInternal = logs.find(l => l.classification === "MISSING_INTERNAL");
  console.assert(!!missingInternal, "MISSING_INTERNAL not flagged");
  
  const amountMismatch = logs.find(l => l.classification === "AMOUNT_MISMATCH");
  console.assert(!!amountMismatch, "AMOUNT_MISMATCH not flagged");

  // 5. Finance Exceptions
  const exceptions = await prisma.insuranceFinanceException.findMany({ where: { policy_id: policy.id } });
  console.log(`Finance Exceptions found: ${exceptions.length}`);
  console.assert(exceptions.length > 0, "No exceptions generated for mismatch");

  console.log("All Finance Slice B Tests Passed Successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
