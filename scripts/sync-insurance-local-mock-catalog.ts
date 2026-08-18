import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assertLocalDatabase(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required.");
  const parsed = new URL(raw);
  if (!["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
    throw new Error("Insurance Mock catalog sync is LOCAL-only.");
  }
}

async function main(): Promise<void> {
  assertLocalDatabase();
  const partner = await prisma.insurancePartner.upsert({
    where: { adapter_key: "mock" },
    update: {
      display_name: "RENTipid Local Mock Insurance (Not Real Insurance)",
      environment: "LOCAL",
      status: "MOCK_LOCAL_ONLY",
      is_mock: true,
      is_enabled: true,
      capabilities: {
        deterministic: true,
        liveIssuance: false,
        realInsurance: false,
      },
    },
    create: {
      adapter_key: "mock",
      display_name: "RENTipid Local Mock Insurance (Not Real Insurance)",
      environment: "LOCAL",
      status: "MOCK_LOCAL_ONLY",
      is_mock: true,
      is_enabled: true,
      capabilities: {
        deterministic: true,
        liveIssuance: false,
        realInsurance: false,
      },
    },
  });
  await prisma.insuranceProduct.upsert({
    where: {
      partner_id_product_code: {
        partner_id: partner.id,
        product_code: "MOCK-FOUNDATION",
      },
    },
    update: {
      display_name: "Local Mock Transaction Fixture (Not Real Insurance)",
      coverage_type: "ENGINEERING_FIXTURE",
      status: "MOCK_LOCAL_ONLY",
      currency: "PHP",
      terms_reference: "mock-terms-not-insurance-v1",
      configuration: {
        deterministic: true,
        productionEligible: false,
        approvedInsuranceProduct: false,
      },
    },
    create: {
      partner_id: partner.id,
      product_code: "MOCK-FOUNDATION",
      display_name: "Local Mock Transaction Fixture (Not Real Insurance)",
      coverage_type: "ENGINEERING_FIXTURE",
      status: "MOCK_LOCAL_ONLY",
      currency: "PHP",
      terms_reference: "mock-terms-not-insurance-v1",
      configuration: {
        deterministic: true,
        productionEligible: false,
        approvedInsuranceProduct: false,
      },
    },
  });
  const [partnerCount, productCount] = await Promise.all([
    prisma.insurancePartner.count({ where: { adapter_key: "mock", is_mock: true } }),
    prisma.insuranceProduct.count({
      where: { partner_id: partner.id, product_code: "MOCK-FOUNDATION" },
    }),
  ]);
  if (partnerCount !== 1 || productCount !== 1) {
    throw new Error("Insurance Mock catalog sync did not converge.");
  }
  console.log("INSURANCE_LOCAL_MOCK_CATALOG_SYNC=PASS");
  console.log("MOCK_PARTNER_COUNT=1");
  console.log("MOCK_PRODUCT_COUNT=1");
  console.log("LIVE_INSURANCE_ACTIVATED=NO");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Insurance Mock catalog sync failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
