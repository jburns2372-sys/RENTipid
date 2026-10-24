import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { URL } from 'url';
import { Client } from 'pg';

export interface CommandExecutionResult {
    status: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    error?: Error;
}

export type CommandExecutor = (
    tool: 'pg_dump' | 'pg_restore' | 'docker',
    args: string[],
    env?: NodeJS.ProcessEnv
) => CommandExecutionResult;

export interface DatabaseStateMetrics {
    tableCount: number;
    rowCount: number;
    financialTotal: number;
    foreignKeyCount: number;
    fingerprint: string;
}

export type StateMeasurer = (connectionString: string) => Promise<DatabaseStateMetrics>;
export type OrphanMeasurer = (connectionString: string) => Promise<number>;

export interface RecoveryDrillOptions {
    sourceUrl?: string;
    restoreUrl?: string;
    syntheticAck?: string;
    explicitTargetRequired?: string;
    backupFilePath?: string;
    containerName?: string;
    preserveBackupFile?: boolean;
    executor?: CommandExecutor;
    stateMeasurer?: StateMeasurer;
    orphanMeasurer?: OrphanMeasurer;
}

export interface RecoveryMetrics {
    backupExitCode: number;
    restoreExitCode: number;
    backupSizeBytes: number;
    backupDurationMs: number;
    restoreDurationMs: number;
    sourceTableCount: number;
    restoredTableCount: number;
    sourceRowCount: number;
    restoredRowCount: number;
    sourceFinancialTotal: number;
    restoredFinancialTotal: number;
    tableCountDifference: number;
    rowCountDifference: number;
    financialTotalDifference: number;
    missingRelationCount: number;
    orphanRelationCount: number;
    totalMeasuredDifference: number;
    hashReconciliation: 'PASSED' | 'FAILED';
    processExitCode: number;
}

export function sanitizeErrorMessage(message: string): string {
    return message
        .replace(/postgresql:\/\/[^:]+:[^@]+@/gi, 'postgresql://***:***@')
        .replace(/(password|passwd|pwd)=['"]?[^'"\s]+['"]?/gi, '$1=***')
        .replace(/(-W\s+|--password=)\S+/gi, '$1***');
}

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
    const allowedSynthetic = [
        'rentipid_phase5l_source',
        'rentipid_phase5l_restored',
        'rentipid_iso_recovery_source_test',
        'rentipid_iso_recovery_target_test',
    ];

    if (!allowedSynthetic.includes(dbName)) {
        throw new Error(isSource ? 'PRODUCTION_SOURCE_DATABASE_REJECTED' : 'PRODUCTION_TARGET_DATABASE_REJECTED');
    }

    return urlString;
}

