import { NextRequest, NextResponse } from 'next/server';
import { requireSecurityPermission } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { ThreatMapMarkerDto, ThreatMapResponseDto } from '@/lib/security/geolocation/threat-map.dto';
import { SecuritySeverity } from '@prisma/client';

const SEVERITY_RANK = {
    INFO: 1,
    LOW: 2,
    MEDIUM: 3,
    HIGH: 4,
    CRITICAL: 5
};

export async function GET(req: NextRequest) {
    try {
        // Authenticate & Authorize
        const authContext = await requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW);

        const url = new URL(req.url);
        
        // Defaults & bounds
        const limitParam = url.searchParams.get('limit');
        const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : 500;
        
        // Time range (default 24 hours)
        let fromTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let toTime = new Date();
        
        const fromParam = url.searchParams.get('from');
        const toParam = url.searchParams.get('to');
        if (fromParam) fromTime = new Date(fromParam);
        if (toParam) toTime = new Date(toParam);

        // Filters
        const environment = url.searchParams.get('environment') || authContext.environment;
        const lifecycle = url.searchParams.get('lifecycle') || 'LIVE';
        const severity = url.searchParams.get('severity');
        const domain = url.searchParams.get('domain');

        // Allow explicitly asking for simulations or tests, but default to NO.
        const simulationIncluded = url.searchParams.get('simulation_included') === 'true';
        const testIncluded = url.searchParams.get('test_included') === 'true';

        // Base where clause
        const whereClause: any = {
            occurred_at: { gte: fromTime, lte: toTime },
            environment: testIncluded ? undefined : environment,
            lifecycle: simulationIncluded ? undefined : lifecycle
        };

        if (severity) whereClause.severity = severity;
        if (domain) whereClause.security_domain = domain;

        // Fetch events with their geolocation enrichments
        const events = await prisma.securityEvent.findMany({
            where: whereClause,
            take: limit,
            orderBy: { occurred_at: 'desc' },
            include: { geo_enrichment: true }
        });

        const markersMap = new Map<string, ThreatMapMarkerDto>();
        let unresolvedLocationCount = 0;
        let privateOrReservedIpCount = 0;
        let criticalHighEvents = 0;
        const uniqueCountries = new Set<string>();

        let providerStatus = 'ENABLED';
        if (process.env.NODE_ENV === 'production' && process.env.SOC_GEOLOCATION_PROVIDER !== 'MAXMIND_DATABASE') {
            providerStatus = 'DISABLED';
        }

        for (const event of events) {
            if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
                criticalHighEvents++;
            }

            const geo = event.geo_enrichment;
            if (!geo) {
                unresolvedLocationCount++;
                continue;
            }

            if (geo.status === 'PRIVATE' || geo.status === 'RESERVED' || geo.status === 'LOOPBACK') {
                privateOrReservedIpCount++;
                continue;
            }

            if (geo.status !== 'RESOLVED' && geo.status !== 'COUNTRY_ONLY') {
                unresolvedLocationCount++;
                continue;
            }

            if (geo.latitude === null || geo.longitude === null) {
                unresolvedLocationCount++;
                continue;
            }

            if (geo.country_code) uniqueCountries.add(geo.country_code);

            // Create a compound key to aggregate overlapping coordinates.
            // Using rounded coordinates (e.g. roughly to a few km) helps aggregate them visually
            const latRounded = geo.latitude.toFixed(2);
            const lngRounded = geo.longitude.toFixed(2);
            const markerId = `${geo.country_code || 'UN'}-${latRounded}-${lngRounded}`;

            const existing = markersMap.get(markerId);
            
            if (!existing) {
                markersMap.set(markerId, {
                    marker_id: markerId,
                    country_code: geo.country_code || undefined,
                    country_name: geo.country_name || undefined,
                    region_name_when_allowed: geo.region_name || undefined,
                    city_name_when_allowed: geo.city_name || undefined,
                    latitude: geo.latitude,
                    longitude: geo.longitude,
                    accuracy_radius_km: geo.accuracy_radius_km || undefined,
                    location_precision: geo.location_precision as any || "UNKNOWN",
                    event_count: 1,
                    highest_severity: event.severity as any,
                    security_domains: [event.security_domain],
                    latest_event_at: event.occurred_at.toISOString(),
                    recent_event_count: 1,
                    environment: event.environment,
                    lifecycle: event.lifecycle_type
                });
            } else {
                existing.event_count++;
                existing.recent_event_count++;
                
                // Compare severity
                if (SEVERITY_RANK[event.severity] > SEVERITY_RANK[existing.highest_severity]) {
                    existing.highest_severity = event.severity as any;
                }
                
                if (!existing.security_domains.includes(event.security_domain)) {
                    existing.security_domains.push(event.security_domain);
                }

                if (event.occurred_at > new Date(existing.latest_event_at)) {
                    existing.latest_event_at = event.occurred_at.toISOString();
                }
            }
        }

        const responseData: ThreatMapResponseDto = {
            markers: Array.from(markersMap.values()),
            summary: {
                geolocatedEvents: events.length - unresolvedLocationCount - privateOrReservedIpCount,
                countries: uniqueCountries.size,
                criticalHighEvents
            },
            unresolvedLocationCount,
            privateOrReservedIpCount,
            providerStatus,
            lastUpdatedAt: new Date().toISOString(),
            refreshAfterSeconds: 30
        };

        const response = NextResponse.json(responseData);
        response.headers.set('Cache-Control', 'private, no-store');
        return response;

    } catch (error: any) {
        if (error.message.includes('permission') || error.message.includes('Forbidden')) {
            return new NextResponse('Unauthorized', { status: 403 });
        }
        console.error('[THREAT-MAP-API] Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
