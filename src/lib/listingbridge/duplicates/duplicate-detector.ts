export type DuplicateMatchLevel = 'EXACT_MATCH' | 'LIKELY_MATCH' | 'POSSIBLE_MATCH' | 'NO_MATCH';

export interface DuplicateMatchSignal {
  readonly code: 'SAME_SOURCE_REFERENCE' | 'SAME_PROVIDER_AND_ADDRESS' | 'COORDINATE_PROXIMITY' | 'SIMILAR_TITLE_AND_LOCATION';
  readonly score: number;
  readonly description: string;
}

export interface DuplicateDetectionResult {
  readonly matchLevel: DuplicateMatchLevel;
  readonly matchedListingId?: string;
  readonly matchedJobId?: string;
  readonly confidenceScore: number;
  readonly signals: readonly DuplicateMatchSignal[];
  readonly isBlocking: boolean;
  readonly requiresReview: boolean;
}

export interface ExistingListingCandidate {
  readonly id: string;
  readonly providerId: string;
  readonly title: string;
  readonly categoryId?: string;
  readonly city?: string;
  readonly addressLine1?: string;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
}

export interface ExistingJobSourceCandidate {
  readonly jobId: string;
  readonly providerId: string;
  readonly sourceReferenceHash: string;
  readonly createdListingId?: string | null;
}

export interface DuplicateDetectionInput {
  readonly providerId: string;
  readonly sourceReferenceHash: string;
  readonly title?: string;
  readonly categorySlug?: string;
  readonly city?: string;
  readonly addressLine1?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly existingListings?: readonly ExistingListingCandidate[];
  readonly existingJobs?: readonly ExistingJobSourceCandidate[];
}

export class DuplicatePropertyDetector {
  detectDuplicates(input: DuplicateDetectionInput): DuplicateDetectionResult {
    const signals: DuplicateMatchSignal[] = [];
    let matchedListingId: string | undefined;
    let matchedJobId: string | undefined;

    // 1. Check same source reference from prior import jobs
    if (input.existingJobs && input.existingJobs.length > 0) {
      for (const job of input.existingJobs) {
        if (
          job.providerId === input.providerId
          && job.sourceReferenceHash === input.sourceReferenceHash
        ) {
          signals.push({
            code: 'SAME_SOURCE_REFERENCE',
            score: 1.0,
            description: `Import job '${job.jobId}' previously imported identical source reference`,
          });
          matchedJobId = job.jobId;
          matchedListingId = job.createdListingId || undefined;
          break;
        }
      }
    }

    // 2. Check existing listings by provider and address/coordinates
    if (input.existingListings && input.existingListings.length > 0) {
      for (const listing of input.existingListings) {
        const isSameProvider = listing.providerId === input.providerId;
        const isSameCity = Boolean(
          input.city
          && listing.city
          && input.city.trim().toLowerCase() === listing.city.trim().toLowerCase(),
        );

        // Coordinate Proximity check
        if (
          input.latitude !== undefined
          && input.longitude !== undefined
          && listing.latitude !== undefined
          && listing.latitude !== null
          && listing.longitude !== undefined
          && listing.longitude !== null
        ) {
          const distanceMeters = calculateHaversineDistance(
            input.latitude,
            input.longitude,
            listing.latitude,
            listing.longitude,
          );

          if (distanceMeters < 50) {
            signals.push({
              code: 'COORDINATE_PROXIMITY',
              score: isSameProvider ? 0.95 : 0.75,
              description: `Coordinates match existing listing '${listing.id}' within ${Math.round(distanceMeters)}m`,
            });
            matchedListingId = listing.id;
          }
        }

        // Same provider and normalized address match
        if (isSameProvider && isSameCity) {
          const titleSim = input.title ? calculateStringSimilarity(input.title, listing.title) : 0;
          if (titleSim >= 0.7) {
            signals.push({
              code: 'SAME_PROVIDER_AND_ADDRESS',
              score: 0.9,
              description: `Same provider has existing listing '${listing.id}' with matching city and title similarity ${(titleSim * 100).toFixed(0)}%`,
            });
            matchedListingId = listing.id;
          }
        }

        // Similar title & location (without same provider)
        if (!isSameProvider && isSameCity && input.title) {
          const titleSim = calculateStringSimilarity(input.title, listing.title);
          if (titleSim >= 0.85) {
            signals.push({
              code: 'SIMILAR_TITLE_AND_LOCATION',
              score: 0.6,
              description: `Different provider has similarly titled listing '${listing.id}' in ${input.city}`,
            });
            matchedListingId = listing.id;
          }
        }
      }
    }

    // Determine highest confidence match level
    if (signals.length === 0) {
      return Object.freeze({
        matchLevel: 'NO_MATCH',
        confidenceScore: 0.0,
        signals: Object.freeze([]),
        isBlocking: false,
        requiresReview: false,
      });
    }

    const maxScore = Math.max(...signals.map((s) => s.score));
    let matchLevel: DuplicateMatchLevel = 'NO_MATCH';

    if (maxScore >= 0.95) {
      matchLevel = 'EXACT_MATCH';
    } else if (maxScore >= 0.75) {
      matchLevel = 'LIKELY_MATCH';
    } else if (maxScore >= 0.50) {
      matchLevel = 'POSSIBLE_MATCH';
    }

    return Object.freeze({
      matchLevel,
      matchedListingId,
      matchedJobId,
      confidenceScore: maxScore,
      signals: Object.freeze(signals),
      isBlocking: matchLevel === 'EXACT_MATCH',
      requiresReview: matchLevel !== 'NO_MATCH',
    });
  }
}

/**
 * Calculates Haversine distance in meters between two lat/lng pairs.
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Basic deterministic bigram Dice-coefficient similarity for titles.
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
  const s2 = str2.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const bigrams1 = new Set<string>();
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.substring(i, i + 2));
  }

  let intersection = 0;
  const totalBigrams = (s1.length - 1) + (s2.length - 1);

  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    if (bigrams1.has(bigram)) {
      intersection++;
    }
  }

  return (2.0 * intersection) / totalBigrams;
}
