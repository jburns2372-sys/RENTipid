import type {
  InsurancePaymentDependency,
  InsurancePaymentDependencyResult,
} from "./types";

export class DeferredInsurancePaymentDependency
  implements InsurancePaymentDependency
{
  async check(): Promise<InsurancePaymentDependencyResult> {
    return { status: "PENDING" };
  }
}

export class FixtureInsurancePaymentDependency
  implements InsurancePaymentDependency
{
  constructor(private readonly result: InsurancePaymentDependencyResult) {}

  async check(): Promise<InsurancePaymentDependencyResult> {
    return this.result;
  }
}