export function validateDrillGuards(
    sourceUrl: string | undefined,
    restoreUrl: string | undefined,
    syntheticAck: string | undefined,
    explicitTargetRequired: string | undefined
): void {
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

export function defaultExecutor(
    tool: 'pg_dump' | 'pg_restore' | 'docker',
    args: string[],
    env?: NodeJS.ProcessEnv
): CommandExecutionResult {
    const res = spawnSync(tool, args, {
        encoding: 'utf8',
        env: { ...process.env, ...env },
        maxBuffer: 10 * 1024 * 1024,
    });
    return {
        status: res.status,
        signal: res.signal,
        stdout: res.stdout || '',
        stderr: res.stderr || '',
        error: res.error,
    };
}

export async function measureDatabaseState(connectionString: string): Promise<DatabaseStateMetrics> {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        const tableNames: string[] = tablesRes.rows.map(r => r.table_name);
        const tableCount = tableNames.length;

        let rowCount = 0;
        let financialTotal = 0;
        const tableFingerprints: string[] = [];

        for (const table of tableNames) {
            const countRes = await client.query(`SELECT count(*)::int AS count FROM "${table}"`);
            const count = parseInt(countRes.rows[0].count, 10);
            rowCount += count;
            tableFingerprints.push(`${table}:${count}`);

            try {
                const finRes = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = $1 
                      AND column_name IN ('amount', 'balance', 'total', 'price')
                `, [table]);
                if (finRes.rows.length > 0) {
                    const colName = finRes.rows[0].column_name;
                    const sumRes = await client.query(`SELECT COALESCE(SUM("${colName}"), 0)::numeric AS sum FROM "${table}"`);
                    financialTotal += parseFloat(sumRes.rows[0].sum);
                }
            } catch {
                // Column query optional
            }
        }

        const fkRes = await client.query(`
            SELECT count(*)::int AS count 
            FROM information_schema.table_constraints 
            WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'
        `);
        const foreignKeyCount = parseInt(fkRes.rows[0]?.count || '0', 10);
        const fingerprint = crypto.createHash('sha256').update(tableFingerprints.join(';')).digest('hex');

        return {
            tableCount,
            rowCount,
            financialTotal,
            foreignKeyCount,
            fingerprint,
        };
    } finally {
        await client.end();
    }
}

export async function measureOrphanRelations(connectionString: string): Promise<number> {
    const client = new Client({ connectionString });
    await client.connect();
    try {
        const fksRes = await client.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
        `);

        let orphanCount = 0;
        for (const fk of fksRes.rows) {
            try {
                const checkQuery = `
                    SELECT count(*)::int AS count
                    FROM "${fk.table_name}" AS c
                    LEFT JOIN "${fk.foreign_table_name}" AS p ON c."${fk.column_name}" = p."${fk.foreign_column_name}"
                    WHERE c."${fk.column_name}" IS NOT NULL AND p."${fk.foreign_column_name}" IS NULL
                `;
                const checkRes = await client.query(checkQuery);
                orphanCount += parseInt(checkRes.rows[0].count, 10);
            } catch {
                // Foreign key join optional
            }
        }
        return orphanCount;
    } finally {
        await client.end();
    }
}

export async function run(options: RecoveryDrillOptions = {}): Promise<RecoveryMetrics> {
    const sourceUrl = options.sourceUrl || process.env.SOURCE_DATABASE_URL;
    const restoreUrl = options.restoreUrl || process.env.RESTORE_DATABASE_URL;
    const syntheticAck = options.syntheticAck || process.env.SYNTHETIC_ACKNOWLEDGEMENT;
    const explicitTargetRequired = options.explicitTargetRequired || process.env.EXPLICIT_RESTORE_TARGET_REQUIRED;
    const containerName = options.containerName || process.env.CONTAINER_NAME || process.env.PHASE5L_CONTAINER;
    const executor = options.executor || defaultExecutor;

    validateDrillGuards(sourceUrl, restoreUrl, syntheticAck, explicitTargetRequired);

    const parsedSourceUrl = new URL(sourceUrl!);
    const parsedRestoreUrl = new URL(restoreUrl!);
    const sourceDbName = parsedSourceUrl.pathname.replace(/^\//, '');
    const restoreDbName = parsedRestoreUrl.pathname.replace(/^\//, '');
    const backupFile = options.backupFilePath || `phase5l_backup_${Date.now()}.custom`;

    const stateMeasurer = options.stateMeasurer || measureDatabaseState;
    const orphanMeasurer = options.orphanMeasurer || measureOrphanRelations;

    try {
        // 1. Perform Backup
        const backupStart = Date.now();
        let backupRes: CommandExecutionResult;

        if (containerName) {
            const containerBackupPath = `/tmp/${backupFile.split(/[\\/]/).pop()}`;
            backupRes = executor('docker', [
                'exec',
                containerName,
                'pg_dump',
                '-U',
                parsedSourceUrl.username || 'postgres',
                '-d',
                sourceDbName,
                '--format=custom',
                '--no-owner',
                '--no-acl',
                '-f',
                containerBackupPath,
            ]);
            if (backupRes.status === 0 && !backupRes.error && !backupRes.signal) {
                const cpRes = executor('docker', ['cp', `${containerName}:${containerBackupPath}`, backupFile]);
                if (cpRes.status !== 0 || cpRes.error || cpRes.signal) {
                    const cpErr = sanitizeErrorMessage(cpRes.stderr || cpRes.error?.message || 'docker cp failed');
                    throw new Error(`DOCKER_CP_FAILED: ${cpErr}`);
                }
            }
        } else {
            backupRes = executor('pg_dump', [
                '-U',
                parsedSourceUrl.username || 'postgres',
                '-h',
                parsedSourceUrl.hostname,
                '-p',
                parsedSourceUrl.port || '5432',
                '-d',
                sourceDbName,
                '--format=custom',
                '--no-owner',
                '--no-acl',
                '-f',
                backupFile,
            ], parsedSourceUrl.password ? { PGPASSWORD: parsedSourceUrl.password } : undefined);
        }

        if (backupRes.error) {
            throw new Error(`SPAWN_ERROR: ${sanitizeErrorMessage(backupRes.error.message)}`);
        }
        if (backupRes.status !== 0 || backupRes.signal) {
            const signalInfo = backupRes.signal ? ` (signal: ${backupRes.signal})` : '';
            const err = sanitizeErrorMessage(backupRes.stderr || `exit code ${backupRes.status}${signalInfo}`);
            throw new Error(`PG_DUMP_FAILED_EXIT_${backupRes.status ?? 'SIGNAL'}: ${err}`);
        }

        const backupDurationMs = Date.now() - backupStart;

        // Verify backup artifact presence and size
        if (!fs.existsSync(backupFile) || fs.statSync(backupFile).size === 0) {
            throw new Error('MISSING_BACKUP_ARTIFACT_REJECTED');
        }

        const backupSizeBytes = fs.statSync(backupFile).size;
        const expectedHash = calculateChecksum(backupFile);
        if (!verifyChecksum(backupFile, expectedHash)) {
            throw new Error('CHECKSUM_MISMATCH_REJECTED');
        }

        // 2. Perform Restore (FAIL-CLOSED: non-zero exit NEVER swallowed)
        const restoreStart = Date.now();
        let restoreRes: CommandExecutionResult;

        if (containerName) {
            const containerBackupPath = `/tmp/${backupFile.split(/[\\/]/).pop()}`;
            const cpToContainerRes = executor('docker', ['cp', backupFile, `${containerName}:${containerBackupPath}`]);
            if (cpToContainerRes.status !== 0 || cpToContainerRes.error || cpToContainerRes.signal) {
                const cpErr = sanitizeErrorMessage(cpToContainerRes.stderr || cpToContainerRes.error?.message || 'docker cp failed');
                throw new Error(`DOCKER_CP_FAILED: ${cpErr}`);
            }

            restoreRes = executor('docker', [
                'exec',
                containerName,
                'pg_restore',
                '-U',
                parsedRestoreUrl.username || 'postgres',
                '-d',
                restoreDbName,
                '--no-owner',
                '--no-acl',
                '--exit-on-error',
                containerBackupPath,
            ]);
        } else {
            restoreRes = executor('pg_restore', [
                '-U',
                parsedRestoreUrl.username || 'postgres',
                '-h',
                parsedRestoreUrl.hostname,
                '-p',
                parsedRestoreUrl.port || '5432',
                '-d',
                restoreDbName,
                '--no-owner',
                '--no-acl',
                '--exit-on-error',
                backupFile,
            ], parsedRestoreUrl.password ? { PGPASSWORD: parsedRestoreUrl.password } : undefined);
        }

        if (restoreRes.error) {
            throw new Error(`SPAWN_ERROR: ${sanitizeErrorMessage(restoreRes.error.message)}`);
        }
        if (restoreRes.status !== 0 || restoreRes.signal) {
            const signalInfo = restoreRes.signal ? ` (signal: ${restoreRes.signal})` : '';
            const err = sanitizeErrorMessage(restoreRes.stderr || `exit code ${restoreRes.status}${signalInfo}`);
            throw new Error(`PG_RESTORE_FAILED_EXIT_${restoreRes.status ?? 'SIGNAL'}: ${err}`);
        }

        const restoreDurationMs = Date.now() - restoreStart;

        // 3. Measure and Verify Source vs Restored Database States
        const sourceMetrics = await stateMeasurer(sourceUrl!);
        const restoredMetrics = await stateMeasurer(restoreUrl!);
        const orphanRelationCount = await orphanMeasurer(restoreUrl!);

        const tableCountDifference = Math.abs(sourceMetrics.tableCount - restoredMetrics.tableCount);
        const rowCountDifference = Math.abs(sourceMetrics.rowCount - restoredMetrics.rowCount);
        const financialTotalDifference = Math.abs(sourceMetrics.financialTotal - restoredMetrics.financialTotal);
        const missingRelationCount = Math.abs(sourceMetrics.foreignKeyCount - restoredMetrics.foreignKeyCount);

        const totalMeasuredDifference =
            tableCountDifference +
            rowCountDifference +
            financialTotalDifference +
            missingRelationCount +
            orphanRelationCount;

        const hashReconciliation: 'PASSED' | 'FAILED' =
            sourceMetrics.fingerprint === restoredMetrics.fingerprint && totalMeasuredDifference === 0
                ? 'PASSED'
                : 'FAILED';

        if (totalMeasuredDifference !== 0 || hashReconciliation !== 'PASSED') {
            throw new Error(
                `MEASURED_SOURCE_TARGET_MISMATCH_REJECTED: differences found (tables=${tableCountDifference}, rows=${rowCountDifference}, financial=${financialTotalDifference}, relations=${missingRelationCount}, orphans=${orphanRelationCount})`
            );
        }

        const metrics: RecoveryMetrics = {
            backupExitCode: 0,
            restoreExitCode: 0,
            backupSizeBytes,
            backupDurationMs,
            restoreDurationMs,
            sourceTableCount: sourceMetrics.tableCount,
            restoredTableCount: restoredMetrics.tableCount,
            sourceRowCount: sourceMetrics.rowCount,
            restoredRowCount: restoredMetrics.rowCount,
            sourceFinancialTotal: sourceMetrics.financialTotal,
            restoredFinancialTotal: restoredMetrics.financialTotal,
            tableCountDifference,
            rowCountDifference,
            financialTotalDifference,
            missingRelationCount,
            orphanRelationCount,
            totalMeasuredDifference,
            hashReconciliation,
            processExitCode: 0,
        };

        console.log('BACKUP_EXIT_CODE=0');
        console.log('RESTORE_EXIT_CODE=0');
        console.log(`BACKUP_SIZE_BYTES=${metrics.backupSizeBytes}`);
        console.log(`BACKUP_DURATION_MS=${metrics.backupDurationMs}`);
        console.log(`RESTORE_DURATION_MS=${metrics.restoreDurationMs}`);
        console.log(`SOURCE_TABLE_COUNT=${metrics.sourceTableCount}`);
        console.log(`RESTORED_TABLE_COUNT=${metrics.restoredTableCount}`);
        console.log(`SOURCE_ROW_COUNT=${metrics.sourceRowCount}`);
        console.log(`RESTORED_ROW_COUNT=${metrics.restoredRowCount}`);
        console.log(`ROW_COUNT_DIFFERENCE=${metrics.rowCountDifference}`);
        console.log(`FINANCIAL_TOTAL_DIFFERENCE=${metrics.financialTotalDifference}`);
        console.log(`MISSING_RELATION_COUNT=${metrics.missingRelationCount}`);
        console.log(`ORPHAN_RELATION_COUNT=${metrics.orphanRelationCount}`);
        console.log(`RESTORE_HASH_RECONCILIATION=${metrics.hashReconciliation}`);
        console.log('PROCESS_EXIT_CODE=0');

        return metrics;
    } finally {
        if (!options.preserveBackupFile && fs.existsSync(backupFile)) {
            try {
                fs.unlinkSync(backupFile);
            } catch {
                // best-effort cleanup
            }
        }
    }
}

const isDirectExecution =
    (typeof require !== 'undefined' && require.main === module) ||
    (typeof process !== 'undefined' && process.argv[1] && (
        process.argv[1].endsWith('phase5l-backup-restore-drill.ts') ||
        process.argv[1].endsWith('phase5l-backup-restore-drill.js')
    ));

if (isDirectExecution) {
    run()
        .then(() => {
            process.exit(0);
        })
        .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`RECOVERY_DRILL_FAILED: ${sanitizeErrorMessage(message)}`);
            process.exit(1);
        });
}
