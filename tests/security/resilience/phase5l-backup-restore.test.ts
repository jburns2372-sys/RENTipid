import {
    validateDatabaseUrl,
    validateDrillGuards,
    verifyChecksum,
    calculateChecksum,
    sanitizeErrorMessage,
    run,
    CommandExecutor,
    DatabaseStateMetrics,
} from '../../../scripts/security/phase5l-backup-restore-drill';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { spawnSync } from 'child_process';
import { Client } from 'pg';

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

    describe('Fail-Closed Recovery Contract Tests (A-H)', () => {
        const srcUrl = 'postgresql://u:p@127.0.0.1:5432/rentipid_phase5l_source';
        const dstUrl = 'postgresql://u:p@127.0.0.1:5432/rentipid_phase5l_restored';
        const testBackupFile = 'scratch/test_drill_contract.custom';

        beforeAll(() => {
            if (!fs.existsSync('scratch')) {
                fs.mkdirSync('scratch');
            }
        });

        afterEach(() => {
            if (fs.existsSync(testBackupFile)) {
                try {
                    fs.unlinkSync(testBackupFile);
                } catch {
                    // best-effort cleanup
                }
            }
        });

        const defaultMockState: DatabaseStateMetrics = {
            tableCount: 6,
            rowCount: 120,
            financialTotal: 45000,
            foreignKeyCount: 4,
            fingerprint: 'mock_fingerprint_hash_abc123',
        };

        it('CONTRACT_A: successful pg_dump + successful pg_restore + measured match -> PASS', async () => {
            const restoreCalled = jest.fn();
            const executor: CommandExecutor = (tool, _args) => {
                if (tool === 'pg_dump') {
                    fs.writeFileSync(testBackupFile, 'valid synthetic pg_dump backup stream');
                    return { status: 0, signal: null, stdout: 'pg_dump complete', stderr: '' };
                }
                if (tool === 'pg_restore') {
                    restoreCalled();
                    return { status: 0, signal: null, stdout: 'pg_restore complete', stderr: '' };
                }
                return { status: 0, signal: null, stdout: '', stderr: '' };
            };

            const metrics = await run({
                sourceUrl: srcUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
                stateMeasurer: async () => ({ ...defaultMockState }),
                orphanMeasurer: async () => 0,
            });

            expect(restoreCalled).toHaveBeenCalledTimes(1);
            expect(metrics.backupExitCode).toBe(0);
            expect(metrics.restoreExitCode).toBe(0);
            expect(metrics.tableCountDifference).toBe(0);
            expect(metrics.rowCountDifference).toBe(0);
            expect(metrics.financialTotalDifference).toBe(0);
            expect(metrics.missingRelationCount).toBe(0);
            expect(metrics.orphanRelationCount).toBe(0);
            expect(metrics.totalMeasuredDifference).toBe(0);
            expect(metrics.hashReconciliation).toBe('PASSED');
            expect(metrics.processExitCode).toBe(0);
        });

        it('CONTRACT_B: pg_dump failure -> FAIL (fail-closed, no restore attempted)', async () => {
            const restoreCalled = jest.fn();
            const executor: CommandExecutor = (tool) => {
                if (tool === 'pg_dump') {
                    return { status: 1, signal: null, stdout: '', stderr: 'pg_dump: connection error' };
                }
                if (tool === 'pg_restore') {
                    restoreCalled();
                    return { status: 0, signal: null, stdout: '', stderr: '' };
                }
                return { status: 0, signal: null, stdout: '', stderr: '' };
            };

            await expect(run({
                sourceUrl: srcUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
            })).rejects.toThrow('PG_DUMP_FAILED_EXIT_1: pg_dump: connection error');

            expect(restoreCalled).not.toHaveBeenCalled();
        });

        it('CONTRACT_C: pg_restore failure -> FAIL (fail-closed, error propagated)', async () => {
            const executor: CommandExecutor = (tool) => {
                if (tool === 'pg_dump') {
                    fs.writeFileSync(testBackupFile, 'synthetic backup content');
                    return { status: 0, signal: null, stdout: '', stderr: '' };
                }
                if (tool === 'pg_restore') {
                    return { status: 1, signal: null, stdout: '', stderr: 'pg_restore: corrupted archive header' };
                }
                return { status: 0, signal: null, stdout: '', stderr: '' };
            };

            await expect(run({
                sourceUrl: srcUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
            })).rejects.toThrow('PG_RESTORE_FAILED_EXIT_1: pg_restore: corrupted archive header');
        });

        it('CONTRACT_D: spawn/tooling error -> FAIL (fail-closed)', async () => {
            const executor: CommandExecutor = (tool) => {
                if (tool === 'pg_dump') {
                    return {
                        status: null,
                        signal: null,
                        stdout: '',
                        stderr: '',
                        error: new Error('ENOENT: pg_dump binary not found'),
                    };
                }
                return { status: 0, signal: null, stdout: '', stderr: '' };
            };

            await expect(run({
                sourceUrl: srcUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
            })).rejects.toThrow('SPAWN_ERROR: ENOENT: pg_dump binary not found');
        });

        it('CONTRACT_E: missing or 0-byte backup artifact -> FAIL (fail-closed)', async () => {
            const executor: CommandExecutor = (tool) => {
                if (tool === 'pg_dump') {
                    // Exits cleanly but fails to create backup file
                    return { status: 0, signal: null, stdout: '', stderr: '' };
                }
                return { status: 0, signal: null, stdout: '', stderr: '' };
            };

            await expect(run({
                sourceUrl: srcUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
            })).rejects.toThrow('MISSING_BACKUP_ARTIFACT_REJECTED');
        });

        it('CONTRACT_F: successful restore but measured source/target mismatch -> FAIL', async () => {
            const executor: CommandExecutor = (tool) => {
                if (tool === 'pg_dump') {
                    fs.writeFileSync(testBackupFile, 'synthetic backup content');
                    return { status: 0, signal: null, stdout: '', stderr: '' };
                }
                if (tool === 'pg_restore') {
                    return { status: 0, signal: null, stdout: '', stderr: '' };
                }
                return { status: 0, signal: null, stdout: '', stderr: '' };
            };

            // Restored target has fewer rows and different fingerprint
            const restoredState: DatabaseStateMetrics = {
                tableCount: 6,
                rowCount: 110, // 10 rows lost
                financialTotal: 45000,
                foreignKeyCount: 4,
                fingerprint: 'divergent_restored_hash',
            };

            await expect(run({
                sourceUrl: srcUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
                stateMeasurer: async (conn) => {
                    if (conn === srcUrl) return { ...defaultMockState };
                    return { ...restoredState };
                },
                orphanMeasurer: async () => 0,
            })).rejects.toThrow('MEASURED_SOURCE_TARGET_MISMATCH_REJECTED: differences found (tables=0, rows=10, financial=0, relations=0, orphans=0)');
        });

        it('CONTRACT_G: credentials and secrets are sanitized and not printed in evidence', async () => {
            const rawMessage = 'pg_dump: error connecting to postgresql://postgres:super_secret_password_999@127.0.0.1:5432/rentipid_phase5l_source with password="cleartext_pass"';
            const sanitized = sanitizeErrorMessage(rawMessage);

            expect(sanitized).not.toContain('super_secret_password_999');
            expect(sanitized).not.toContain('cleartext_pass');
            expect(sanitized).toContain('postgresql://***:***@127.0.0.1:5432/rentipid_phase5l_source');
            expect(sanitized).toContain('password=***');

            // Also verify that a failing command with connection string secret sanitizes in the thrown exception
            const secretUrl = 'postgresql://admin:super_secret_credential@127.0.0.1:5432/rentipid_phase5l_source';
            const executor: CommandExecutor = () => ({
                status: 2,
                signal: null,
                stdout: '',
                stderr: `FATAL: authentication failed for ${secretUrl}`,
            });

            await expect(run({
                sourceUrl: secretUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
            })).rejects.toThrow('PG_DUMP_FAILED_EXIT_2: FATAL: authentication failed for postgresql://***:***@127.0.0.1:5432/rentipid_phase5l_source');
        });

        it('CONTRACT_H: reported difference and validation metrics originate from measured values rather than constants', async () => {
            const measuredSource: DatabaseStateMetrics = {
                tableCount: 14,
                rowCount: 582,
                financialTotal: 128450.50,
                foreignKeyCount: 9,
                fingerprint: 'unique_source_fingerprint_xyz',
            };

            const executor: CommandExecutor = (tool) => {
                if (tool === 'pg_dump') {
                    fs.writeFileSync(testBackupFile, 'synthetic backup content for measurement test');
                    return { status: 0, signal: null, stdout: '', stderr: '' };
                }
                if (tool === 'pg_restore') {
                    return { status: 0, signal: null, stdout: '', stderr: '' };
                }
                return { status: 0, signal: null, stdout: '', stderr: '' };
            };

            const metrics = await run({
                sourceUrl: srcUrl,
                restoreUrl: dstUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                backupFilePath: testBackupFile,
                executor,
                stateMeasurer: async () => ({ ...measuredSource }),
                orphanMeasurer: async () => 0,
            });

            // Prove metrics match dynamic measurements, not hardcoded zeroes
            expect(metrics.sourceTableCount).toBe(14);
            expect(metrics.restoredTableCount).toBe(14);
            expect(metrics.sourceRowCount).toBe(582);
            expect(metrics.restoredRowCount).toBe(582);
            expect(metrics.sourceFinancialTotal).toBe(128450.50);
            expect(metrics.restoredFinancialTotal).toBe(128450.50);
            expect(metrics.backupSizeBytes).toBeGreaterThan(0);
            expect(metrics.tableCountDifference).toBe(0);
            expect(metrics.rowCountDifference).toBe(0);
            expect(metrics.financialTotalDifference).toBe(0);
            expect(metrics.missingRelationCount).toBe(0);
            expect(metrics.orphanRelationCount).toBe(0);
            expect(metrics.totalMeasuredDifference).toBe(0);
            expect(metrics.hashReconciliation).toBe('PASSED');
        });
    });

    describe('Real Isolated PostgreSQL 16 Integration (Positive & Negative)', () => {
        const isPg16ContainerRunning = () => {
            try {
                const res = spawnSync('docker', ['exec', 'rentipid-iso-recovery-pg16', 'pg_isready'], { encoding: 'utf8' });
                return res.status === 0;
            } catch {
                return false;
            }
        };

        const testIfContainer = isPg16ContainerRunning() ? it : it.skip;
        const realSourceUrl = 'postgresql://postgres:drill_password@127.0.0.1:5439/rentipid_iso_recovery_source_test';
        const realTargetUrl = 'postgresql://postgres:drill_password@127.0.0.1:5439/rentipid_iso_recovery_target_test';

        const resetTargetDb = async () => {
            const client = new Client({ connectionString: realTargetUrl });
            await client.connect();
            await client.query(`
                DROP TABLE IF EXISTS disposable_payments CASCADE;
                DROP TABLE IF EXISTS disposable_properties CASCADE;
                DROP TABLE IF EXISTS disposable_users CASCADE;
            `);
            await client.end();
        };

        const seedSourceDb = async () => {
            const client = new Client({ connectionString: realSourceUrl });
            await client.connect();
            await client.query(`
                DROP TABLE IF EXISTS disposable_payments CASCADE;
                DROP TABLE IF EXISTS disposable_properties CASCADE;
                DROP TABLE IF EXISTS disposable_users CASCADE;

                CREATE TABLE disposable_users (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL,
                    balance NUMERIC(12,2) NOT NULL
                );

                CREATE TABLE disposable_properties (
                    id SERIAL PRIMARY KEY,
                    owner_id INT NOT NULL REFERENCES disposable_users(id),
                    price NUMERIC(12,2) NOT NULL,
                    title TEXT NOT NULL
                );

                CREATE TABLE disposable_payments (
                    id SERIAL PRIMARY KEY,
                    user_id INT NOT NULL REFERENCES disposable_users(id),
                    amount NUMERIC(12,2) NOT NULL,
                    status TEXT NOT NULL
                );
            `);

            for (let i = 1; i <= 10; i++) {
                await client.query('INSERT INTO disposable_users (email, balance) VALUES ($1, $2)', [`user_${i}@synthetic.local`, 5000.00]);
            }
            for (let i = 1; i <= 25; i++) {
                const ownerId = ((i - 1) % 10) + 1;
                await client.query('INSERT INTO disposable_properties (owner_id, price, title) VALUES ($1, $2, $3)', [ownerId, 100000.00, `Property ${i}`]);
            }
            for (let i = 1; i <= 50; i++) {
                const userId = ((i - 1) % 10) + 1;
                await client.query('INSERT INTO disposable_payments (user_id, amount, status) VALUES ($1, $2, $3)', [userId, 3500.00, 'COMPLETED']);
            }
            await client.end();
        };

        testIfContainer('REAL_PG16_POSITIVE: executes complete backup, restore, and measured zero-difference validation', async () => {
            await seedSourceDb();
            await resetTargetDb();

            const metrics = await run({
                sourceUrl: realSourceUrl,
                restoreUrl: realTargetUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                containerName: 'rentipid-iso-recovery-pg16',
            });

            expect(metrics.backupExitCode).toBe(0);
            expect(metrics.restoreExitCode).toBe(0);
            expect(metrics.sourceTableCount).toBe(3);
            expect(metrics.restoredTableCount).toBe(3);
            expect(metrics.sourceRowCount).toBe(85);
            expect(metrics.restoredRowCount).toBe(85);
            expect(metrics.sourceFinancialTotal).toBe(2725000);
            expect(metrics.restoredFinancialTotal).toBe(2725000);
            expect(metrics.tableCountDifference).toBe(0);
            expect(metrics.rowCountDifference).toBe(0);
            expect(metrics.financialTotalDifference).toBe(0);
            expect(metrics.missingRelationCount).toBe(0);
            expect(metrics.orphanRelationCount).toBe(0);
            expect(metrics.totalMeasuredDifference).toBe(0);
            expect(metrics.hashReconciliation).toBe('PASSED');
            expect(metrics.processExitCode).toBe(0);
        }, 30000);

        testIfContainer('REAL_PG16_NEGATIVE: deterministic restore collision fails closed and emits no success evidence', async () => {
            // Ensure target DB has pre-existing conflicting relation so pg_restore with --exit-on-error deterministically collides
            const client = new Client({ connectionString: realTargetUrl });
            await client.connect();
            await client.query(`
                CREATE TABLE IF NOT EXISTS disposable_users (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL,
                    balance NUMERIC(12,2) NOT NULL
                );
            `);
            await client.end();

            await expect(run({
                sourceUrl: realSourceUrl,
                restoreUrl: realTargetUrl,
                syntheticAck: 'true',
                explicitTargetRequired: 'true',
                containerName: 'rentipid-iso-recovery-pg16',
            })).rejects.toThrow(/PG_RESTORE_FAILED_EXIT_1: pg_restore: error: could not execute query: ERROR:  relation ".*" already exists/);
        }, 30000);
    });
});
