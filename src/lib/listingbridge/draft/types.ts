export interface ListingBridgeDraftCreationInput {
  readonly actorUserId: string;
  readonly importJobId: string;
  readonly idempotencyKey?: string;
  readonly correlationId?: string;
  readonly ipAddress?: string;
}

export interface NativeListingDraftPayload {
  readonly provider_id: string;
  readonly category_id?: string;
  readonly title: string;
  readonly description?: string;
  readonly location?: string;
  readonly city?: string;
  readonly province?: string;
  readonly country?: string;
  readonly rental_type?: string;
  readonly daily_rate?: number;
  readonly hourly_rate?: number;
  readonly weekly_rate?: number;
  readonly monthly_rate?: number;
  readonly security_deposit?: number;
  readonly replacement_value?: number;
  readonly quantity?: number;
  readonly condition?: string;
  readonly pickup_available?: boolean;
  readonly delivery_available?: boolean;
  readonly delivery_fee?: number;
  readonly min_duration?: number;
  readonly max_duration?: number;
  readonly rules?: string;
  readonly status: 'Draft';
}

export interface ListingBridgeDraftCreationResult {
  readonly success: boolean;
  readonly importJobId: string;
  readonly listingId?: string;
  readonly isReusedIdempotently?: boolean;
  readonly status?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly blockingReasons?: readonly string[];
  readonly createdAt?: string;
}

export interface ListingAuthorityAdapter {
  createDraft(
    providerId: string,
    data: NativeListingDraftPayload,
  ): Promise<{ id: string; status: string; [key: string]: unknown }>;
}
