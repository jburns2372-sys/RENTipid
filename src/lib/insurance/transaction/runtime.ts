import { SecurityEnvironment, SecurityLifecycle } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  ConfigInsuranceKillSwitch,
  readInsuranceRuntimeConfig,
} from "../InsuranceConfig";
import { InsuranceDomainService } from "../InsuranceDomainService";
import { PartnerAdapterRegistry } from "../PartnerAdapterRegistry";
import { MockInsuranceAdapter } from "../adapters/MockInsuranceAdapter";
import { DeferredInsurancePaymentDependency } from "./payment-dependency";
import { PrismaInsuranceTransactionRepository } from "./PrismaInsuranceTransactionRepository";
import { InsuranceTransactionService } from "./InsuranceTransactionService";
import type {
  InsurancePaymentDependency,
  InsuranceTransactionAuditEvent,
  InsuranceTransactionAuditSink,
} from "./types";

class RentipidInsuranceAuditSink implements InsuranceTransactionAuditSink {
  async record(event: InsuranceTransactionAuditEvent): Promise<void> {
    const environment =
      process.env.VERCEL_ENV === "production"
        ? SecurityEnvironment.PRODUCTION
        : process.env.VERCEL_ENV === "preview"
          ? SecurityEnvironment.STAGING
          : SecurityEnvironment.DEVELOPMENT;
    const recorded = await createAuditLog({
      actor_user_id: event.actorUserId,
      action: event.action,
      module: "Insurance",
      target_id: event.targetId,
      details: JSON.stringify({
        bookingId: event.bookingId,
        ...event.safeMetadata,
      }),
      eventLifecycle: SecurityLifecycle.TEST,
      eventEnvironment: environment,
    });
    if (!recorded) {
      throw new Error("Insurance audit record could not be persisted.");
    }
  }
}

export function createInsuranceTransactionRuntime(options?: {
  paymentDependency?: InsurancePaymentDependency;
  now?: () => Date;
}): InsuranceTransactionService {
  const config = readInsuranceRuntimeConfig();
  const killSwitch = new ConfigInsuranceKillSwitch(config);
  const mock = new MockInsuranceAdapter({ now: options?.now });
  const domain = new InsuranceDomainService(
    new PartnerAdapterRegistry([mock]),
    config,
    killSwitch,
    {
      async record(): Promise<void> {
        // Transaction-level audit records are authoritative for this block.
      },
    },
  );
  return new InsuranceTransactionService(
    domain,
    new PrismaInsuranceTransactionRepository(prisma),
    options?.paymentDependency ?? new DeferredInsurancePaymentDependency(),
    new RentipidInsuranceAuditSink(),
    config,
    killSwitch,
    options?.now,
  );
}
