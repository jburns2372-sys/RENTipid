import { checkIpSafety, generateIpFingerprint } from '../../src/lib/security/geolocation/ip-safety';
import { FixtureGeoProvider, DisabledGeoProvider } from '../../src/lib/security/geolocation/geo-provider';

describe('SOC Phase 6A: Live Geospatial Threat Map', () => {
    
    describe('IP Safety Constraints (Step 6)', () => {
        it('blocks loopback IP addresses', () => {
            expect(checkIpSafety('127.0.0.1').isSafeForLookup).toBe(false);
            expect(checkIpSafety('::1').isSafeForLookup).toBe(false);
        });

        it('blocks private IPv4 addresses (RFC 1918)', () => {
            expect(checkIpSafety('10.0.0.1').isSafeForLookup).toBe(false);
            expect(checkIpSafety('172.16.0.5').isSafeForLookup).toBe(false);
            expect(checkIpSafety('192.168.1.100').isSafeForLookup).toBe(false);
        });
        
        it('blocks private/unique-local IPv6 addresses', () => {
            expect(checkIpSafety('fc00::1').isSafeForLookup).toBe(false);
            expect(checkIpSafety('fd12:3456:789a:1::1').isSafeForLookup).toBe(false);
        });

        it('allows valid public IPs', () => {
            const res = checkIpSafety('8.8.8.8');
            expect(res.isSafeForLookup).toBe(true);
            expect(res.status).toBe('VALID_PUBLIC');
            expect(res.normalizedIp).toBe('8.8.8.8');
        });

        it('strips ports before validation', () => {
            const res = checkIpSafety('8.8.8.8:8080');
            expect(res.isSafeForLookup).toBe(true);
            expect(res.normalizedIp).toBe('8.8.8.8');
        });

        it('generates a consistent hashed fingerprint for an IP', () => {
            const hash1 = generateIpFingerprint('8.8.8.8', 'test-secret');
            const hash2 = generateIpFingerprint('8.8.8.8', 'test-secret');
            const hash3 = generateIpFingerprint('8.8.4.4', 'test-secret');
            expect(hash1).toBe(hash2);
            expect(hash1).not.toBe(hash3);
            expect(hash1).not.toContain('8.8.8.8'); // Does not contain the raw IP
        });
    });

    describe('Geolocation Providers (Step 7)', () => {
        it('DisabledGeoProvider always returns PROVIDER_DISABLED', async () => {
            const provider = new DisabledGeoProvider();
            const res = await provider.lookup('8.8.8.8');
            expect(res.status).toBe('PROVIDER_DISABLED');
        });

        it('FixtureGeoProvider returns safe mock data for test environments', async () => {
            const provider = new FixtureGeoProvider();
            const res = await provider.lookup('8.8.8.8');
            expect(res.status).toBe('RESOLVED');
            expect(res.countryCode).toBe('PH');
            expect(res.latitude).toBeDefined();
            expect(res.longitude).toBeDefined();
        });
    });
});
