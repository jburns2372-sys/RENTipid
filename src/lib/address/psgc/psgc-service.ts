import 'server-only';
import { prisma } from '@/lib/prisma';
import { PsgcBarangayOption, PsgcCityOption, PsgcCityResolution } from './types';

/**
 * Normalizes a Philippine city/municipality name for PSGC matching.
 * Handles variants: "City of X", "X City", "Municipality of X", leading/trailing spaces.
 */
function normalizeCityName(name: string): string {
  let n = name.trim();
  // Remove common prefixes
  n = n.replace(/^City of\s+/i, '');
  n = n.replace(/^Municipality of\s+/i, '');
  n = n.replace(/^Science City of\s+/i, '');
  n = n.replace(/^Island Garden City of\s+/i, '');
  // Remove trailing "City" suffix
  n = n.replace(/\s+City$/i, '');
  return n.trim().toLowerCase();
}

/**
 * Normalizes a barangay name for matching.
 * Strips "Barangay" / "Brgy." prefixes, normalizes punctuation.
 */
function normalizeBarangayName(name: string): string {
  let n = name.trim();
  n = n.replace(/^Barangay\s+/i, '');
  n = n.replace(/^Brgy\.?\s*/i, '');
  // Normalize common punctuation
  n = n.replace(/['']/g, "'");
  n = n.replace(/\s+/g, ' ');
  return n.trim().toLowerCase();
}

export class PsgcService {
  /**
   * Get all active barangays belonging to a specific city/municipality.
   */
  static async getBarangaysByCityCode(cityPsgcCode: string): Promise<PsgcBarangayOption[]> {
    const barangays = await prisma.psgcSubdivision.findMany({
      where: {
        parentPsgcCode: cityPsgcCode,
        geographicLevel: 'BARANGAY',
        isActive: true,
      },
      select: {
        psgcCode: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return barangays;
  }

  /**
   * Resolve a Google-provided locality name to a PSGC city/municipality.
   */
  static async resolveCityByName(cityName: string): Promise<PsgcCityResolution> {
    if (!cityName || cityName.trim().length < 2) {
      return { resolved: false };
    }

    const normalizedInput = normalizeCityName(cityName);

    // Fetch all active cities and municipalities
    const candidates = await prisma.psgcSubdivision.findMany({
      where: {
        geographicLevel: { in: ['CITY', 'MUNICIPALITY'] },
        isActive: true,
      },
      select: {
        psgcCode: true,
        name: true,
        geographicLevel: true,
      },
    });

    // Attempt exact match after normalization
    const exactMatches = candidates.filter(c => normalizeCityName(c.name) === normalizedInput);

    if (exactMatches.length === 1) {
      return {
        resolved: true,
        psgcCode: exactMatches[0].psgcCode,
        canonicalName: exactMatches[0].name,
        geographicLevel: exactMatches[0].geographicLevel as 'CITY' | 'MUNICIPALITY',
      };
    }

    // If multiple exact matches (e.g. "San Fernando" in La Union vs Pampanga),
    // return unresolved — user must disambiguate
    if (exactMatches.length > 1) {
      return { resolved: false };
    }

    // Try contains match as last resort
    const containsMatches = candidates.filter(c =>
      normalizeCityName(c.name).includes(normalizedInput) ||
      normalizedInput.includes(normalizeCityName(c.name))
    );

    if (containsMatches.length === 1) {
      return {
        resolved: true,
        psgcCode: containsMatches[0].psgcCode,
        canonicalName: containsMatches[0].name,
        geographicLevel: containsMatches[0].geographicLevel as 'CITY' | 'MUNICIPALITY',
      };
    }

    return { resolved: false };
  }

  /**
   * Get all active cities and municipalities (for manual PH city selector).
   * Optionally filter by search term.
   */
  static async getCities(search?: string): Promise<PsgcCityOption[]> {
    const where: Record<string, unknown> = {
      geographicLevel: { in: ['CITY', 'MUNICIPALITY'] },
      isActive: true,
    };

    if (search && search.trim().length >= 2) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    const cities = await prisma.psgcSubdivision.findMany({
      where,
      select: {
        psgcCode: true,
        name: true,
        geographicLevel: true,
      },
      orderBy: {
        name: 'asc',
      },
      take: 50,
    });

    return cities.map(c => ({
      psgcCode: c.psgcCode,
      name: c.name,
      geographicLevel: c.geographicLevel as 'CITY' | 'MUNICIPALITY',
    }));
  }

  /**
   * Validate that a barangay belongs to a specific city/municipality.
   */
  static async validateBarangayBelongsToCity(
    barangayPsgcCode: string,
    cityPsgcCode: string
  ): Promise<boolean> {
    const barangay = await prisma.psgcSubdivision.findUnique({
      where: { psgcCode: barangayPsgcCode },
      select: {
        parentPsgcCode: true,
        geographicLevel: true,
        isActive: true,
      },
    });

    if (!barangay) return false;
    if (barangay.geographicLevel !== 'BARANGAY') return false;
    if (!barangay.isActive) return false;
    if (barangay.parentPsgcCode !== cityPsgcCode) return false;

    return true;
  }

  /**
   * Validate that a city/municipality exists and is active.
   */
  static async validateCity(cityPsgcCode: string): Promise<boolean> {
    const city = await prisma.psgcSubdivision.findUnique({
      where: { psgcCode: cityPsgcCode },
      select: {
        geographicLevel: true,
        isActive: true,
      },
    });

    if (!city) return false;
    if (!['CITY', 'MUNICIPALITY'].includes(city.geographicLevel)) return false;
    if (!city.isActive) return false;

    return true;
  }

  /**
   * Attempt to auto-match a Google sublocality hint against city barangays.
   * Returns the matching barangay code, or null if zero or multiple matches.
   */
  static async autoMatchBarangay(
    googleSublocality: string | null,
    cityPsgcCode: string
  ): Promise<string | null> {
    if (!googleSublocality || !cityPsgcCode) return null;

    const barangays = await this.getBarangaysByCityCode(cityPsgcCode);
    if (barangays.length === 0) return null;

    const normalizedHint = normalizeBarangayName(googleSublocality);

    const matches = barangays.filter(b =>
      normalizeBarangayName(b.name) === normalizedHint
    );

    // Auto-select only if exactly one deterministic match
    if (matches.length === 1) {
      return matches[0].psgcCode;
    }

    return null;
  }
}
