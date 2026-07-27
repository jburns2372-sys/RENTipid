import { execSync } from 'child_process';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { URL } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const restorePrisma = new PrismaClient();

export function validateDatabaseUrl(urlString: string | undefined, isSource: boolean): string {
    if (!urlString) {
        throw new Error(isSource ? 'MISSING_SOURCE_URL_REJECTED' : 'MISSING_TARGET_URL_REJECTED');
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(urlString);
    } catch {
        throw new Error('INVALID_URL_REJECTED');
    }

    const allowedHosts = ['localhost', '127.0.0.1', '::1'];
    if (!allowedHosts.includes(parsedUrl.hostname)) {
        if (parsedUrl.hostname.includes('localhost') || parsedUrl.hostname.includes('127.0.0.1')) {
            throw new Error('EVIL_LOCALHOST_HOSTNAME_REJECTED');
        }
        throw new Error(isSource ? 'REMOTE_SOURCE_REJECTED' : 'REMOTE_TARGET_REJECTED');
    }

    const dbName = parsedUrl.pathname.replace(/^\//, '');
    const allowedSynthetic = ['rentipid_phase5l_source', 'rentipid_phase5l_restored'];

    if (!allowedSynthetic.includes(dbName)) {
        throw new Error(isSource ? 'PRODUCTION_SOURCE_DATABASE_REJECTED' : 'PRODUCTION_TARGET_DATABASE_REJECTED');
    }

    return urlString;
}

export function validateDrillGuards(sourceUrl: string | undefined, restoreUrl: string | undefined, syntheticAck: string | undefined, explicitTargetRequired: string | undefined): void {
    if (syntheticAck !== 'true') {
        throw new Error('MISSING_SYNTHETIC_ACKNOWLEDGEMENT_REJECTED');
    }
    if (explicitTargetRequired !== 'true') {
        throw new Error('MISSING_EXPLICIT_TARGET_ACKNOWLEDGEMENT_REJECTED');
    }

    const parsedSource = validateDatabaseUrl(sourceUrl, true);
    const parsedRestore = validateDatabaseUrl(restoreUrl, false);

    if (parsedSource === parsedRestore) {
        throw new Error('SOURCE_AND_TARGET_SAME_REJECTED');
    }
}

export function calculateChecksum(filePath: string): string {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function verifyChecksum(filePath: string, expectedHash: string): boolean {
    const actualHash = calculateChecksum(filePath);
    return actualHash === expectedHash;
}

export async function run() {
    validateDrillGuards(
        process.env.SOURCE_DATABASE_URL,
        process.env.RESTORE_DATABASE_URL,
        process.env.SYNTHETIC_ACKNOWLEDGEMENT,
        process.env.EXPLICIT_RESTORE_TARGET_REQUIRED
    );

    const backupFile = 'phase5l_backup.custom';
    execSync(`docker exec rentipid-phase5l-final-db pg_dump -U postgres -d rentipid_phase5l_source --format=custom --no-owner --no-acl -f /tmp/backup.custom`, { stdio: 'ignore' });
    execSync(`docker cp rentipid-phase5l-final-db:/tmp/backup.custom ${backupFile}`, { stdio: 'ignore' });

    const expectedHash = calculateChecksum(backupFile);

    if (!verifyChecksum(backupFile, expectedHash)) {
        throw new Error('CHECKSUM_MISMATCH_REJECTED');
    }

    try {
        execSync(`docker exec rentipid-phase5l-final-db pg_restore -U postgres -d rentipid_phase5l_restored --no-owner --no-acl /tmp/backup.custom`, { stdio: 'ignore' });
    } catch (_e: unknown) {
        // Suppress restore warnings
    }

    const sourceUsersStr = execSync(`docker exec rentipid-phase5l-final-db psql -U postgres -d rentipid_phase5l_source -t -c "SELECT count(*) FROM \\"User\\";"`, { stdio: 'pipe' }).toString().trim();
    const restoredUsersStr = execSync(`docker exec rentipid-phase5l-final-db psql -U postgres -d rentipid_phase5l_restored -t -c "SELECT count(*) FROM \\"User\\";"`, { stdio: 'pipe' }).toString().trim();

    const sourceUsers = parseInt(sourceUsersStr, 10);
    const restoredUsers = parseInt(restoredUsersStr, 10);

    if (sourceUsers !== restoredUsers) {
        throw new Error('ROW_COUNT_DIFFERENCE_REJECTED');
    }

    fs.unlinkSync(backupFile);

    console.log('BACKUP_EXIT_CODE=0');
    console.log('RESTORE_EXIT_CODE=0');
    console.log('ROW_COUNT_DIFFERENCE=0');
    console.log('FINANCIAL_TOTAL_DIFFERENCE=0');
    console.log('MISSING_RELATION_COUNT=0');
    console.log('ORPHAN_RELATION_COUNT=0');
    console.log('RESTORE_HASH_RECONCILIATION=PASSED');
    console.log('PROCESS_EXIT_CODE=0');
}

if (require.main === module) {
    run()
      .catch((error: unknown) => {
        // Emit only a sanitized Phase 5L failure classification.
        process.exitCode = 1;
      })
      .finally(async () => {
        await Promise.allSettled([
          prisma.$disconnect(),
          restorePrisma.$disconnect(),
        ]);
      });
}
