import { validateDatabaseUrl, validateDrillGuards, verifyChecksum, calculateChecksum } from '../../../scripts/security/phase5l-backup-restore-drill';
import * as fs from 'fs';
import * as crypto from 'crypto';

describe('Phase 5L Backup and Restore Guards', () => {
    describe('validateDatabaseUrl', () => {
        it('VALID_LOOPBACK_SOURCE_AND_TARGET_ACCEPTED', () => {
            expect(() => validateDatabaseUrl('postgresql://u:p@127.0.0.1:5432/rentipid_phase5l_source', true)).not.toThrow();
            expect(() => validateDatabaseUrl('postgresql://u:p@localhost:5432/rentipid_phase5l_restored', false)).not.toThrow();
        });

        it('REMOTE_SOURCE_REJECTED', () => {
            expect(() => validateDatabaseUrl('postgresql://u:p@10.0.0.5:5432/rentipid_phase5l_source', true))
                .toThrow('REMOTE_SOURCE_REJECTED');
        });

        it('REMOTE_TARGET_REJECTED', () => {
            expect(() => validateDatabaseUrl('postgresql://u:p@10.0.0.5:5432/rentipid_phase5l_restored', false))
                .toThrow('REMOTE_TARGET_REJECTED');
        });

        it('EVIL_LOCALHOST_HOSTNAME_REJECTED', () => {
            expect(() => validateDatabaseUrl('postgresql://u:p@evil-localhost.com:5432/rentipid_phase5l_source', true))
                .toThrow('EVIL_LOCALHOST_HOSTNAME_REJECTED');
        });

        it('PRODUCTION_SOURCE_DATABASE_REJECTED', () => {
            expect(() => validateDatabaseUrl('postgresql://u:p@127.0.0.1:5432/rentipid_prod_source', true))
                .toThrow('PRODUCTION_SOURCE_DATABASE_REJECTED');
        });

        it('PRODUCTION_TARGET_DATABASE_REJECTED', () => {
            expect(() => validateDatabaseUrl('postgresql://u:p@127.0.0.1:5432/rentipid_prod_restored', false))
                .toThrow('PRODUCTION_TARGET_DATABASE_REJECTED');
        });

        it('MISSING_SOURCE_URL_REJECTED', () => {
            expect(() => validateDatabaseUrl('', true)).toThrow('MISSING_SOURCE_URL_REJECTED');
        });

        it('MISSING_TARGET_URL_REJECTED', () => {
            expect(() => validateDatabaseUrl('', false)).toThrow('MISSING_TARGET_URL_REJECTED');
        });
    });

    describe('validateDrillGuards', () => {
        const validSrc = 'postgresql://u:p@127.0.0.1:5432/rentipid_phase5l_source';
        const validDst = 'postgresql://u:p@127.0.0.1:5432/rentipid_phase5l_restored';

        it('SOURCE_AND_TARGET_SAME_REJECTED', () => {
            expect(() => validateDrillGuards(validSrc, validSrc, 'true', 'true'))
                .toThrow('SOURCE_AND_TARGET_SAME_REJECTED');
        });

        it('MISSING_SYNTHETIC_ACKNOWLEDGEMENT_REJECTED', () => {
            expect(() => validateDrillGuards(validSrc, validDst, 'false', 'true'))
                .toThrow('MISSING_SYNTHETIC_ACKNOWLEDGEMENT_REJECTED');
        });

        it('MISSING_EXPLICIT_TARGET_ACKNOWLEDGEMENT_REJECTED', () => {
            expect(() => validateDrillGuards(validSrc, validDst, 'true', 'false'))
                .toThrow('MISSING_EXPLICIT_TARGET_ACKNOWLEDGEMENT_REJECTED');
        });
    });

    describe('Checksum Validation', () => {
        const testFile = 'scratch/test_checksum.txt';

        beforeAll(() => {
            if (!fs.existsSync('scratch')) {
                fs.mkdirSync('scratch');
            }
            fs.writeFileSync(testFile, 'test data');
        });

        afterAll(() => {
            if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
        });

        it('CHECKSUM_MATCH_ACCEPTED', () => {
            const expectedHash = calculateChecksum(testFile);
            expect(verifyChecksum(testFile, expectedHash)).toBe(true);
        });

        it('CHECKSUM_MISMATCH_REJECTED', () => {
            const badHash = crypto.createHash('sha256').update('bad data').digest('hex');
            expect(verifyChecksum(testFile, badHash)).toBe(false);
        });
    });
});
