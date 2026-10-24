import crypto from 'crypto';

export type IpSafetyStatus = 'VALID_PUBLIC' | 'PRIVATE' | 'LOOPBACK' | 'RESERVED' | 'INVALID';

export function checkIpSafety(ipAddress: string | null | undefined): { isSafeForLookup: boolean, status: IpSafetyStatus, normalizedIp: string | null } {
    if (!ipAddress || typeof ipAddress !== 'string') {
        return { isSafeForLookup: false, status: 'INVALID', normalizedIp: null };
    }

    const trimmedIp = ipAddress.trim();
    if (!trimmedIp) {
        return { isSafeForLookup: false, status: 'INVALID', normalizedIp: null };
    }

    // Basic IPv4 extraction (stripping port if any)
    let ipToTest = trimmedIp;
    if (trimmedIp.includes(':') && trimmedIp.split(':').length === 2 && trimmedIp.includes('.')) {
        ipToTest = trimmedIp.split(':')[0];
    } else if (trimmedIp.startsWith('::ffff:')) {
        ipToTest = trimmedIp.replace('::ffff:', '');
    }

    // Strictly check if it's a valid IPv4 or IPv6 format roughly
    const isIpv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipToTest);
    const isIpv6 = /^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^::1$|^::$/.test(ipToTest) || (ipToTest.includes(':') && !ipToTest.includes('.'));

    if (!isIpv4 && !isIpv6) {
        return { isSafeForLookup: false, status: 'INVALID', normalizedIp: null };
    }

    if (isIpv4) {
        const parts = ipToTest.split('.').map(Number);
        const [a, b] = parts;

        // Loopback
        if (a === 127) {
            return { isSafeForLookup: false, status: 'LOOPBACK', normalizedIp: null };
        }

        // Private ranges (RFC 1918)
        if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
            return { isSafeForLookup: false, status: 'PRIVATE', normalizedIp: null };
        }

        // Link-local (RFC 3927)
        if (a === 169 && b === 254) {
            return { isSafeForLookup: false, status: 'RESERVED', normalizedIp: null };
        }

        // Carrier-grade NAT (RFC 6598)
        if (a === 100 && b >= 64 && b <= 127) {
            return { isSafeForLookup: false, status: 'RESERVED', normalizedIp: null };
        }

        // Test-Net (RFC 5737)
        if ((a === 192 && b === 0 && parts[2] === 2) || (a === 198 && b === 51 && parts[2] === 100) || (a === 203 && b === 0 && parts[2] === 113)) {
            return { isSafeForLookup: false, status: 'RESERVED', normalizedIp: null };
        }

        // Multicast / Reserved
        if (a >= 224) {
            return { isSafeForLookup: false, status: 'RESERVED', normalizedIp: null };
        }
    } else if (isIpv6) {
        // Loopback
        if (ipToTest === '::1') {
            return { isSafeForLookup: false, status: 'LOOPBACK', normalizedIp: null };
        }

        const lowerIp = ipToTest.toLowerCase();

        // Unique Local Address (ULA) (fc00::/7) -> fc or fd
        if (lowerIp.startsWith('fc') || lowerIp.startsWith('fd')) {
            return { isSafeForLookup: false, status: 'PRIVATE', normalizedIp: null };
        }

        // Link-local (fe80::/10)
        if (lowerIp.startsWith('fe8') || lowerIp.startsWith('fe9') || lowerIp.startsWith('fea') || lowerIp.startsWith('feb')) {
            return { isSafeForLookup: false, status: 'RESERVED', normalizedIp: null };
        }

        // Multicast (ff00::/8)
        if (lowerIp.startsWith('ff')) {
            return { isSafeForLookup: false, status: 'RESERVED', normalizedIp: null };
        }
        
        // Documentation (2001:db8::/32)
        if (lowerIp.startsWith('2001:db8:')) {
            return { isSafeForLookup: false, status: 'RESERVED', normalizedIp: null };
        }
    }

    return { isSafeForLookup: true, status: 'VALID_PUBLIC', normalizedIp: ipToTest };
}

export function generateIpFingerprint(normalizedIp: string, secretKey: string): string {
    return crypto.createHmac('sha256', secretKey).update(normalizedIp).digest('hex');
}
