import type { ListingBridgeReviewSnapshot, ReviewFieldModel } from '../review/types';
import type { NativeListingDraftPayload } from './types';

export class ListingBridgeDraftPayloadMapper {
  /**
   * Maps a validated ListingBridge review snapshot to a native RENTipid draft payload.
   * Guarantees:
   * - Prohibited fields are excluded.
   * - Unresolved/conflicting fields are never silently mapped.
   * - Status is strictly 'Draft'.
   */
  mapToNativeDraft(
    snapshot: ListingBridgeReviewSnapshot,
    overrideCategoryId?: string,
  ): NativeListingDraftPayload {
    const getField = (name: string): ReviewFieldModel | undefined =>
      snapshot.fields.find((f) => f.fieldName === name);

    const getUsableValue = (name: string): unknown => {
      const field = getField(name);
      if (!field) return undefined;
      // Prohibited fields are NEVER mapped
      if (field.confidenceState === 'PROHIBITED') return undefined;
      // Blocking or conflicting fields without resolution are not usable
      if (field.isBlocking || field.confidenceState === 'CONFLICT') return undefined;
      return field.normalizedValue;
    };

    const titleVal = getUsableValue('title');
    const title = typeof titleVal === 'string' && titleVal.trim().length >= 3
      ? titleVal.trim()
      : 'Imported Listing Draft';

    const descVal = getUsableValue('description');
    const description = typeof descVal === 'string' ? descVal.trim() : undefined;

    // Location mapping from validated location intelligence
    const loc = snapshot.location.normalizedAddress;
    const location = loc?.formattedAddress || loc?.addressLine1 || undefined;
    const city = loc?.locality || undefined;
    const province = loc?.administrativeArea1 || undefined;
    const country = loc?.countryCode || 'Philippines';

    // Pricing / Commercial hints mapping
    const pricingVal = getUsableValue('pricingHints') as
      | {
          currency?: string;
          baseRate?: { amount: number; interval?: string };
          securityDeposit?: number;
          cleaningFee?: number;
          extraGuestFee?: number;
        }
      | undefined;

    const dailyRate = pricingVal?.baseRate?.amount || undefined;
    const securityDeposit = pricingVal?.securityDeposit || undefined;

    // Rules mapping
    const rulesVal = getUsableValue('rules');
    const rules = typeof rulesVal === 'string'
      ? rulesVal
      : rulesVal && typeof rulesVal === 'object'
        ? JSON.stringify(rulesVal)
        : undefined;

    // Condition mapping
    const condVal = getUsableValue('condition');
    const condition = typeof condVal === 'string' ? condVal : 'Good';

    // Category mapping: override or property type slug
    const propertyTypeVal = getUsableValue('propertyType');
    const categoryId = overrideCategoryId || (typeof propertyTypeVal === 'string' ? propertyTypeVal : undefined);

    return Object.freeze({
      provider_id: snapshot.providerId,
      category_id: categoryId,
      title,
      description,
      location,
      city,
      province,
      country,
      rental_type: 'Daily',
      daily_rate: dailyRate,
      security_deposit: securityDeposit,
      quantity: 1,
      condition,
      pickup_available: true,
      delivery_available: false,
      rules,
      status: 'Draft' as const, // Strict RENTipid native draft status
    });
  }
}
