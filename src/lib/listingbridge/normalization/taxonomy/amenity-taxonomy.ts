import type { ListingBridgeConfidenceState } from '../../types/canonical-contract';

export interface NormalizedAmenityItem {
  readonly canonicalName: string;
  readonly rawSourceValue: string;
  readonly confidence: ListingBridgeConfidenceState;
  readonly isCanonicalTaxonomy: boolean;
}

export interface AmenityNormalizationResult {
  readonly canonicalAmenities: readonly string[];
  readonly detailedItems: readonly NormalizedAmenityItem[];
  readonly unmappedAmenities: readonly string[];
}

interface AmenityRule {
  readonly canonicalName: string;
  readonly synonyms: readonly string[];
}

const AMENITY_TAXONOMY_RULES: readonly AmenityRule[] = Object.freeze([
  {
    canonicalName: 'WiFi',
    synonyms: ['wifi', 'wi-fi', 'wireless internet', 'high speed internet', 'fast wifi', 'internet access', 'internet'],
  },
  {
    canonicalName: 'Air Conditioning',
    synonyms: ['air conditioning', 'ac', 'a/c', 'aircon', 'air conditioner', 'split type ac', 'window type ac', 'cooling'],
  },
  {
    canonicalName: 'Swimming Pool',
    synonyms: ['swimming pool', 'pool', 'lap pool', 'infinity pool', 'private pool', 'shared pool'],
  },
  {
    canonicalName: 'Kitchen',
    synonyms: ['kitchen', 'full kitchen', 'kitchenette', 'cooking basics', 'stove', 'induction cooker', 'gas range'],
  },
  {
    canonicalName: 'Free Parking',
    synonyms: ['free parking', 'parking', 'dedicated parking', 'garage', 'carport', 'free parking on premises', 'parking space'],
  },
  {
    canonicalName: 'Gym',
    synonyms: ['gym', 'fitness center', 'fitness room', 'workout area', 'exercise equipment'],
  },
  {
    canonicalName: 'TV',
    synonyms: ['tv', 'smart tv', 'television', 'cable tv', 'netflix', 'hdtv', 'flat screen tv'],
  },
  {
    canonicalName: 'Washer',
    synonyms: ['washer', 'washing machine', 'dryer', 'washer/dryer', 'laundry facility', 'laundry'],
  },
  {
    canonicalName: 'Balcony',
    synonyms: ['balcony', 'patio', 'terrace', 'veranda', 'deck'],
  },
  {
    canonicalName: 'Hot Water',
    synonyms: ['hot water', 'hot shower', 'water heater', 'instant shower heater'],
  },
  {
    canonicalName: 'Refrigerator',
    synonyms: ['refrigerator', 'fridge', 'freezer', 'mini fridge'],
  },
  {
    canonicalName: 'Microwave',
    synonyms: ['microwave', 'microwave oven'],
  },
  {
    canonicalName: '24/7 Security',
    synonyms: ['24/7 security', 'security', 'cctv', 'security guard', 'gated community', 'guard house', 'building security'],
  },
  {
    canonicalName: 'Elevator',
    synonyms: ['elevator', 'lift', 'building elevator'],
  },
  {
    canonicalName: 'Pet Friendly',
    synonyms: ['pet friendly', 'pets allowed', 'dog friendly', 'cat friendly'],
  },
  {
    canonicalName: 'Generator Backup',
    synonyms: ['generator', 'generator backup', 'power backup', 'solar backup', 'standby generator'],
  },
  {
    canonicalName: 'Workspace',
    synonyms: ['workspace', 'dedicated workspace', 'work desk', 'office chair', 'study desk'],
  },
  {
    canonicalName: 'Iron',
    synonyms: ['iron', 'ironing board', 'steam iron'],
  },
  {
    canonicalName: 'Hair Dryer',
    synonyms: ['hair dryer', 'hairdryer', 'blower'],
  },
]);

export class AmenityTaxonomyMapper {
  normalizeAmenities(rawAmenities: readonly unknown[]): AmenityNormalizationResult {
    const canonicalSet = new Set<string>();
    const detailedItems: NormalizedAmenityItem[] = [];
    const unmappedAmenities: string[] = [];

    for (const raw of rawAmenities) {
      if (typeof raw !== 'string' || !raw.trim()) continue;
      const cleanRaw = raw.trim();
      const lowerRaw = cleanRaw.toLowerCase();

      let matchedCanonical: string | undefined;

      for (const rule of AMENITY_TAXONOMY_RULES) {
        if (rule.synonyms.some((syn) => syn === lowerRaw || lowerRaw.includes(syn))) {
          matchedCanonical = rule.canonicalName;
          break;
        }
      }

      if (matchedCanonical) {
        canonicalSet.add(matchedCanonical);
        detailedItems.push({
          canonicalName: matchedCanonical,
          rawSourceValue: cleanRaw,
          confidence: 'HIGH_CONFIDENCE',
          isCanonicalTaxonomy: true,
        });
      } else {
        // Retain unmapped amenity without automatically generating a new taxonomy item
        unmappedAmenities.push(cleanRaw);
        detailedItems.push({
          canonicalName: cleanRaw,
          rawSourceValue: cleanRaw,
          confidence: 'REVIEW_RECOMMENDED',
          isCanonicalTaxonomy: false,
        });
      }
    }

    return Object.freeze({
      canonicalAmenities: Object.freeze(Array.from(canonicalSet)),
      detailedItems: Object.freeze(detailedItems),
      unmappedAmenities: Object.freeze(unmappedAmenities),
    });
  }
}
