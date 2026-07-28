import { Reader } from '@maxmind/geoip2-node';
import * as path from 'path';

export type GeoLookupResult = {
    status:
      | "RESOLVED"
      | "COUNTRY_ONLY"
      | "UNRESOLVED"
      | "PRIVATE_IP"
      | "RESERVED_IP"
      | "INVALID_IP"
      | "PROVIDER_DISABLED"
      | "PROVIDER_ERROR";
    countryCode?: string;
    countryName?: string;
    regionName?: string;
    cityName?: string;
    latitude?: number;
    longitude?: number;
    accuracyRadiusKm?: number;
    precision: "CITY_APPROXIMATE" | "REGION_APPROXIMATE" | "COUNTRY_APPROXIMATE" | "UNKNOWN";
    provider: string;
    databaseVersion?: string;
    failureCode?: string;
};

export interface GeoProvider {
    lookup(ipAddress: string): Promise<GeoLookupResult>;
}

export class DisabledGeoProvider implements GeoProvider {
    async lookup(ipAddress: string): Promise<GeoLookupResult> {
        return {
            status: "PROVIDER_DISABLED",
            precision: "UNKNOWN",
            provider: "DISABLED",
        };
    }
}

export class FixtureGeoProvider implements GeoProvider {
    async lookup(ipAddress: string): Promise<GeoLookupResult> {
        // Return a mock location (e.g. Manila) for non-private IPs in test environments
        return {
            status: "RESOLVED",
            countryCode: "PH",
            countryName: "Philippines",
            regionName: "Metro Manila",
            cityName: "Manila",
            latitude: 14.5995,
            longitude: 120.9842,
            accuracyRadiusKm: 50,
            precision: "CITY_APPROXIMATE",
            provider: "FIXTURE",
            databaseVersion: "FIXTURE-1.0",
        };
    }
}

export class MaxMindDatabaseGeoProvider implements GeoProvider {
    private dbPath: string;

    constructor() {
        this.dbPath = process.env.SOC_GEOIP_DATABASE_PATH || path.join(process.cwd(), 'GeoLite2-City.mmdb');
    }

    async lookup(ipAddress: string): Promise<GeoLookupResult> {
        try {
            const reader = await Reader.open(this.dbPath);
            const response: any = reader.city(ipAddress);
            
            const countryCode = response.country?.isoCode || undefined;
            const countryName = response.country?.names?.en || undefined;
            const cityName = response.city?.names?.en || undefined;
            const regionName = response.subdivisions && response.subdivisions.length > 0 ? response.subdivisions[0].names?.en : undefined;
            const latitude = response.location?.latitude || undefined;
            const longitude = response.location?.longitude || undefined;
            const accuracyRadiusKm = response.location?.accuracyRadius || undefined;

            let precision: "CITY_APPROXIMATE" | "REGION_APPROXIMATE" | "COUNTRY_APPROXIMATE" | "UNKNOWN" = "UNKNOWN";
            let status: GeoLookupResult['status'] = "UNRESOLVED";

            if (cityName && latitude !== undefined && longitude !== undefined) {
                precision = "CITY_APPROXIMATE";
                status = "RESOLVED";
            } else if (regionName && latitude !== undefined && longitude !== undefined) {
                precision = "REGION_APPROXIMATE";
                status = "RESOLVED";
            } else if (countryCode) {
                precision = "COUNTRY_APPROXIMATE";
                status = "COUNTRY_ONLY";
            }

            return {
                status,
                countryCode,
                countryName,
                regionName,
                cityName,
                latitude,
                longitude,
                accuracyRadiusKm,
                precision,
                provider: "MAXMIND_DATABASE",
                databaseVersion: "UNKNOWN",
            };
        } catch (error: any) {
            return {
                status: "PROVIDER_ERROR",
                precision: "UNKNOWN",
                provider: "MAXMIND_DATABASE",
                failureCode: error.code || "UNKNOWN_ERROR",
            };
        }
    }
}
