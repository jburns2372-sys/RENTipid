import type { PrismaClient, User, InsurancePartner, InsuranceProduct, InsuranceConfig } from "@prisma/client";

export class InsuranceAdminAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsuranceAdminAuthorizationError";
  }
}

export class InsuranceAdminService {
  constructor(private readonly prisma: PrismaClient) {}

  private assertRole(user: User, allowedRoles: string[], operation: string) {
    if (!allowedRoles.includes(user.role)) {
      throw new InsuranceAdminAuthorizationError(
        `User role ${user.role} is not authorized to perform ${operation}. Required: ${allowedRoles.join(", ")}`
      );
    }
  }

  // --- Kill Switch Management ---

  async getKillSwitchStatus(actor: User): Promise<InsuranceConfig | null> {
    this.assertRole(actor, ["Super Admin", "Admin", "Compliance Admin", "Support", "Finance Admin"], "view kill switch");
    return this.prisma.insuranceConfig.findFirst({
      orderBy: { updatedAt: "desc" }
    });
  }

  async toggleKillSwitch(actor: User, enabled: boolean, reason: string): Promise<InsuranceConfig> {
    this.assertRole(actor, ["Super Admin"], "toggle kill switch");

    if (!reason || reason.trim() === "") {
      throw new Error("A reason must be provided when toggling the insurance kill switch.");
    }

    const newConfig = await this.prisma.insuranceConfig.create({
      data: {
        killSwitchEnabled: enabled,
        reason,
        updatedByUserId: actor.id,
      }
    });

    await this.prisma.auditLog.create({
      data: {
        action: enabled ? "INSURANCE_KILL_SWITCH_ACTIVATED" : "INSURANCE_KILL_SWITCH_DEACTIVATED",
        actor_user_id: actor.id,
        module: "InsuranceAdmin",
        target_id: newConfig.id,
        details: JSON.stringify({ reason, state: enabled }),
        ip_address: "127.0.0.1",
      }
    });

    return newConfig;
  }

  // --- Partner Configuration ---

  async getPartners(actor: User): Promise<InsurancePartner[]> {
    this.assertRole(actor, ["Super Admin", "Admin", "Compliance Admin", "Support", "Finance Admin"], "view partners");
    return this.prisma.insurancePartner.findMany({
      orderBy: { created_at: "desc" }
    });
  }

  async updatePartnerStatus(actor: User, partnerId: string, status: string): Promise<InsurancePartner> {
    this.assertRole(actor, ["Super Admin", "Compliance Admin"], "update partner status");

    const validStatuses = ["DRAFT", "ACTIVE", "DISABLED", "SUSPENDED", "RETIRED"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid partner status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const partner = await this.prisma.insurancePartner.update({
      where: { id: partnerId },
      data: { status }
    });

    await this.prisma.auditLog.create({
      data: {
        action: "INSURANCE_PARTNER_STATUS_UPDATED",
        actor_user_id: actor.id,
        module: "InsuranceAdmin",
        target_id: partner.id,
        details: JSON.stringify({ newStatus: status }),
        ip_address: "127.0.0.1",
      }
    });

    return partner;
  }

  // --- Product Configuration ---

  async getProducts(actor: User): Promise<InsuranceProduct[]> {
    this.assertRole(actor, ["Super Admin", "Admin", "Compliance Admin", "Support", "Finance Admin"], "view products");
    return this.prisma.insuranceProduct.findMany({
      orderBy: { created_at: "desc" },
      include: { partner: true }
    });
  }

  async updateProductStatus(actor: User, productId: string, status: string): Promise<InsuranceProduct> {
    this.assertRole(actor, ["Super Admin", "Compliance Admin"], "update product status");

    const validStatuses = ["DRAFT", "ACTIVE", "DISABLED", "SUSPENDED", "RETIRED"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid product status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const product = await this.prisma.insuranceProduct.update({
      where: { id: productId },
      data: { status }
    });

    await this.prisma.auditLog.create({
      data: {
        action: "INSURANCE_PRODUCT_STATUS_UPDATED",
        actor_user_id: actor.id,
        module: "InsuranceAdmin",
        target_id: product.id,
        details: JSON.stringify({ newStatus: status }),
        ip_address: "127.0.0.1",
      }
    });

    return product;
  }
}
