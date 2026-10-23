import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hasPermission, UserRole } from '@/lib/permissions';
import { revision2SpecialistIds, revision2SpecialistRegistry, Revision2SpecialistId } from './framework-registry';

export type SpecialistFeatureControlErrorCode =
  | 'UNAUTHENTICATED' | 'UNAUTHORIZED' | 'INVALID_REQUEST' | 'UNKNOWN_SPECIALIST';

export class SpecialistFeatureControlError extends Error {
  constructor(message: string, readonly code: SpecialistFeatureControlErrorCode) {
    super(message);
    this.name = 'SpecialistFeatureControlError';
  }
}

export interface SpecialistFeatureStateDto {
  specialistId: Revision2SpecialistId;
  featureFlag: string;
  enabled: boolean;
  maturityLevel: string;
  fallback: 'UNIFIED_AI_BASELINE';
}

type AuthorizationDb = Pick<PrismaClient, 'user'> | Pick<Prisma.TransactionClient, 'user'>;

const environmentName = () => process.env.NODE_ENV === 'production'
  ? 'production'
  : process.env.NODE_ENV === 'test' ? 'test' : 'development';

function parseInput(input: unknown): { specialistId: Revision2SpecialistId; enabled: boolean } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SpecialistFeatureControlError('A bounded specialist feature update is required', 'INVALID_REQUEST');
  }
  const value = input as Record<string, unknown>;
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== 'enabled' || keys[1] !== 'specialistId' || typeof value.enabled !== 'boolean') {
    throw new SpecialistFeatureControlError('Only specialistId and enabled may be changed', 'INVALID_REQUEST');
  }
  if (typeof value.specialistId !== 'string' || !(revision2SpecialistIds as readonly string[]).includes(value.specialistId)) {
    throw new SpecialistFeatureControlError('Unknown specialist identifier', 'UNKNOWN_SPECIALIST');
  }
  return { specialistId: value.specialistId as Revision2SpecialistId, enabled: value.enabled };
}

function stateDto(specialistId: Revision2SpecialistId, storedValue?: string | null): SpecialistFeatureStateDto {
  const definition = revision2SpecialistRegistry[specialistId];
  return Object.freeze({
    specialistId,
    featureFlag: definition.featureFlag,
    enabled: storedValue == null ? definition.status === 'ENABLED' : storedValue.trim().toLowerCase() === 'true',
    maturityLevel: definition.maturityLevel,
    fallback: 'UNIFIED_AI_BASELINE',
  });
}

export class SpecialistFeatureControlService {
  constructor(private readonly db: PrismaClient = prisma, private readonly clock: () => Date = () => new Date()) {}

  private async assertAuthorized(actorUserId: string | undefined, action: 'read' | 'update', db: AuthorizationDb) {
    if (!actorUserId?.trim()) throw new SpecialistFeatureControlError('Authentication required', 'UNAUTHENTICATED');
    const actor = await db.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, role: true, status: true },
    });
    if (!actor || actor.status.trim().toLowerCase() !== 'verified'
      || !hasPermission(actor.role as UserRole, 'system_settings', action)) {
      throw new SpecialistFeatureControlError('Specialist feature control access denied', 'UNAUTHORIZED');
    }
    return actor;
  }

  async list(actorUserId: string | undefined) {
    await this.assertAuthorized(actorUserId, 'read', this.db);
    const flags = revision2SpecialistIds.map(id => revision2SpecialistRegistry[id].featureFlag);
    const settings = await this.db.systemSetting.findMany({
      where: { setting_key: { in: flags } },
      select: { setting_key: true, setting_value: true },
    });
    const values = new Map(settings.map(setting => [setting.setting_key, setting.setting_value]));
    return {
      contractVersion: 'uaics-specialist-feature-control.v1',
      specialists: revision2SpecialistIds.map(id => stateDto(id, values.get(revision2SpecialistRegistry[id].featureFlag))),
    };
  }

  async update(actorUserId: string | undefined, input: unknown) {
    const normalized = parseInput(input);
    return this.db.$transaction(async tx => {
      const actor = await this.assertAuthorized(actorUserId, 'update', tx);
      const definition = revision2SpecialistRegistry[normalized.specialistId];
      const prior = await tx.systemSetting.findUnique({
        where: { setting_key: definition.featureFlag },
        select: { setting_value: true },
      });
      const oldState = stateDto(normalized.specialistId, prior?.setting_value);
      const occurredAt = this.clock();
      await tx.systemSetting.upsert({
        where: { setting_key: definition.featureFlag },
        create: {
          setting_key: definition.featureFlag,
          setting_value: String(normalized.enabled),
          description: `Unified AI activation control for ${normalized.specialistId}`,
          updated_by: actor.id,
        },
        update: { setting_value: String(normalized.enabled), updated_by: actor.id },
      });
      await tx.auditLog.create({
        data: {
          actor_user_id: actor.id,
          action: 'AI_SPECIALIST_FEATURE_FLAG_UPDATED',
          module: 'SpecialistFeatureControlService',
          target_id: normalized.specialistId,
          details: JSON.stringify({
            schemaVersion: 'uaics-specialist-feature-control.v1',
            specialistId: normalized.specialistId,
            oldEnabled: oldState.enabled,
            newEnabled: normalized.enabled,
            environment: environmentName(),
            result: 'SUCCESS',
            occurredAt: occurredAt.toISOString(),
          }),
        },
      });
      const verified = await tx.systemSetting.findUnique({
        where: { setting_key: definition.featureFlag },
        select: { setting_value: true },
      });
      const specialist = stateDto(normalized.specialistId, verified?.setting_value);
      if (specialist.enabled !== normalized.enabled) throw new Error('SPECIALIST_FEATURE_CONTROL_VERIFICATION_FAILED');
      return { contractVersion: 'uaics-specialist-feature-control.v1', specialist };
    });
  }
}
