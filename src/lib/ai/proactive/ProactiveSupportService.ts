import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AiCasePlatform } from '../cases/AiCasePlatform';
import {
  getProactiveEventDefinition,
  ProactiveEntityType,
  ProactiveEventType,
} from './registry';

const FEATURE_SETTING = 'ai_module_proactive-service_enabled';
const ACTIVE_ACCOUNT_DENYLIST = new Set(['suspended', 'blacklisted', 'deleted', 'disabled']);
const SERIALIZATION_RETRIES = 3;

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

interface AuthoritativeSnapshot {
  eventType: ProactiveEventType;
  sourceEventId: string;
  sourceOccurredAt: Date;
  userId: string;
  relatedEntityType: ProactiveEntityType;
  relatedEntityId: string;
  caseEntityType: 'Booking' | 'Payment' | 'RefundRequest' | 'DepositAction' | 'DamageClaim' | 'User';
  caseEntityId: string;
  eligible: boolean;
  eligibilityReason: string;
  expiresAt: Date;
}

export interface ProactiveEventInput {
  eventType: ProactiveEventType;
  entityId: string;
}

export type ProactiveScheduleOutcome =
  | 'SCHEDULED'
  | 'DUPLICATE'
  | 'COOLDOWN_SUPPRESSED'
  | 'INELIGIBLE'
  | 'EXPIRED'
  | 'AUTHORITATIVE_SOURCE_NOT_FOUND'
  | 'TARGET_NOT_ELIGIBLE'
  | 'FEATURE_DISABLED';

export interface ProactiveScheduleResult {
  outcome: ProactiveScheduleOutcome;
  followUpId?: string;
  userId?: string;
  reason: string;
}

export type ProactiveDispatchOutcome =
  | 'DELIVERED'
  | 'NOT_DUE'
  | 'ALREADY_PROCESSED'
  | 'CANCELLED_EXPIRED'
  | 'CANCELLED_STALE'
  | 'NOT_FOUND';

export interface ProactiveDispatchResult {
  outcome: ProactiveDispatchOutcome;
  followUpId?: string;
  notificationId?: string;
  reason: string;
}

function normalized(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function hashKey(prefix: string, material: string) {
  return `${prefix}:${createHash('sha256').update(material).digest('hex')}`;
}

function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds);
}

function isPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export class ProactiveSupportService {
  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly casePlatform = new AiCasePlatform(db),
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async ingest(input: ProactiveEventInput): Promise<ProactiveScheduleResult> {
    const now = this.clock();
    if (!(await this.isFeatureEnabled())) {
      await this.writeAudit(this.db, {
        eventType: input.eventType,
        entityId: input.entityId,
        outcome: 'FEATURE_DISABLED',
        reason: 'Controlled proactive-service feature setting is disabled',
        now,
      });
      return { outcome: 'FEATURE_DISABLED', reason: 'Proactive support is disabled' };
    }

    const snapshot = await this.resolveAuthoritativeSnapshot(this.db, input.eventType, input.entityId, now);
    if (!snapshot) {
      await this.writeAudit(this.db, {
        eventType: input.eventType,
        entityId: input.entityId,
        outcome: 'AUTHORITATIVE_SOURCE_NOT_FOUND',
        reason: 'No matching authoritative persisted source record',
        now,
      });
      return {
        outcome: 'AUTHORITATIVE_SOURCE_NOT_FOUND',
        reason: 'No authoritative source event was found',
      };
    }

    if (!(await this.isEligibleTarget(snapshot.userId))) {
      await this.writeAudit(this.db, {
        snapshot,
        outcome: 'TARGET_NOT_ELIGIBLE',
        reason: 'Derived target account is unavailable or inactive',
        now,
      });
      return {
        outcome: 'TARGET_NOT_ELIGIBLE',
        userId: snapshot.userId,
        reason: 'Authoritative target account is not eligible',
      };
    }

    if (!snapshot.eligible) {
      await this.writeAudit(this.db, {
        snapshot,
        outcome: 'INELIGIBLE',
        reason: snapshot.eligibilityReason,
        now,
      });
      return {
        outcome: 'INELIGIBLE',
        userId: snapshot.userId,
        reason: snapshot.eligibilityReason,
      };
    }

    if (snapshot.expiresAt.getTime() <= now.getTime()) {
      await this.writeAudit(this.db, {
        snapshot,
        outcome: 'EXPIRED',
        reason: 'Authoritative event is beyond its controlled expiry',
        now,
      });
      return {
        outcome: 'EXPIRED',
        userId: snapshot.userId,
        reason: 'Authoritative event has expired',
      };
    }

    const definition = getProactiveEventDefinition(input.eventType);
    const supportCase = await this.casePlatform.resumeCase(
      snapshot.userId,
      definition.category,
      snapshot.caseEntityType,
      snapshot.caseEntityId,
      definition.subcategory,
    );
    const sourceEventKey = hashKey('ai-proactive-source-v1', `${input.eventType}|${snapshot.sourceEventId}`);
    const deduplicationKey = hashKey(
      'ai-proactive-dedup-v1',
      [
        input.eventType,
        snapshot.sourceEventId,
        snapshot.userId,
        snapshot.relatedEntityType,
        snapshot.relatedEntityId,
        definition.subcategory,
      ].join('|'),
    );

    for (let attempt = 0; attempt < SERIALIZATION_RETRIES; attempt += 1) {
      try {
        return await this.db.$transaction(async tx => {
          const duplicate = await tx.aiFollowUp.findFirst({
            where: { OR: [{ sourceEventKey }, { deduplicationKey }] },
            select: { id: true },
          });
          if (duplicate) {
            await this.writeAudit(tx, {
              snapshot,
              outcome: 'DUPLICATE',
              reason: 'Durable source/deduplication identity already exists',
              followUpId: duplicate.id,
              deduplicationKey,
              now,
            });
            return {
              outcome: 'DUPLICATE' as const,
              followUpId: duplicate.id,
              userId: snapshot.userId,
              reason: 'Duplicate authoritative event suppressed',
            };
          }

          const coolingDown = await tx.aiFollowUp.findFirst({
            where: {
              userId: snapshot.userId,
              eventType: input.eventType,
              relatedEntityType: snapshot.relatedEntityType,
              relatedEntityId: snapshot.relatedEntityId,
              cooldownUntil: { gt: now },
              status: { not: 'cancelled' },
            },
            orderBy: { cooldownUntil: 'desc' },
            select: { id: true },
          });
          if (coolingDown) {
            await this.writeAudit(tx, {
              snapshot,
              outcome: 'COOLDOWN_SUPPRESSED',
              reason: 'A qualifying follow-up remains inside its controlled cooldown',
              followUpId: coolingDown.id,
              deduplicationKey,
              now,
            });
            return {
              outcome: 'COOLDOWN_SUPPRESSED' as const,
              followUpId: coolingDown.id,
              userId: snapshot.userId,
              reason: 'Controlled cooldown suppressed the repeated notice',
            };
          }

          const followUp = await tx.aiFollowUp.create({
            data: {
              caseId: supportCase.id,
              triggerAt: now,
              triggerType: definition.triggerType,
              status: 'pending',
              nextAttemptAt: now,
              eventType: input.eventType,
              sourceEventKey,
              deduplicationKey,
              userId: snapshot.userId,
              relatedEntityType: snapshot.relatedEntityType,
              relatedEntityId: snapshot.relatedEntityId,
              eligibleAt: now,
              expiresAt: snapshot.expiresAt,
              cooldownUntil: addMilliseconds(now, definition.cooldownMs),
              allowedTool: definition.allowedTool,
              auditMetadata: {
                schemaVersion: 'p6.1',
                registryVersion: definition.version,
                sourceModel: definition.sourceModel,
                sourceEventId: snapshot.sourceEventId,
                eligibilityRule: definition.eligibilityRule,
                eligibilityReason: snapshot.eligibilityReason,
              },
            },
          });
          await this.writeAudit(tx, {
            snapshot,
            outcome: 'SCHEDULED',
            reason: snapshot.eligibilityReason,
            followUpId: followUp.id,
            deduplicationKey,
            now,
          });
          return {
            outcome: 'SCHEDULED' as const,
            followUpId: followUp.id,
            userId: snapshot.userId,
            reason: 'Eligible authoritative event scheduled exactly once',
          };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (isPrismaError(error, 'P2034') && attempt + 1 < SERIALIZATION_RETRIES) continue;
        if (isPrismaError(error, 'P2002')) {
          const duplicate = await this.db.aiFollowUp.findFirst({
            where: { OR: [{ sourceEventKey }, { deduplicationKey }] },
            select: { id: true },
          });
          if (duplicate) {
            await this.writeAudit(this.db, {
              snapshot,
              outcome: 'DUPLICATE',
              reason: 'Database uniqueness suppressed a concurrent duplicate',
              followUpId: duplicate.id,
              deduplicationKey,
              now,
            });
            return {
              outcome: 'DUPLICATE',
              followUpId: duplicate.id,
              userId: snapshot.userId,
              reason: 'Concurrent duplicate authoritative event suppressed',
            };
          }
        }
        throw error;
      }
    }

    throw new Error('Unable to serialize proactive follow-up scheduling');
  }

  async dispatchFollowUp(followUpId: string): Promise<ProactiveDispatchResult> {
    for (let attempt = 0; attempt < SERIALIZATION_RETRIES; attempt += 1) {
      try {
        return await this.db.$transaction(async tx => {
          const now = this.clock();
          const followUp = await tx.aiFollowUp.findUnique({ where: { id: followUpId } });
          if (!followUp) return { outcome: 'NOT_FOUND', reason: 'Follow-up not found' } as const;
          if (followUp.status !== 'pending') {
            return {
              outcome: 'ALREADY_PROCESSED',
              followUpId,
              notificationId: followUp.notificationId ?? undefined,
              reason: `Follow-up is already ${followUp.status}`,
            } as const;
          }
          if (followUp.triggerAt.getTime() > now.getTime()) {
            return { outcome: 'NOT_DUE', followUpId, reason: 'Follow-up is not due' } as const;
          }
          if (!followUp.eventType || !followUp.relatedEntityId || !followUp.userId) {
            await this.cancelFollowUp(tx, followUpId, 'Legacy follow-up has no proactive event contract', now);
            return {
              outcome: 'CANCELLED_STALE',
              followUpId,
              reason: 'Follow-up has no proactive event contract',
            } as const;
          }
          if (followUp.expiresAt && followUp.expiresAt.getTime() <= now.getTime()) {
            await this.cancelFollowUp(tx, followUpId, 'Follow-up expired before dispatch', now);
            return { outcome: 'CANCELLED_EXPIRED', followUpId, reason: 'Follow-up expired' } as const;
          }

          const eventType = followUp.eventType as ProactiveEventType;
          const snapshot = await this.resolveAuthoritativeSnapshot(tx, eventType, followUp.relatedEntityId, now);
          const storedAudit = followUp.auditMetadata as { sourceEventId?: string } | null;
          const sourceStillCurrent = snapshot?.sourceEventId === storedAudit?.sourceEventId;
          const targetStillOwned = snapshot?.userId === followUp.userId;
          const caseStillOwned = !!(await tx.aiSupportCase.findFirst({
            where: { id: followUp.caseId, userId: followUp.userId },
            select: { id: true },
          }));

          if (!snapshot || !snapshot.eligible || !sourceStillCurrent || !targetStillOwned || !caseStillOwned) {
            await this.cancelFollowUp(tx, followUpId, 'Authoritative state or ownership no longer matches', now);
            await this.writeAudit(tx, {
              snapshot: snapshot ?? undefined,
              eventType,
              entityId: followUp.relatedEntityId,
              userId: followUp.userId,
              outcome: 'CANCELLED_STALE',
              reason: 'Authoritative state, source version, target, or case ownership changed',
              followUpId,
              now,
            });
            return {
              outcome: 'CANCELLED_STALE',
              followUpId,
              reason: 'Authoritative state no longer permits this follow-up',
            } as const;
          }

          const claimed = await tx.aiFollowUp.updateMany({
            where: { id: followUpId, status: 'pending' },
            data: {
              status: 'triggered',
              lastCheckedAt: now,
              lastAttemptAt: now,
              attemptCount: { increment: 1 },
            },
          });
          if (claimed.count !== 1) {
            return { outcome: 'ALREADY_PROCESSED', followUpId, reason: 'Another dispatcher claimed this follow-up' } as const;
          }

          const definition = getProactiveEventDefinition(eventType);
          const notification = await tx.notification.create({
            data: {
              user_id: followUp.userId,
              title: definition.title,
              message: definition.message,
              type: `AI_PROACTIVE_${eventType}`,
            },
          });
          await tx.aiFollowUp.update({
            where: { id: followUpId },
            data: { notificationId: notification.id },
          });
          await this.writeAudit(tx, {
            snapshot,
            outcome: 'DELIVERED',
            reason: 'Authoritative state recheck passed and existing notification infrastructure was used',
            followUpId,
            notificationId: notification.id,
            now,
          });
          return {
            outcome: 'DELIVERED',
            followUpId,
            notificationId: notification.id,
            reason: 'Transactional service notification created',
          } as const;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (isPrismaError(error, 'P2034') && attempt + 1 < SERIALIZATION_RETRIES) continue;
        throw error;
      }
    }
    throw new Error('Unable to serialize proactive follow-up dispatch');
  }

  private async isFeatureEnabled() {
    const setting = await this.db.systemSetting.findUnique({ where: { setting_key: FEATURE_SETTING } });
    return normalized(setting?.setting_value) === 'true';
  }

  private async isEligibleTarget(userId: string) {
    const target = await this.db.user.findUnique({ where: { id: userId }, select: { status: true } });
    return !!target && !ACTIVE_ACCOUNT_DENYLIST.has(normalized(target.status));
  }

  private async cancelFollowUp(tx: Prisma.TransactionClient, followUpId: string, reason: string, now: Date) {
    await tx.aiFollowUp.updateMany({
      where: { id: followUpId, status: 'pending' },
      data: { status: 'cancelled', lastCheckedAt: now, lastAttemptAt: now },
    });
    await tx.auditLog.create({
      data: {
        action: 'AI_PROACTIVE_CANCELLED',
        module: 'ProactiveSupportService',
        target_id: followUpId,
        details: JSON.stringify({ schemaVersion: 'p6.1', outcome: 'CANCELLED', reason, decidedAt: now.toISOString() }),
      },
    });
  }

  private async writeAudit(
    db: DatabaseClient,
    evidence: {
      snapshot?: AuthoritativeSnapshot;
      eventType?: ProactiveEventType;
      entityId?: string;
      userId?: string;
      outcome: string;
      reason: string;
      followUpId?: string;
      notificationId?: string;
      deduplicationKey?: string;
      now: Date;
    },
  ) {
    const definition = getProactiveEventDefinition(evidence.snapshot?.eventType ?? evidence.eventType!);
    const snapshot = evidence.snapshot;
    return db.auditLog.create({
      data: {
        actor_user_id: snapshot?.userId ?? evidence.userId,
        action: `AI_PROACTIVE_${evidence.outcome}`,
        module: 'ProactiveSupportService',
        target_id: evidence.followUpId ?? evidence.entityId ?? snapshot?.relatedEntityId,
        details: JSON.stringify({
          schemaVersion: 'p6.1',
          registryVersion: definition.version,
          eventType: definition.eventType,
          sourceModel: definition.sourceModel,
          sourceEventId: snapshot?.sourceEventId,
          targetUserId: snapshot?.userId ?? evidence.userId,
          relatedEntityType: snapshot?.relatedEntityType ?? definition.relatedEntityType,
          relatedEntityId: snapshot?.relatedEntityId ?? evidence.entityId,
          eligibilityRule: definition.eligibilityRule,
          deduplicationKey: evidence.deduplicationKey,
          cooldownMs: definition.cooldownMs,
          expiresAt: snapshot?.expiresAt.toISOString(),
          allowedTool: definition.allowedTool,
          outcome: evidence.outcome,
          reason: evidence.reason,
          followUpId: evidence.followUpId,
          notificationId: evidence.notificationId,
          decidedAt: evidence.now.toISOString(),
        }),
      },
    });
  }

  private async resolveAuthoritativeSnapshot(
    db: DatabaseClient,
    eventType: ProactiveEventType,
    entityId: string,
    now: Date,
  ): Promise<AuthoritativeSnapshot | null> {
    const definition = getProactiveEventDefinition(eventType);
    const expiry = (sourceOccurredAt: Date) => addMilliseconds(sourceOccurredAt, definition.expiryMs);

    if (eventType === 'PAYMENT_FAILED' || eventType === 'PAYMENT_REQUIRES_ACTION') {
      const payment = await db.payment.findUnique({
        where: { id: entityId },
        select: { id: true, user_id: true, status: true, updated_at: true, booking_id: true, booking: { select: { status: true } } },
      });
      if (!payment) return null;
      const failed = normalized(payment.status) === 'failed';
      const requiresAction = normalized(payment.status) === 'pending'
        && normalized(payment.booking.status).includes('pending payment');
      const eligible = eventType === 'PAYMENT_FAILED' ? failed : requiresAction;
      return {
        eventType,
        sourceEventId: `Payment:${payment.id}:${payment.status}:${payment.updated_at.toISOString()}`,
        sourceOccurredAt: payment.updated_at,
        userId: payment.user_id,
        relatedEntityType: 'Payment',
        relatedEntityId: payment.id,
        caseEntityType: 'Payment',
        caseEntityId: payment.id,
        eligible,
        eligibilityReason: eligible ? definition.eligibilityRule : 'Authoritative payment state does not qualify',
        expiresAt: expiry(payment.updated_at),
      };
    }

    if (eventType === 'REFUND_STATUS_CHANGED' || eventType === 'REFUND_COMPLETED') {
      const refund = await db.refundRequest.findUnique({
        where: { id: entityId },
        select: { id: true, renter_id: true, refund_status: true, updated_at: true },
      });
      if (!refund) return null;
      const status = normalized(refund.refund_status);
      const completed = status === 'processed manual placeholder';
      const changed = !['draft', 'processed manual placeholder', 'rejected', 'cancelled'].includes(status);
      const eligible = eventType === 'REFUND_COMPLETED' ? completed : changed;
      return {
        eventType,
        sourceEventId: `RefundRequest:${refund.id}:${refund.refund_status}:${refund.updated_at.toISOString()}`,
        sourceOccurredAt: refund.updated_at,
        userId: refund.renter_id,
        relatedEntityType: 'RefundRequest',
        relatedEntityId: refund.id,
        caseEntityType: 'RefundRequest',
        caseEntityId: refund.id,
        eligible,
        eligibilityReason: eligible ? definition.eligibilityRule : 'Authoritative refund state does not qualify',
        expiresAt: expiry(refund.updated_at),
      };
    }

    if (eventType === 'DEPOSIT_RELEASED' || eventType === 'DEPOSIT_ACTION_REQUIRED') {
      const action = await db.depositAction.findUnique({
        where: { id: entityId },
        select: { id: true, action_type: true, created_at: true, booking: { select: { id: true, renter_id: true } } },
      });
      if (!action) return null;
      const actionType = normalized(action.action_type);
      const eligible = eventType === 'DEPOSIT_RELEASED'
        ? actionType.startsWith('release')
        : actionType === 'hold for dispute';
      return {
        eventType,
        sourceEventId: `DepositAction:${action.id}:${action.action_type}:${action.created_at.toISOString()}`,
        sourceOccurredAt: action.created_at,
        userId: action.booking.renter_id,
        relatedEntityType: 'DepositAction',
        relatedEntityId: action.id,
        caseEntityType: 'DepositAction',
        caseEntityId: action.id,
        eligible,
        eligibilityReason: eligible ? definition.eligibilityRule : 'Authoritative deposit action does not qualify',
        expiresAt: expiry(action.created_at),
      };
    }

    if (
      eventType === 'BOOKING_RESPONSE_OVERDUE'
      || eventType === 'PROVIDER_RESPONSE_OVERDUE'
      || eventType === 'RENTAL_DUE_SOON'
      || eventType === 'RETURN_OVERDUE'
    ) {
      const booking = await db.booking.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          renter_id: true,
          provider_id: true,
          status: true,
          created_at: true,
          updated_at: true,
          end_date: true,
        },
      });
      if (!booking) return null;
      const status = normalized(booking.status);
      const pendingProvider = status === 'pending provider approval'
        && now.getTime() >= addMilliseconds(booking.created_at, definition.cooldownMs).getTime();
      const dueSoon = ['confirmed', 'ongoing'].includes(status)
        && booking.end_date.getTime() > now.getTime()
        && booking.end_date.getTime() <= addMilliseconds(now, definition.expiryMs).getTime();
      const overdue = status === 'ongoing' && booking.end_date.getTime() <= now.getTime();
      const eligible = eventType === 'RENTAL_DUE_SOON'
        ? dueSoon
        : eventType === 'RETURN_OVERDUE'
          ? overdue
          : pendingProvider;
      const userId = eventType === 'PROVIDER_RESPONSE_OVERDUE' ? booking.provider_id : booking.renter_id;
      const sourceOccurredAt = eventType === 'RENTAL_DUE_SOON' || eventType === 'RETURN_OVERDUE'
        ? booking.end_date
        : booking.updated_at;
      const expiresAt = eventType === 'RENTAL_DUE_SOON'
        ? booking.end_date
        : eventType === 'RETURN_OVERDUE'
          ? addMilliseconds(booking.end_date, definition.expiryMs)
          : expiry(booking.updated_at);
      return {
        eventType,
        sourceEventId: `Booking:${booking.id}:${booking.status}:${sourceOccurredAt.toISOString()}`,
        sourceOccurredAt,
        userId,
        relatedEntityType: 'Booking',
        relatedEntityId: booking.id,
        caseEntityType: 'Booking',
        caseEntityId: booking.id,
        eligible,
        eligibilityReason: eligible ? definition.eligibilityRule : 'Authoritative booking state or time window does not qualify',
        expiresAt,
      };
    }

    if (eventType === 'CLAIM_EVIDENCE_REQUIRED' || eventType === 'CLAIM_STATUS_CHANGED') {
      const claim = await db.damageClaim.findUnique({
        where: { id: entityId },
        select: { id: true, renter_id: true, claim_status: true, updated_at: true },
      });
      if (!claim) return null;
      const status = normalized(claim.claim_status);
      const eligible = eventType === 'CLAIM_EVIDENCE_REQUIRED'
        ? status === 'renter response pending'
        : status !== 'draft';
      return {
        eventType,
        sourceEventId: `DamageClaim:${claim.id}:${claim.claim_status}:${claim.updated_at.toISOString()}`,
        sourceOccurredAt: claim.updated_at,
        userId: claim.renter_id,
        relatedEntityType: 'DamageClaim',
        relatedEntityId: claim.id,
        caseEntityType: 'DamageClaim',
        caseEntityId: claim.id,
        eligible,
        eligibilityReason: eligible ? definition.eligibilityRule : 'Authoritative claim state does not qualify',
        expiresAt: expiry(claim.updated_at),
      };
    }

    if (eventType === 'INSURANCE_STATUS_CHANGED') {
      const policy = await db.insurancePolicy.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          status: true,
          updated_at: true,
          booking: { select: { id: true, renter_id: true } },
        },
      });
      if (!policy) return null;
      return {
        eventType,
        sourceEventId: `InsurancePolicy:${policy.id}:${policy.status}:${policy.updated_at.toISOString()}`,
        sourceOccurredAt: policy.updated_at,
        userId: policy.booking.renter_id,
        relatedEntityType: 'InsurancePolicy',
        relatedEntityId: policy.id,
        caseEntityType: 'Booking',
        caseEntityId: policy.booking.id,
        eligible: true,
        eligibilityReason: definition.eligibilityRule,
        expiresAt: expiry(policy.updated_at),
      };
    }

    const user = await db.user.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        updated_at: true,
        profile: { select: { verification_status: true } },
        businessProfile: { select: { verification_status: true } },
      },
    });
    if (!user) return null;
    const verificationStatus = user.profile?.verification_status
      ?? user.businessProfile?.verification_status
      ?? 'Unverified';
    const eligible = ['unverified', 'rejected'].includes(normalized(verificationStatus));
    return {
      eventType,
      sourceEventId: `UserKyc:${user.id}:${verificationStatus}:${user.updated_at.toISOString()}`,
      sourceOccurredAt: user.updated_at,
      userId: user.id,
      relatedEntityType: 'User',
      relatedEntityId: user.id,
      caseEntityType: 'User',
      caseEntityId: user.id,
      eligible,
      eligibilityReason: eligible ? definition.eligibilityRule : 'Authoritative KYC state does not require action',
      expiresAt: expiry(user.updated_at),
    };
  }
}
