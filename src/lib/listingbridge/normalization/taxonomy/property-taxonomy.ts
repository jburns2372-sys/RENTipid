import type { ListingBridgeConfidenceState } from '../../types/canonical-contract';

export interface PropertyTaxonomyMappingResult {
  readonly canonicalCategorySlug: string;
  readonly canonicalPropertyType?: string;
  readonly confidence: ListingBridgeConfidenceState;
  readonly reasonCode: string;
  readonly requiresReview: boolean;
}

interface TaxonomyRule {
  readonly categorySlug: string;
  readonly defaultPropertyType: string;
  readonly exactAliases: readonly string[];
  readonly partialKeywords: readonly string[];
}

const PROPERTY_TAXONOMY_RULES: readonly TaxonomyRule[] = Object.freeze([
  {
    categorySlug: 'condominiums',
    defaultPropertyType: 'Condominium',
    exactAliases: ['condo', 'condominium', 'apartment', 'loft', 'flat', 'serviced apartment', 'studio', 'penthouse', 'residential condo'],
    partialKeywords: ['condo', 'apartment', 'flat', 'loft', 'studio'],
  },
  {
    categorySlug: 'rooms',
    defaultPropertyType: 'Private Room',
    exactAliases: ['room', 'private room', 'shared room', 'bed space', 'dorm', 'dormitory', 'boarding room', 'room rental'],
    partialKeywords: ['private room', 'bed space', 'shared room', 'dorm'],
  },
  {
    categorySlug: 'beach-resorts',
    defaultPropertyType: 'Resort Villa',
    exactAliases: ['beach resort', 'resort', 'beach house', 'villa by the beach', 'beachfront villa', 'island resort'],
    partialKeywords: ['beach resort', 'beachfront', 'island resort'],
  },
  {
    categorySlug: 'event-venues',
    defaultPropertyType: 'Event Space',
    exactAliases: ['event venue', 'event space', 'function hall', 'party place', 'commercial venue', 'conference hall', 'ballroom'],
    partialKeywords: ['event space', 'function hall', 'venue', 'conference room'],
  },
  {
    categorySlug: 'cameras-and-gadgets',
    defaultPropertyType: 'Camera / Tech Equipment',
    exactAliases: ['camera', 'dslr', 'mirrorless', 'drone', 'lens', 'action cam', 'gopro', 'gadget', 'tech equipment'],
    partialKeywords: ['camera', 'drone', 'gopro', 'dslr'],
  },
  {
    categorySlug: 'cars-and-motorcycles',
    defaultPropertyType: 'Vehicle',
    exactAliases: ['car', 'sedan', 'suv', 'motorcycle', 'scooter', 'motorbike', 'auto', 'vehicle rental'],
    partialKeywords: ['car', 'motorcycle', 'scooter', 'sedan', 'suv'],
  },
  {
    categorySlug: 'trucks-and-commercial-vehicles',
    defaultPropertyType: 'Commercial Vehicle',
    exactAliases: ['truck', 'commercial vehicle', 'delivery truck', 'dump truck', 'closed van', 'trailer'],
    partialKeywords: ['commercial truck', 'delivery truck', 'dump truck'],
  },
  {
    categorySlug: 'construction-equipment',
    defaultPropertyType: 'Construction Tool',
    exactAliases: ['construction equipment', 'scaffolding', 'cement mixer', 'generator', 'compactor'],
    partialKeywords: ['scaffolding', 'cement mixer', 'construction'],
  },
  {
    categorySlug: 'heavy-equipment',
    defaultPropertyType: 'Heavy Machinery',
    exactAliases: ['heavy equipment', 'excavator', 'bulldozer', 'crane', 'backhoe', 'loader'],
    partialKeywords: ['excavator', 'bulldozer', 'crane', 'heavy machinery'],
  },
  {
    categorySlug: 'tools',
    defaultPropertyType: 'Hand / Power Tool',
    exactAliases: ['tool', 'power tool', 'hand tool', 'drill', 'saw', 'lawn mower', 'gardening tool'],
    partialKeywords: ['power tool', 'drill', 'saw', 'hand tool'],
  },
  {
    categorySlug: 'boats',
    defaultPropertyType: 'Watercraft',
    exactAliases: ['boat', 'yacht', 'speedboat', 'jetski', 'catamaran', 'watercraft'],
    partialKeywords: ['boat', 'yacht', 'speedboat', 'jetski'],
  },
  {
    categorySlug: 'aircraft-charter',
    defaultPropertyType: 'Aircraft',
    exactAliases: ['aircraft', 'helicopter', 'airplane', 'charter flight', 'chopper'],
    partialKeywords: ['helicopter', 'airplane', 'aircraft'],
  },
  {
    categorySlug: 'office-equipment',
    defaultPropertyType: 'Office Device',
    exactAliases: ['office equipment', 'printer', 'photocopier', 'projector', 'scanner'],
    partialKeywords: ['printer', 'projector', 'photocopier'],
  },
  {
    categorySlug: 'event-equipment',
    defaultPropertyType: 'Event Rental Item',
    exactAliases: ['event equipment', 'party tent', 'sound system', 'stage lights', 'tables and chairs', 'karaoke'],
    partialKeywords: ['sound system', 'party tent', 'karaoke'],
  },
]);

