/**
 * RENTipid GLOBAL-MKT / v2.0 — Global Booking Policy Contract
 *
 * Defines jurisdiction-level rental policies, verification dependencies,
 * advance notice restrictions, and cancellation references.
 */

export interface BookingPolicy {
  readonly jurisdictionCode: string;
  readonly jurisdictionName: string;
  readonly minRentalDurationHours: number;
  readonly maxRentalDurationDays: number;
  readonly minAdvanceNoticeHours: number;
  readonly allowInstantBooking: boolean;
  readonly requiresRenterKyc: boolean;
  readonly requiresProviderKyc: boolean;
  readonly securityDepositAllowed: boolean;
  readonly defaultCancellationPolicyRef: string;
  readonly currencyAuthority: string;
  readonly primaryTimezone: string;
}
