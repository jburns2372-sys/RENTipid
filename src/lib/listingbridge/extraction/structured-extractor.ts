import { computeSha256 } from '../utils/idempotency';
import { ListingBridgeExtractionEnvelope } from './envelope';

export interface RawCandidateFact {
  readonly sourceField: string;
  readonly rawValue: unknown;
  readonly valueHash: string;
}

export interface ExtractedCandidateMedia {
  readonly url: string;
  readonly caption?: string;
  readonly isCover: boolean;
  readonly order: number;
}

export interface ExtractedCandidateRoom {
  readonly name?: string;
  readonly roomType?: string;
  readonly bedCount?: number;
  readonly sleeps?: number;
}

export interface ExtractedCandidateFacts {
  readonly title?: RawCandidateFact;
  readonly description?: RawCandidateFact;
  readonly propertyType?: RawCandidateFact;
  readonly condition?: RawCandidateFact;
  readonly location: {
    readonly rawLocationString?: RawCandidateFact;
    readonly city?: RawCandidateFact;
    readonly province?: RawCandidateFact;
    readonly country?: RawCandidateFact;
    readonly postalCode?: RawCandidateFact;
    readonly latitude?: RawCandidateFact;
    readonly longitude?: RawCandidateFact;
  };
  readonly capacity: {
    readonly quantity?: RawCandidateFact;
    readonly maxGuests?: RawCandidateFact;
    readonly bedrooms?: RawCandidateFact;
    readonly bathrooms?: RawCandidateFact;
    readonly beds?: RawCandidateFact;
  };
  readonly rooms: readonly ExtractedCandidateRoom[];
  readonly amenities: readonly RawCandidateFact[];
  readonly rules: {
    readonly generalRules?: RawCandidateFact;
    readonly minDuration?: RawCandidateFact;
    readonly maxDuration?: RawCandidateFact;
    readonly pickupAvailable?: RawCandidateFact;
    readonly deliveryAvailable?: RawCandidateFact;
    readonly deliveryFee?: RawCandidateFact;
  };
  readonly pricingHints: {
    readonly hourlyRate?: RawCandidateFact;
    readonly dailyRate?: RawCandidateFact;
    readonly weeklyRate?: RawCandidateFact;
    readonly monthlyRate?: RawCandidateFact;
    readonly securityDeposit?: RawCandidateFact;
    readonly replacementValue?: RawCandidateFact;
    readonly currency?: RawCandidateFact;
  };
  readonly availability: {
    readonly availabilityStart?: RawCandidateFact;
    readonly availabilityEnd?: RawCandidateFact;
  };
  readonly media: readonly ExtractedCandidateMedia[];
  readonly prohibitedCandidates: readonly RawCandidateFact[];
  readonly rawPayloadHash: string;
}

function makeFact(sourceField: string, rawValue: unknown): RawCandidateFact {
  const serialized = typeof rawValue === 'object' && rawValue !== null ? JSON.stringify(rawValue) : String(rawValue ?? '');
  return Object.freeze({
    sourceField,
    rawValue,
    valueHash: computeSha256(serialized),
  });
}

function getFirstMatchingValue(obj: Record<string, unknown>, aliases: readonly string[]): { field: string; value: unknown } | undefined {
  for (const alias of aliases) {
    if (alias in obj && obj[alias] !== undefined && obj[alias] !== null && obj[alias] !== '') {
      return { field: alias, value: obj[alias] };
    }
  }
  return undefined;
}

