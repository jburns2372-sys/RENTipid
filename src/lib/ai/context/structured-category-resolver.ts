import type { CustomerEvidenceBundle } from './customer-evidence-bundle';

export interface StructuredCategoryFact {
  entity: string;
  canonicalCategory: string | null;
  status: 'SUPPORTED' | 'NOT_SUPPORTED' | 'UNCONFIRMED';
  conditions: readonly string[];
  authority: readonly string[];
  supportText?: string;
}

interface CatalogCategory {
  name: string;
  slug: string;
  aliases: readonly string[];
  ref: string;
  supportText: string;
  supported: boolean;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/s$/, '');
}

function catalog(bundle: CustomerEvidenceBundle): CatalogCategory[] {
  const categories: CatalogCategory[] = [];
  for (const section of bundle.sections) {
    for (const chunk of section.chunks) {
      for (const line of chunk.content.split(/\r?\n/)) {
        const supported = line.match(/^[-*]\s+(.+?)\s+\(([^)]+)\):\s*(.+)$/);
        if (supported) {
          categories.push({
            name: supported[1].trim(),
            slug: supported[2].trim(),
            aliases: supported[3].split(',').map(value => value.trim()),
            ref: chunk.evidenceRef,
            supportText: line.trim(),
            supported: true,
          });
          continue;
        }
        const unsupported = line.match(/^[-*]\s+(.+?):\s+not supported(?:\.|$)/i);
        if (unsupported) {
          categories.push({
            name: unsupported[1].trim(),
            slug: normalize(unsupported[1]),
            aliases: [],
            ref: chunk.evidenceRef,
            supportText: line.trim(),
            supported: false,
          });
        }
      }
    }
  }
  return categories;
}

export function resolveStructuredCategories(
  bundle: CustomerEvidenceBundle,
): readonly StructuredCategoryFact[] {
  const categories = catalog(bundle);
  return bundle.classification.requestedCategoryTerms.map(entity => {
    const requested = normalize(entity);
    const match = categories.find(category =>
      [category.name, category.slug, ...category.aliases]
        .map(normalize)
        .some(candidate => candidate === requested
          || candidate.includes(requested)
          || requested.includes(candidate)));
    if (!match) {
      return Object.freeze({
        entity,
        canonicalCategory: null,
        status: 'UNCONFIRMED' as const,
        conditions: Object.freeze([]),
        authority: Object.freeze(bundle.evidenceRefs),
      });
    }
    return Object.freeze({
      entity,
      canonicalCategory: match.name,
      status: match.supported ? 'SUPPORTED' as const : 'NOT_SUPPORTED' as const,
      conditions: Object.freeze([]),
      authority: Object.freeze([match.ref]),
      supportText: match.supportText,
    });
  });
}
