export interface ThreatMapMarkerDto {
    marker_id: string; // Aggregate ID
    country_code?: string;
    country_name?: string;
    region_name_when_allowed?: string;
    city_name_when_allowed?: string;
    latitude: number;
    longitude: number;
    accuracy_radius_km?: number;
    location_precision: "CITY_APPROXIMATE" | "REGION_APPROXIMATE" | "COUNTRY_APPROXIMATE" | "UNKNOWN";
    event_count: number;
    highest_severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    security_domains: string[];
    latest_event_at: string; // ISO date string
    recent_event_count: number;
    environment: string;
    lifecycle: string;
}

export interface ThreatMapResponseDto {
    markers: ThreatMapMarkerDto[];
    summary: {
        geolocatedEvents: number;
        countries: number;
        criticalHighEvents: number;
    };
    unresolvedLocationCount: number;
    privateOrReservedIpCount: number;
    providerStatus: string;
    lastUpdatedAt: string; // ISO string
    refreshAfterSeconds: number;
}