// Ambiguous property aliases that must be flagged as REVIEW_RECOMMENDED
const AMBIGUOUS_ALIASES = new Set([
  'property', 'place', 'rental', 'space', 'house', 'villa', 'building', 'unit', 'listing', 'item', 'asset', 'vehicle',
]);

export class PropertyTaxonomyMapper {
  normalizePropertyType(rawInput: unknown): PropertyTaxonomyMappingResult {
    if (typeof rawInput !== 'string' || !rawInput.trim()) {
      return Object.freeze({
        canonicalCategorySlug: 'other',
        confidence: 'MISSING',
        reasonCode: 'PROPERTY_TYPE_MISSING',
        requiresReview: true,
      });
    }

    const cleanInput = rawInput.trim().toLowerCase();

    // Check if it's explicitly ambiguous
    if (AMBIGUOUS_ALIASES.has(cleanInput)) {
      return Object.freeze({
        canonicalCategorySlug: 'other',
        canonicalPropertyType: rawInput.trim(),
        confidence: 'REVIEW_RECOMMENDED',
        reasonCode: 'PROPERTY_TYPE_AMBIGUOUS',
        requiresReview: true,
      });
    }

    // Check exact alias match first (HIGH_CONFIDENCE)
    for (const rule of PROPERTY_TAXONOMY_RULES) {
      if (rule.exactAliases.includes(cleanInput) || rule.categorySlug === cleanInput) {
        return Object.freeze({
          canonicalCategorySlug: rule.categorySlug,
          canonicalPropertyType: rule.defaultPropertyType,
          confidence: 'HIGH_CONFIDENCE',
          reasonCode: 'PROPERTY_TYPE_EXACT_MATCH',
          requiresReview: false,
        });
      }
    }

    // Check keyword partial match (HIGH_CONFIDENCE or REVIEW_RECOMMENDED)
    for (const rule of PROPERTY_TAXONOMY_RULES) {
      for (const keyword of rule.partialKeywords) {
        if (cleanInput.includes(keyword)) {
          return Object.freeze({
            canonicalCategorySlug: rule.categorySlug,
            canonicalPropertyType: rule.defaultPropertyType,
            confidence: 'HIGH_CONFIDENCE',
            reasonCode: 'PROPERTY_TYPE_KEYWORD_MATCH',
            requiresReview: false,
          });
        }
      }
    }

    // Unmapped / unknown taxonomy
    return Object.freeze({
      canonicalCategorySlug: 'other',
      canonicalPropertyType: rawInput.trim(),
      confidence: 'REVIEW_RECOMMENDED',
      reasonCode: 'PROPERTY_TYPE_UNKNOWN_TAXONOMY',
      requiresReview: true,
    });
  }
}
