/**
 * RENTipid Authoritative Category Resolution Engine
 * Resolves imported property types, slugs, and names against the database Category table.
 * Strictly fails closed: unverified strings NEVER reach Listing.category_id foreign keys.
 */

export interface CategoryResolutionResult {
  success: boolean;
  categoryId?: string;
  categorySlug?: string;
  categoryName?: string;
  errorCode?: 'CATEGORY_REFERENCE_DATA_MISSING' | 'CATEGORY_RESOLUTION_FAILED';
  errorMessage?: string;
}

interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean;
}

export interface CategoryQueryable {
  category: {
    findMany(args?: {
      where?: { is_active?: boolean };
      select?: { id: true; name: true; slug: true; is_active?: true };
    }): Promise<CategoryRecord[]>;
  };
}

const PROPERTY_TYPE_SEMANTIC_ALIASES: Record<string, string> = {
  condominium: 'condominiums',
  condominiums: 'condominiums',
  condo: 'condominiums',
  apartment: 'condominiums',
  unit: 'condominiums',
  suite: 'condominiums',
  room: 'rooms',
  rooms: 'rooms',
  bedroom: 'rooms',
  resort: 'beach-resorts',
  beach: 'beach-resorts',
  villa: 'beach-resorts',
  venue: 'event-venues',
  'event-venue': 'event-venues',
  car: 'cars-and-motorcycles',
  motorcycle: 'cars-and-motorcycles',
  vehicle: 'cars-and-motorcycles',
  truck: 'trucks-and-commercial-vehicles',
  tool: 'tools',
  tools: 'tools',
  heavy: 'heavy-equipment',
  construction: 'construction-equipment',
  camera: 'cameras-and-gadgets',
  gadget: 'cameras-and-gadgets',
  office: 'office-equipment',
  boat: 'boats',
  aircraft: 'aircraft-charter',
  charter: 'aircraft-charter',
};

/**
 * Resolves a requested identifier (ID, slug, name, or propertyType) to an authentic Category.id.
 */
export async function resolveAuthoritativeCategory(
  requestedIdentifier: string | undefined | null,
  prisma: CategoryQueryable,
): Promise<CategoryResolutionResult> {
  // 1. Fetch available active categories from authoritative DB
  const categories = await prisma.category.findMany({
    where: { is_active: true },
    select: { id: true, name: true, slug: true, is_active: true },
  });

  // 2. Fail closed if Category reference table is empty
  if (!categories || categories.length === 0) {
    return {
      success: false,
      errorCode: 'CATEGORY_REFERENCE_DATA_MISSING',
      errorMessage:
        'A RENTipid listing category could not be resolved. Please try again after category data is restored.',
    };
  }

  const raw = (requestedIdentifier || '').trim();
  if (!raw) {
    // Fallback to condominiums if available, or first active category
    const condoCat = categories.find((c) => c.slug === 'condominiums') || categories[0];
    return {
      success: true,
      categoryId: condoCat.id,
      categorySlug: condoCat.slug,
      categoryName: condoCat.name,
    };
  }

  // Candidate normalization
  const lower = raw.toLowerCase();
  const slugified = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Step 1: Exact Category.id match
  const matchById = categories.find((c) => c.id === raw);
  if (matchById) {
    return {
      success: true,
      categoryId: matchById.id,
      categorySlug: matchById.slug,
      categoryName: matchById.name,
    };
  }

  // Step 2: Normalized slug match
  const matchBySlug = categories.find((c) => c.slug === lower || c.slug === slugified);
  if (matchBySlug) {
    return {
      success: true,
      categoryId: matchBySlug.id,
      categorySlug: matchBySlug.slug,
      categoryName: matchBySlug.name,
    };
  }

  // Step 3: Case-insensitive name match
  const matchByName = categories.find((c) => c.name.toLowerCase() === lower);
  if (matchByName) {
    return {
      success: true,
      categoryId: matchByName.id,
      categorySlug: matchByName.slug,
      categoryName: matchByName.name,
    };
  }

  // Step 4: Defined semantic aliases
  const targetSlug = PROPERTY_TYPE_SEMANTIC_ALIASES[slugified] || PROPERTY_TYPE_SEMANTIC_ALIASES[lower];
  if (targetSlug) {
    const matchByAlias = categories.find((c) => c.slug === targetSlug);
    if (matchByAlias) {
      return {
        success: true,
        categoryId: matchByAlias.id,
        categorySlug: matchByAlias.slug,
        categoryName: matchByAlias.name,
      };
    }
  }

  // Step 5: Fallback to canonical 'other' category if present
  const matchOther = categories.find((c) => c.slug === 'other');
  if (matchOther) {
    return {
      success: true,
      categoryId: matchOther.id,
      categorySlug: matchOther.slug,
      categoryName: matchOther.name,
    };
  }

  // Step 6: Fail closed - never allow arbitrary unverified text to reach foreign key
  return {
    success: false,
    errorCode: 'CATEGORY_RESOLUTION_FAILED',
    errorMessage: `Could not resolve listing category for '${raw}'. Please choose a supported RENTipid category.`,
  };
}
