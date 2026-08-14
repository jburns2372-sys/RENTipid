import { prisma } from '@/lib/prisma';

export type AiEntityType =
  | 'Booking'
  | 'Listing'
  | 'Payment'
  | 'RefundRequest'
  | 'DepositAction'
  | 'DamageClaim'
  | 'DisputeCase'
  | 'ProviderPayout'
  | 'User';

export interface AiEntityHint {
  entityType: AiEntityType;
  entityId: string;
}

export class AiEntityAccessError extends Error {
  constructor(message: string, readonly code: 'NOT_FOUND' | 'UNAUTHORIZED') {
    super(message);
    this.name = 'AiEntityAccessError';
  }
}

function normalizedModule(module: string) {
  return module.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function resolveAiEntityHint(module: string, recordId: string | undefined, userId: string): AiEntityHint | undefined {
  const normalized = normalizedModule(module);
  if (normalized.includes('kyc') || normalized === 'account') {
    return { entityType: 'User', entityId: userId };
  }
  if (!recordId) return undefined;

  let entityType: AiEntityType | undefined;
  if (normalized.includes('booking') || normalized.includes('rental')) entityType = 'Booking';
  else if (normalized.includes('listing')) entityType = 'Listing';
  else if (normalized.includes('payment')) entityType = 'Payment';
  else if (normalized.includes('refund')) entityType = 'RefundRequest';
  else if (normalized.includes('deposit')) entityType = 'DepositAction';
  else if (normalized.includes('claim') || normalized.includes('damage')) entityType = 'DamageClaim';
  else if (normalized.includes('dispute')) entityType = 'DisputeCase';
  else if (normalized.includes('payout')) entityType = 'ProviderPayout';
  return entityType ? { entityType, entityId: recordId } : undefined;
}

function deny(entityType: AiEntityType): never {
  throw new AiEntityAccessError(`The ${entityType} is not available to this account`, 'UNAUTHORIZED');
}

export async function assertAiEntityAccess(userId: string, entityType: AiEntityType, entityId: string): Promise<void> {
  let allowed = false;

  switch (entityType) {
    case 'User':
      allowed = entityId === userId && !!(await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }));
      break;
    case 'Booking':
      allowed = !!(await prisma.booking.findFirst({
        where: { id: entityId, OR: [{ renter_id: userId }, { provider_id: userId }] },
        select: { id: true },
      }));
      break;
    case 'Listing':
      allowed = !!(await prisma.listing.findFirst({ where: { id: entityId, provider_id: userId }, select: { id: true } }));
      break;
    case 'Payment':
      allowed = !!(await prisma.payment.findFirst({
        where: {
          id: entityId,
          OR: [{ user_id: userId }, { booking: { is: { OR: [{ renter_id: userId }, { provider_id: userId }] } } }],
        },
        select: { id: true },
      }));
      break;
    case 'RefundRequest':
      allowed = !!(await prisma.refundRequest.findFirst({
        where: { id: entityId, OR: [{ renter_id: userId }, { provider_id: userId }, { requested_by: userId }] },
        select: { id: true },
      }));
      break;
    case 'DepositAction':
      allowed = !!(await prisma.depositAction.findFirst({
        where: { id: entityId, booking: { is: { OR: [{ renter_id: userId }, { provider_id: userId }] } } },
        select: { id: true },
      }));
      break;
    case 'DamageClaim':
      allowed = !!(await prisma.damageClaim.findFirst({
        where: { id: entityId, OR: [{ renter_id: userId }, { provider_id: userId }] },
        select: { id: true },
      }));
      break;
    case 'DisputeCase':
      allowed = !!(await prisma.disputeCase.findFirst({
        where: { id: entityId, booking: { is: { OR: [{ renter_id: userId }, { provider_id: userId }] } } },
        select: { id: true },
      }));
      break;
    case 'ProviderPayout':
      allowed = !!(await prisma.providerPayout.findFirst({ where: { id: entityId, provider_id: userId }, select: { id: true } }));
      break;
  }

  if (!allowed) deny(entityType);
}

export async function loadAuthorizedAiDomainState(
  userId: string,
  entityType: AiEntityType,
  entityId: string,
): Promise<string> {
  await assertAiEntityAccess(userId, entityType, entityId);

  switch (entityType) {
    case 'User': {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          status: true,
          profile: { select: { verification_status: true } },
          businessProfile: { select: { verification_status: true } },
          updated_at: true,
        },
      });
      return `Authoritative account state: account=${user?.status}; identity=${user?.profile?.verification_status ?? user?.businessProfile?.verification_status ?? 'Unverified'}; refreshedAt=${user?.updated_at.toISOString()}`;
    }
    case 'Booking': {
      const booking = await prisma.booking.findUnique({
        where: { id: entityId },
        select: { status: true, payment_status: true, updated_at: true },
      });
      return `Authoritative booking state: status=${booking?.status}; payment=${booking?.payment_status}; refreshedAt=${booking?.updated_at.toISOString()}`;
    }
    case 'Listing': {
      const listing = await prisma.listing.findUnique({
        where: { id: entityId },
        select: { status: true, updated_at: true },
      });
      return `Authoritative listing state: status=${listing?.status}; refreshedAt=${listing?.updated_at.toISOString()}`;
    }
    case 'Payment': {
      const payment = await prisma.payment.findUnique({
        where: { id: entityId },
        select: { status: true, type: true, updated_at: true },
      });
      return `Authoritative payment state: status=${payment?.status}; type=${payment?.type}; refreshedAt=${payment?.updated_at.toISOString()}`;
    }
    case 'RefundRequest': {
      const refund = await prisma.refundRequest.findUnique({
        where: { id: entityId },
        select: { refund_status: true, updated_at: true },
      });
      return `Authoritative refund state: status=${refund?.refund_status}; refreshedAt=${refund?.updated_at.toISOString()}`;
    }
    case 'DepositAction': {
      const deposit = await prisma.depositAction.findUnique({
        where: { id: entityId },
        select: { action_type: true, created_at: true },
      });
      return `Authoritative deposit state: latestAction=${deposit?.action_type}; refreshedAt=${deposit?.created_at.toISOString()}`;
    }
    case 'DamageClaim': {
      const claim = await prisma.damageClaim.findUnique({
        where: { id: entityId },
        select: { claim_status: true, updated_at: true },
      });
      return `Authoritative claim state: status=${claim?.claim_status}; refreshedAt=${claim?.updated_at.toISOString()}`;
    }
    case 'DisputeCase': {
      const dispute = await prisma.disputeCase.findUnique({
        where: { id: entityId },
        select: { dispute_status: true, updated_at: true },
      });
      return `Authoritative dispute state: status=${dispute?.dispute_status}; refreshedAt=${dispute?.updated_at.toISOString()}`;
    }
    case 'ProviderPayout': {
      const payout = await prisma.providerPayout.findUnique({
        where: { id: entityId },
        select: { payout_status: true, updated_at: true },
      });
      return `Authoritative payout state: status=${payout?.payout_status}; refreshedAt=${payout?.updated_at.toISOString()}`;
    }
  }
}
