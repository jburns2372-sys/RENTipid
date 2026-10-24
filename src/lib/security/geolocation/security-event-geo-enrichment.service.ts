import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { checkIpSafety, generateIpFingerprint, IpSafetyStatus } from './ip-safety';
import { GeoProvider, DisabledGeoProvider, FixtureGeoProvider, MaxMindDatabaseGeoProvider } from './geo-provider';

// Configuration based on environment
const getProvider = (): GeoProvider => {
    const isProd = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    const providerConfig = process.env.SOC_GEOLOCATION_PROVIDER;

    if (isTest || providerConfig === 'FIXTURE') {
        return new FixtureGeoProvider();
    }
    
    if (providerConfig === 'MAXMIND_DATABASE') {
        return new MaxMindDatabaseGeoProvider();
    }
    
    // Default: Disabled in production unless explicitly authorized
    if (isProd || providerConfig === 'DISABLED') {
        return new DisabledGeoProvider();
    }

    return new FixtureGeoProvider();
};

export class SecurityEventGeoEnrichmentService {
    private provider: GeoProvider;
    private hmacSecret: string;

    constructor() {
        this.provider = getProvider();
        this.hmacSecret = process.env.SOC_GEOLOCATION_HMAC_SECRET || 'fallback-secret-do-not-use-in-prod';
    }

    /**
     * Enriches a single Security Event with geolocation data.
     * Guaranteed to be idempotent and never persist raw IPs.
     */
    async enrichEvent(securityEventId: string): Promise<void> {
        // 1. Load eligible SecurityEvent
        const event = await prisma.securityEvent.findUnique({
            where: { id: securityEventId }
        });

        if (!event) return;
        
        // Skip if already enriched
        const existing = await prisma.securityEventGeoEnrichment.findUnique({
            where: { security_event_id: securityEventId }
        });
        if (existing) return;

        // 2. Resolve authoritative source IP server-side
        // The IP might be stored in a correlation log or source_summary. 
        // We look for ip_address in source_summary for this phase (as defined in our taxonomy).
        const summary = event.source_summary as Record<string, any> | null;
        const rawIp = summary?.ip_address || summary?.ipAddress || summary?.ip;

        // 3. Validate safety
        const { isSafeForLookup, status, normalizedIp } = checkIpSafety(rawIp);

        if (!isSafeForLookup || !normalizedIp) {
            // Save empty/unresolved record due to safety constraints
            await prisma.securityEventGeoEnrichment.create({
                data: {
                    security_event_id: securityEventId,
                    status: status,
                    provider: 'NONE',
                    ip_fingerprint: 'UNKNOWN_OR_UNSAFE',
                    lookup_attempted_at: new Date(),
                }
            });
            return;
        }

        const fingerprint = generateIpFingerprint(normalizedIp, this.hmacSecret);

        // 4. Check the fingerprint cache
        const cached = await prisma.securityEventGeoEnrichment.findFirst({
            where: { ip_fingerprint: fingerprint, status: 'RESOLVED' },
            orderBy: { created_at: 'desc' }
        });

        if (cached) {
            // Cache hit
            await prisma.securityEventGeoEnrichment.create({
                data: {
                    security_event_id: securityEventId,
                    status: 'RESOLVED',
                    provider: cached.provider,
                    provider_database_version: cached.provider_database_version,
                    ip_fingerprint: fingerprint,
                    country_code: cached.country_code,
                    country_name: cached.country_name,
                    region_name: cached.region_name,
                    city_name: cached.city_name,
                    latitude: cached.latitude,
                    longitude: cached.longitude,
                    accuracy_radius_km: cached.accuracy_radius_km,
                    location_precision: cached.location_precision,
                    lookup_attempted_at: new Date(),
                    resolved_at: new Date()
                }
            });
            return;
        }

        // 5. Call configured provider
        const result = await this.provider.lookup(normalizedIp);

        // 6 & 7. Save sanitized enrichment record
        await prisma.securityEventGeoEnrichment.create({
            data: {
                security_event_id: securityEventId,
                status: result.status,
                provider: result.provider,
                provider_database_version: result.databaseVersion,
                ip_fingerprint: fingerprint,
                country_code: result.countryCode,
                country_name: result.countryName,
                region_name: result.regionName,
                city_name: result.cityName,
                latitude: result.latitude,
                longitude: result.longitude,
                accuracy_radius_km: result.accuracyRadiusKm,
                location_precision: result.precision,
                lookup_attempted_at: new Date(),
                resolved_at: result.status === 'RESOLVED' || result.status === 'COUNTRY_ONLY' ? new Date() : null,
                failure_code: result.failureCode
            }
        });
        
        // 8. Return no raw IP
    }
}
