export const MARKETPLACE_CATEGORY_METADATA_PREFIX = 'RENTIPID_MARKETPLACE_CATEGORY_V1:';

export interface MarketplaceCategoryMetadata {
  datasetVersion: 'RENTIPID-MARKETPLACE-SEED-V1.0';
  seedKey: string;
  sortOrder: number;
  featured: boolean;
  subcategories: string[];
}

export function serializeMarketplaceCategoryMetadata(metadata: MarketplaceCategoryMetadata): string {
  return `${MARKETPLACE_CATEGORY_METADATA_PREFIX}${JSON.stringify(metadata)}`;
}

export function parseMarketplaceCategoryMetadata(notes: string | null | undefined): MarketplaceCategoryMetadata | null {
  if (!notes?.startsWith(MARKETPLACE_CATEGORY_METADATA_PREFIX)) return null;

  try {
    const value = JSON.parse(notes.slice(MARKETPLACE_CATEGORY_METADATA_PREFIX.length)) as MarketplaceCategoryMetadata;
    if (
      value.datasetVersion !== 'RENTIPID-MARKETPLACE-SEED-V1.0' ||
      typeof value.seedKey !== 'string' ||
      typeof value.sortOrder !== 'number' ||
      typeof value.featured !== 'boolean' ||
      !Array.isArray(value.subcategories)
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

