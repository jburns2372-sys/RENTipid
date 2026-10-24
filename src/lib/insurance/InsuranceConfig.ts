import type { InsuranceKillSwitch, InsuranceRuntimeConfig } from "./types";

function isExplicitlyTrue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function readInsuranceRuntimeConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): InsuranceRuntimeConfig {
  return {
    enabled: isExplicitlyTrue(
      environment.INSURANCE_ENABLED ??
        environment.NEXT_PUBLIC_FEATURE_INSURANCE,
    ),
    liveIssuanceEnabled: isExplicitlyTrue(
      environment.INSURANCE_LIVE_ISSUANCE_ENABLED,
    ),
    killSwitchEnabled:
      !environment.INSURANCE_KILL_SWITCH ||
      isExplicitlyTrue(environment.INSURANCE_KILL_SWITCH),
    mockEnabled: isExplicitlyTrue(environment.INSURANCE_MOCK_ENABLED),
    adapterId: environment.INSURANCE_ADAPTER?.trim().toLowerCase() ?? "",
  };
}

export class ConfigInsuranceKillSwitch implements InsuranceKillSwitch {
  constructor(private readonly config: InsuranceRuntimeConfig) {}

  async isActive(): Promise<boolean> {
    return this.config.killSwitchEnabled;
  }
}
