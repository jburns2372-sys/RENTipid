import { PrismaClient } from "@prisma/client";
import { InsuranceAdminService, InsuranceAdminAuthorizationError } from "./src/lib/insurance/admin/InsuranceAdminService";
import { DatabaseInsuranceKillSwitch } from "./src/lib/insurance/admin/DatabaseInsuranceKillSwitch";
import { InsuranceTelemetry } from "./src/lib/insurance/telemetry/InsuranceTelemetry";
import { InsuranceDomainService } from "./src/lib/insurance/InsuranceDomainService";
import { PartnerAdapterRegistry } from "./src/lib/insurance/PartnerAdapterRegistry";
import { MockInsuranceAdapter } from "./src/lib/insurance/adapters/MockInsuranceAdapter";

async function cleanUpDummyData(prisma: PrismaClient) {
  console.log("Cleaning up previous test data...");
  await prisma.auditLog.deleteMany({ where: { actor_user_id: { startsWith: 'usr_admin_test_' } } });
  await prisma.insuranceConfig.deleteMany({ where: { updatedByUserId: { startsWith: 'usr_admin_test_' } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: 'usr_admin_test_' } } });
}

async function main() {
  const prisma = new PrismaClient();
  await cleanUpDummyData(prisma);

  const adminService = new InsuranceAdminService(prisma);
  const telemetry = new InsuranceTelemetry(prisma);

  // Setup Users
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@example.com" },
    update: {},
    create: {
      id: "usr_admin_test_super",
      email: "superadmin@example.com",
      full_name: "Super Admin Test",
      account_type: "Individual",
      role: "Super Admin",
      status: "Verified",
      password_hash: "dummy",
    }
  });

  const complianceAdmin = await prisma.user.upsert({
    where: { email: "compliance@example.com" },
    update: {},
    create: {
      id: "usr_admin_test_compliance",
      email: "compliance@example.com",
      full_name: "Compliance Admin Test",
      account_type: "Individual",
      role: "Compliance Admin",
      status: "Verified",
      password_hash: "dummy",
    }
  });

  const renter = await prisma.user.upsert({
    where: { email: "renter@example.com" },
    update: {},
    create: {
      id: "usr_admin_test_renter",
      email: "renter@example.com",
      full_name: "Renter Test",
      account_type: "Individual",
      role: "Renter",
      status: "Verified",
      password_hash: "dummy",
    }
  });

  // Setup Mock Partner/Product
  let mockPartner = await prisma.insurancePartner.findUnique({
    where: { adapter_key: "mock" }
  });
  if (!mockPartner) {
    mockPartner = await prisma.insurancePartner.create({
      data: {
        id: "partner_mock",
        display_name: "Mock Insurance Partner",
        adapter_key: "mock",
        environment: "SANDBOX",
        status: "DRAFT",
        capabilities: {}
      }
    });
  }

  let mockProduct = await prisma.insuranceProduct.findUnique({
    where: {
      partner_id_product_code: {
        partner_id: mockPartner.id,
        product_code: "MOCK-FOUNDATION"
      }
    }
  });
  if (!mockProduct) {
    mockProduct = await prisma.insuranceProduct.create({
      data: {
        id: "prod_mock_foundation",
        partner_id: mockPartner.id,
        product_code: "MOCK-FOUNDATION",
        display_name: "Mock Foundation Coverage",
        coverage_type: "DAMAGE",
        status: "DRAFT",
        currency: "PHP"
      }
    });
  }

  console.log("--- Testing Admin Authorization ---");
  try {
    await adminService.toggleKillSwitch(renter, false, "Test");
    throw new Error("Renter should not be able to toggle kill switch!");
  } catch (e) {
    if (!(e instanceof InsuranceAdminAuthorizationError)) throw e;
    console.log("SUCCESS: Renter correctly blocked from kill switch toggle.");
  }

  try {
    await adminService.toggleKillSwitch(complianceAdmin, false, "Test");
    throw new Error("Compliance Admin should not be able to toggle kill switch!");
  } catch (e) {
    if (!(e instanceof InsuranceAdminAuthorizationError)) throw e;
    console.log("SUCCESS: Compliance Admin correctly blocked from kill switch toggle.");
  }

  console.log("--- Testing Kill Switch Activation (Super Admin) ---");
  const config = await adminService.toggleKillSwitch(superAdmin, true, "Emergency Security Incident");
  console.log(`Kill Switch Activated: ${config.killSwitchEnabled} | Reason: ${config.reason}`);

  const killSwitch = new DatabaseInsuranceKillSwitch(prisma, false);
  const isActive = await killSwitch.isActive();
  console.log(`DatabaseInsuranceKillSwitch isActive(): ${isActive}`);

  // Test that DomainService blocks operations when kill switch is active
  const mockAdapter = new MockInsuranceAdapter({ now: () => new Date() });
  const registry = new PartnerAdapterRegistry();
  registry.register(mockAdapter);

  const domainService = new InsuranceDomainService(
    registry,
    { enabled: true, liveIssuanceEnabled: false, killSwitchEnabled: false, mockEnabled: true, adapterId: "mock" },
    killSwitch,
    { record: async (r) => {} }
  );

  try {
    await domainService.createOrder({} as any, {} as any);
    throw new Error("DomainService did not block createOrder!");
  } catch (e: any) {
    if (e.code !== "INSURANCE_KILL_SWITCH_ACTIVE") throw e;
    console.log("SUCCESS: DomainService correctly blocked new issuance (createOrder) due to Kill Switch.");
  }

  console.log("--- Testing Kill Switch Deactivation ---");
  await adminService.toggleKillSwitch(superAdmin, false, "Incident Resolved");
  const isDeactivated = !(await killSwitch.isActive());
  console.log(`DatabaseInsuranceKillSwitch Deactivated: ${isDeactivated}`);

  console.log("--- Testing Partner/Product Configuration ---");
  const updatedPartner = await adminService.updatePartnerStatus(complianceAdmin, mockPartner.id, "ACTIVE");
  console.log(`Partner Status Updated to: ${updatedPartner.status}`);
  const updatedProduct = await adminService.updateProductStatus(complianceAdmin, mockProduct.id, "ACTIVE");
  console.log(`Product Status Updated to: ${updatedProduct.status}`);

  console.log("--- Testing Telemetry ---");
  const activity = await telemetry.getKillSwitchActivity();
  console.log(`Found ${activity.length} kill switch audit events.`);

  await prisma.$disconnect();
  console.log("All Slice C Admin Tests Passed Successfully.");
}

main().catch(console.error);
