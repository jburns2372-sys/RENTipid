/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Booking Lifecycle Contracts
 *
 * Implements the 15-state typed booking/rental state machine, transition guards,
 * and actor-specific transition authorization.
 */

export const BOOKING_LIFECYCLE_STATES = [
  'DRAFT',
  'INITIATED',
  'REQUESTED',
  'PENDING_PROVIDER',
  'ACCEPTED',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'READY_FOR_HANDOVER',
  'ACTIVE',
  'RETURN_PENDING',
  'COMPLETED',
  'DECLINED',
  'CANCELLED',
  'EXPIRED',
  'SUSPENDED',
  'DISPUTED',
] as const;

export type BookingLifecycleState = (typeof BOOKING_LIFECYCLE_STATES)[number];
export type BookingLifecycleStatus = BookingLifecycleState; // Alias

export const ALL_BOOKING_LIFECYCLE_STATES: readonly BookingLifecycleState[] = Object.freeze([
  ...BOOKING_LIFECYCLE_STATES,
]);

/**
 * Authoritative legal transition table for marketplace bookings.
 */
export const LEGAL_BOOKING_TRANSITIONS: Readonly<Record<BookingLifecycleState, readonly BookingLifecycleState[]>> = Object.freeze({
  DRAFT: ['INITIATED', 'REQUESTED', 'CANCELLED'],
  INITIATED: ['REQUESTED', 'CANCELLED'],
  REQUESTED: ['PENDING_PROVIDER', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'],
  PENDING_PROVIDER: ['ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'],
  ACCEPTED: ['AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED'],
  AWAITING_PAYMENT: ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['READY_FOR_HANDOVER', 'ACTIVE', 'CANCELLED', 'SUSPENDED', 'DISPUTED'],
  READY_FOR_HANDOVER: ['ACTIVE', 'CANCELLED', 'SUSPENDED', 'DISPUTED'],
  ACTIVE: ['RETURN_PENDING', 'COMPLETED', 'DISPUTED', 'SUSPENDED'],
  RETURN_PENDING: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['DISPUTED'], // Can transition to disputed if post-return damage/issue raised
  DECLINED: [], // Terminal
  CANCELLED: [], // Terminal
  EXPIRED: [], // Terminal
  SUSPENDED: ['CONFIRMED', 'ACTIVE', 'CANCELLED', 'DISPUTED'],
  DISPUTED: ['COMPLETED', 'CANCELLED', 'SUSPENDED'],
});

/**
 * Validates whether a state transition is legally allowed by the state machine.
 */
export function canTransitionBookingStatus(
  current: BookingLifecycleState,
  target: BookingLifecycleState
): boolean {
  if (current === target) return true;
  const allowed = LEGAL_BOOKING_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}

/**
 * Statuses that represent an active reservation which blocks availability of the listing.
 */
export const AVAILABILITY_BLOCKING_STATUSES: readonly BookingLifecycleState[] = Object.freeze([
  'REQUESTED',
  'PENDING_PROVIDER',
  'ACCEPTED',
  'AWAITING_PAYMENT',
  'CONFIRMED',
  'READY_FOR_HANDOVER',
  'ACTIVE',
  'RETURN_PENDING',
]);

export function isBookingBlockingAvailability(status: BookingLifecycleState): boolean {
  return AVAILABILITY_BLOCKING_STATUSES.includes(status);
}

/**
 * Terminal states that cannot transition further.
 */
export const TERMINAL_BOOKING_STATUSES: readonly BookingLifecycleState[] = Object.freeze([
  'DECLINED',
  'CANCELLED',
  'EXPIRED',
]);

export function isTerminalBookingStatus(status: BookingLifecycleState): boolean {
  return TERMINAL_BOOKING_STATUSES.includes(status);
}

export interface TransitionActor {
  readonly userId: string;
  readonly role?: string; // 'Renter' | 'Individual Provider' | 'Business Provider' | 'Super Admin' | 'System'
}

export interface TransitionContext {
  readonly renterId: string;
  readonly providerId: string;
  readonly currentStatus: BookingLifecycleState;
  readonly hasAuthoritativePayment?: boolean;
}

/**
 * Validates actor permissions for a target booking transition.
 * Ensures renters, providers, and admins cannot exceed their authoritative domains.
 */
export function canActorPerformTransition(
  actor: TransitionActor,
  context: TransitionContext,
  targetStatus: BookingLifecycleState
): { allowed: boolean; reason?: string } {
  const { userId, role } = actor;
  const { renterId, providerId, currentStatus, hasAuthoritativePayment } = context;

  // 1. Verify basic state machine transition legality
  if (!canTransitionBookingStatus(currentStatus, targetStatus)) {
    return {
      allowed: false,
      reason: `ILLEGAL_TRANSITION: Cannot transition booking from '${currentStatus}' to '${targetStatus}'.`,
    };
  }

  const isAdmin = ['Admin', 'ADMIN', 'Super Admin', 'SUPER_ADMIN'].includes(role || '');
  const isSystem = role === 'System' || role === 'SYSTEM';

  if (isAdmin || isSystem) {
    // Admin/System can execute any legal transition, but CONFIRMED from AWAITING_PAYMENT still requires payment evidence!
    if (targetStatus === 'CONFIRMED' && currentStatus === 'AWAITING_PAYMENT' && !hasAuthoritativePayment && !isAdmin) {
      return {
        allowed: false,
        reason: 'PAYMENT_EVIDENCE_REQUIRED: Cannot confirm booking without authoritative payment verification.',
      };
    }
    return { allowed: true };
  }

  const isRenter = userId === renterId;
  const isProvider = userId === providerId;

  if (!isRenter && !isProvider) {
    return {
      allowed: false,
      reason: 'UNAUTHORIZED: User is neither the renter nor the provider for this booking.',
    };
  }

  // 2. Renter allowed transitions
  if (isRenter) {
    // Renter can request, cancel before active, return item
    if (targetStatus === 'REQUESTED' && (currentStatus === 'DRAFT' || currentStatus === 'INITIATED')) {
      return { allowed: true };
    }
    if (targetStatus === 'CANCELLED' && ['REQUESTED', 'PENDING_PROVIDER', 'ACCEPTED', 'AWAITING_PAYMENT', 'CONFIRMED'].includes(currentStatus)) {
      return { allowed: true };
    }
    if (targetStatus === 'RETURN_PENDING' && currentStatus === 'ACTIVE') {
      return { allowed: true };
    }
    if (targetStatus === 'DISPUTED' && ['ACTIVE', 'RETURN_PENDING', 'COMPLETED'].includes(currentStatus)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `RENTER_FORBIDDEN: Renter cannot execute transition to '${targetStatus}'.`,
    };
  }

  // 3. Provider allowed transitions
  if (isProvider) {
    // Provider can accept, decline, ready for handover, complete after return
    if (['ACCEPTED', 'DECLINED'].includes(targetStatus) && ['REQUESTED', 'PENDING_PROVIDER'].includes(currentStatus)) {
      return { allowed: true };
    }
    if (targetStatus === 'READY_FOR_HANDOVER' && currentStatus === 'CONFIRMED') {
      return { allowed: true };
    }
    if (targetStatus === 'ACTIVE' && currentStatus === 'READY_FOR_HANDOVER') {
      return { allowed: true };
    }
    if (targetStatus === 'COMPLETED' && (currentStatus === 'RETURN_PENDING' || currentStatus === 'ACTIVE')) {
      return { allowed: true };
    }
    if (targetStatus === 'DISPUTED' && ['ACTIVE', 'RETURN_PENDING', 'COMPLETED'].includes(currentStatus)) {
      return { allowed: true };
    }
    if (targetStatus === 'CANCELLED' && ['REQUESTED', 'PENDING_PROVIDER', 'ACCEPTED', 'CONFIRMED'].includes(currentStatus)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `PROVIDER_FORBIDDEN: Provider cannot execute transition to '${targetStatus}'.`,
    };
  }

  return { allowed: false, reason: 'UNAUTHORIZED: Action not permitted.' };
}