export class StructuredFactExtractor {
  extract(envelope: ListingBridgeExtractionEnvelope): ExtractedCandidateFacts {
    let payload: Record<string, unknown> = {};

    if (typeof envelope.payload === 'string') {
      try {
        const parsed = JSON.parse(envelope.payload);
        if (typeof parsed === 'object' && parsed !== null) {
          payload = parsed as Record<string, unknown>;
        }
      } catch {
        payload = { rawText: envelope.payload };
      }
    } else if (typeof envelope.payload === 'object' && envelope.payload !== null) {
      payload = envelope.payload as Record<string, unknown>;
    }

    const rawPayloadHash = computeSha256(JSON.stringify(envelope.payload ?? {}));

    // Title
    const titleMatch = getFirstMatchingValue(payload, ['title', 'name', 'headline', 'listing_title', 'property_title', 'og:title']);
    const title = titleMatch ? makeFact(titleMatch.field, titleMatch.value) : undefined;

    // Description
    const descMatch = getFirstMatchingValue(payload, ['description', 'summary', 'details', 'body', 'about', 'og:description']);
    const description = descMatch ? makeFact(descMatch.field, descMatch.value) : undefined;

    // Property Type
    const propTypeMatch = getFirstMatchingValue(payload, ['propertyType', 'property_type', 'category', 'category_slug', 'type', 'room_type', 'item_type']);
    const propertyType = propTypeMatch ? makeFact(propTypeMatch.field, propTypeMatch.value) : undefined;

    // Condition
    const condMatch = getFirstMatchingValue(payload, ['condition', 'item_condition', 'state']);
    const condition = condMatch ? makeFact(condMatch.field, condMatch.value) : undefined;

    // Location
    const locObj = (typeof payload.location === 'object' && payload.location !== null ? payload.location : payload) as Record<string, unknown>;
    const rawLocMatch = getFirstMatchingValue(locObj, ['rawLocationString', 'formattedAddress', 'address', 'full_address', 'location_string']);
    const cityMatch = getFirstMatchingValue(locObj, ['city', 'locality', 'town']);
    const provMatch = getFirstMatchingValue(locObj, ['province', 'state', 'region', 'administrativeArea1']);
    const countryMatch = getFirstMatchingValue(locObj, ['country', 'countryCode', 'nation']);
    const postalMatch = getFirstMatchingValue(locObj, ['postalCode', 'postal_code', 'zip', 'zipcode']);
    const latMatch = getFirstMatchingValue(locObj, ['latitude', 'lat']);
    const lngMatch = getFirstMatchingValue(locObj, ['longitude', 'lng', 'lon']);

    // Capacity
    const capObj = (typeof payload.capacity === 'object' && payload.capacity !== null ? payload.capacity : payload) as Record<string, unknown>;
    const qtyMatch = getFirstMatchingValue(capObj, ['quantity', 'qty', 'count', 'units']);
    const guestsMatch = getFirstMatchingValue(capObj, ['maxGuests', 'max_guests', 'guests', 'accommodates', 'capacity', 'occupancy']);
    const bedMatch = getFirstMatchingValue(capObj, ['bedrooms', 'bedroom_count', 'rooms_count']);
    const bathMatch = getFirstMatchingValue(capObj, ['bathrooms', 'bathroom_count', 'baths']);
    const bedsMatch = getFirstMatchingValue(capObj, ['beds', 'bed_count']);

    // Rooms
    const rooms: ExtractedCandidateRoom[] = [];
    if (Array.isArray(payload.rooms)) {
      for (const r of payload.rooms) {
        if (typeof r === 'object' && r !== null) {
          const roomObj = r as Record<string, unknown>;
          rooms.push({
            name: typeof roomObj.name === 'string' ? roomObj.name : undefined,
            roomType: typeof roomObj.roomType === 'string' ? roomObj.roomType : (typeof roomObj.type === 'string' ? roomObj.type : undefined),
            bedCount: typeof roomObj.bedCount === 'number' ? roomObj.bedCount : (typeof roomObj.beds === 'number' ? roomObj.beds : undefined),
            sleeps: typeof roomObj.sleeps === 'number' ? roomObj.sleeps : (typeof roomObj.capacity === 'number' ? roomObj.capacity : undefined),
          });
        }
      }
    }

    // Amenities
    const amenities: RawCandidateFact[] = [];
    const rawAmenities = payload.amenities ?? payload.features ?? payload.inclusions ?? payload.perks;
    if (Array.isArray(rawAmenities)) {
      for (let i = 0; i < rawAmenities.length; i++) {
        const item = rawAmenities[i];
        if (typeof item === 'string' && item.trim()) {
          amenities.push(makeFact(`amenities[${i}]`, item.trim()));
        } else if (typeof item === 'object' && item !== null && 'name' in item && typeof item.name === 'string') {
          amenities.push(makeFact(`amenities[${i}].name`, item.name.trim()));
        }
      }
    }

    // Rules
    const rulesObj = (typeof payload.rules === 'object' && payload.rules !== null ? payload.rules : payload) as Record<string, unknown>;
    const genRulesMatch = getFirstMatchingValue(rulesObj, ['generalRules', 'house_rules', 'rules', 'terms', 'policies']);
    const minDurMatch = getFirstMatchingValue(rulesObj, ['minDuration', 'min_duration', 'min_nights', 'minimum_stay']);
    const maxDurMatch = getFirstMatchingValue(rulesObj, ['maxDuration', 'max_duration', 'max_nights', 'maximum_stay']);
    const pickupMatch = getFirstMatchingValue(rulesObj, ['pickupAvailable', 'pickup_available', 'pickup']);
    const deliveryMatch = getFirstMatchingValue(rulesObj, ['deliveryAvailable', 'delivery_available', 'delivery']);
    const delFeeMatch = getFirstMatchingValue(rulesObj, ['deliveryFee', 'delivery_fee', 'shipping_fee']);

    // Pricing
    const pricingObj = (typeof payload.pricingHints === 'object' && payload.pricingHints !== null
      ? payload.pricingHints
      : (typeof payload.pricing === 'object' && payload.pricing !== null ? payload.pricing : payload)) as Record<string, unknown>;
    const hrMatch = getFirstMatchingValue(pricingObj, ['hourlyRate', 'hourly_rate', 'hour_price', 'rate_per_hour']);
    const dailyMatch = getFirstMatchingValue(pricingObj, ['dailyRate', 'daily_rate', 'price', 'rate', 'price_per_day', 'daily_price']);
    const weeklyMatch = getFirstMatchingValue(pricingObj, ['weeklyRate', 'weekly_rate', 'price_per_week']);
    const monthlyMatch = getFirstMatchingValue(pricingObj, ['monthlyRate', 'monthly_rate', 'price_per_month']);
    const depositMatch = getFirstMatchingValue(pricingObj, ['securityDeposit', 'security_deposit', 'deposit', 'bond']);
    const repValMatch = getFirstMatchingValue(pricingObj, ['replacementValue', 'replacement_value', 'value', 'declared_value']);
    const currMatch = getFirstMatchingValue(pricingObj, ['currency', 'curr', 'price_currency']);

    // Availability
    const availObj = (typeof payload.availability === 'object' && payload.availability !== null ? payload.availability : payload) as Record<string, unknown>;
    const startMatch = getFirstMatchingValue(availObj, ['availabilityStart', 'available_from', 'start_date']);
    const endMatch = getFirstMatchingValue(availObj, ['availabilityEnd', 'available_until', 'end_date']);

    // Media
    const media: ExtractedCandidateMedia[] = [];
    const rawMedia = payload.media ?? payload.images ?? payload.photos ?? payload.pictures;
    if (Array.isArray(rawMedia)) {
      for (let i = 0; i < rawMedia.length; i++) {
        const item = rawMedia[i];
        if (typeof item === 'string' && item.trim()) {
          media.push({
            url: item.trim(),
            isCover: i === 0,
            order: i + 1,
          });
        } else if (typeof item === 'object' && item !== null) {
          const mObj = item as Record<string, unknown>;
          const urlMatch = getFirstMatchingValue(mObj, ['url', 'src', 'link', 'image_url']);
          if (urlMatch && typeof urlMatch.value === 'string') {
            media.push({
              url: urlMatch.value.trim(),
              caption: typeof mObj.caption === 'string' ? mObj.caption : undefined,
              isCover: mObj.isCover === true || mObj.is_cover === true || i === 0,
              order: typeof mObj.order === 'number' ? mObj.order : i + 1,
            });
          }
        }
      }
    }

    // Prohibited candidate extraction (guest messages, reviews, ratings, user tokens, etc.)
    const prohibitedCandidates: RawCandidateFact[] = [];
    const prohibitedAliases = [
      'reviews', 'ratings', 'rating', 'review_count', 'stars',
      'guest_reviews', 'user_reviews', 'guest_messages', 'messages',
      'guest_id', 'guest_name', 'renter_name', 'buyer_id',
      'credit_card', 'card_number', 'cvv', 'bank_account',
      'token', 'access_token', 'secret', 'password', 'api_key',
      'superhost', 'badge', 'ranking', 'analytics', 'views_count',
    ];

    for (const key of prohibitedAliases) {
      if (key in payload && payload[key] !== undefined && payload[key] !== null) {
        prohibitedCandidates.push(makeFact(key, payload[key]));
      }
    }

    return Object.freeze({
      title,
      description,
      propertyType,
      condition,
      location: Object.freeze({
        rawLocationString: rawLocMatch ? makeFact(rawLocMatch.field, rawLocMatch.value) : undefined,
        city: cityMatch ? makeFact(cityMatch.field, cityMatch.value) : undefined,
        province: provMatch ? makeFact(provMatch.field, provMatch.value) : undefined,
        country: countryMatch ? makeFact(countryMatch.field, countryMatch.value) : undefined,
        postalCode: postalMatch ? makeFact(postalMatch.field, postalMatch.value) : undefined,
        latitude: latMatch ? makeFact(latMatch.field, latMatch.value) : undefined,
        longitude: lngMatch ? makeFact(lngMatch.field, lngMatch.value) : undefined,
      }),
      capacity: Object.freeze({
        quantity: qtyMatch ? makeFact(qtyMatch.field, qtyMatch.value) : undefined,
        maxGuests: guestsMatch ? makeFact(guestsMatch.field, guestsMatch.value) : undefined,
        bedrooms: bedMatch ? makeFact(bedMatch.field, bedMatch.value) : undefined,
        bathrooms: bathMatch ? makeFact(bathMatch.field, bathMatch.value) : undefined,
        beds: bedsMatch ? makeFact(bedsMatch.field, bedsMatch.value) : undefined,
      }),
      rooms: Object.freeze(rooms),
      amenities: Object.freeze(amenities),
      rules: Object.freeze({
        generalRules: genRulesMatch ? makeFact(genRulesMatch.field, genRulesMatch.value) : undefined,
        minDuration: minDurMatch ? makeFact(minDurMatch.field, minDurMatch.value) : undefined,
        maxDuration: maxDurMatch ? makeFact(maxDurMatch.field, maxDurMatch.value) : undefined,
        pickupAvailable: pickupMatch ? makeFact(pickupMatch.field, pickupMatch.value) : undefined,
        deliveryAvailable: deliveryMatch ? makeFact(deliveryMatch.field, deliveryMatch.value) : undefined,
        deliveryFee: delFeeMatch ? makeFact(delFeeMatch.field, delFeeMatch.value) : undefined,
      }),
      pricingHints: Object.freeze({
        hourlyRate: hrMatch ? makeFact(hrMatch.field, hrMatch.value) : undefined,
        dailyRate: dailyMatch ? makeFact(dailyMatch.field, dailyMatch.value) : undefined,
        weeklyRate: weeklyMatch ? makeFact(weeklyMatch.field, weeklyMatch.value) : undefined,
        monthlyRate: monthlyMatch ? makeFact(monthlyMatch.field, monthlyMatch.value) : undefined,
        securityDeposit: depositMatch ? makeFact(depositMatch.field, depositMatch.value) : undefined,
        replacementValue: repValMatch ? makeFact(repValMatch.field, repValMatch.value) : undefined,
        currency: currMatch ? makeFact(currMatch.field, currMatch.value) : undefined,
      }),
      availability: Object.freeze({
        availabilityStart: startMatch ? makeFact(startMatch.field, startMatch.value) : undefined,
        availabilityEnd: endMatch ? makeFact(endMatch.field, endMatch.value) : undefined,
      }),
      media: Object.freeze(media),
      prohibitedCandidates: Object.freeze(prohibitedCandidates),
      rawPayloadHash,
    });
  }
}
