import type { PrismaClient } from "@prisma/client";
import type { InsuranceKillSwitch } from "../types";

export class DatabaseInsuranceKillSwitch implements InsuranceKillSwitch {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly environmentFallbackActive: boolean
  ) {}

  async isActive(): Promise<boolean> {
    // Safest state wins: Environment kill switch is true -> blocks
    if (this.environmentFallbackActive) {
      return true;
    }

    try {
      const config = await this.prisma.insuranceConfig.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      // DB Config Unavailable -> Fail safe (true)
      if (!config) {
        return true;
      }
      return config.killSwitchEnabled;
    } catch (error) {
      // Failure to read required DB configuration -> blocks
      return true;
    }
  }
}
