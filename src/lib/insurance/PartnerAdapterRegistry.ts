import type { PartnerAdapter } from "./PartnerAdapter";

export class InsuranceAdapterRegistryError extends Error {
  constructor(
    readonly code: "INVALID_ADAPTER" | "DUPLICATE_ADAPTER" | "ADAPTER_NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "InsuranceAdapterRegistryError";
  }
}

function normalizeAdapterId(adapterId: string): string {
  return adapterId.trim().toLowerCase();
}

export class PartnerAdapterRegistry {
  private readonly adapters = new Map<string, PartnerAdapter>();

  constructor(adapters: readonly PartnerAdapter[] = []) {
    for (const adapter of adapters) {
      this.register(adapter);
    }
  }

  register(adapter: PartnerAdapter): void {
    const adapterId = normalizeAdapterId(adapter.id);
    if (!adapterId) {
      throw new InsuranceAdapterRegistryError(
        "INVALID_ADAPTER",
        "Insurance adapter ID is required.",
      );
    }

    const existing = this.adapters.get(adapterId);
    if (existing === adapter) {
      return;
    }
    if (existing) {
      throw new InsuranceAdapterRegistryError(
        "DUPLICATE_ADAPTER",
        `Insurance adapter "${adapterId}" is already registered.`,
      );
    }
    this.adapters.set(adapterId, adapter);
  }

  resolve(adapterId: string): PartnerAdapter {
    const normalizedId = normalizeAdapterId(adapterId);
    const adapter = this.adapters.get(normalizedId);
    if (!normalizedId || !adapter) {
      throw new InsuranceAdapterRegistryError(
        "ADAPTER_NOT_FOUND",
        `Insurance adapter "${normalizedId || "unconfigured"}" is not registered.`,
      );
    }
    return adapter;
  }

  registeredAdapterIds(): readonly string[] {
    return [...this.adapters.keys()].sort();
  }
}
