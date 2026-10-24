import { mkdirSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, dirname, basename, parse, sep } from 'node:path';
import type { PaymentAttemptRecord } from '../contracts/payment-record';
import type { PaymentExecutionStore, StoredWebhookResult } from '../contracts/payment-execution-store';

type Row = Record<string, unknown>;
interface Statement {
  run(...args: unknown[]): { changes: number };
  get(...args: unknown[]): Row | undefined;
  all(...args: unknown[]): Row[];
}
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  close(): void;
}

/** A required persistent sandbox volume; never defaults to tmp or Production DB. */
export function isSandboxPaymentStatePath(path: string): boolean {
  return isAbsolute(path) && !/^(\\\\|\/\/)/.test(path) &&
    basename(path) === 'xendit-payment-sandbox.sqlite' &&
    basename(dirname(path)) === '.rentipid-sandbox';
}

/** SQLite commits the payment update and event receipt in the same transaction. */
export class SandboxPaymentExecutionStore implements PaymentExecutionStore {
  private readonly db: SqliteDatabase;
  constructor(path: string, private readonly namespace: string) {
    if (!isSandboxPaymentStatePath(path)) throw new Error('SANDBOX_PAYMENT_STORAGE_REQUIRED: An absolute dedicated sandbox state path is required.');
    const absolute = resolve(path);
    const parts = absolute.slice(parse(absolute).root.length).split(sep);
    let cursor = parse(absolute).root;
    for (const part of parts) {
      cursor = resolve(cursor, part);
      if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) {
        throw new Error('UNSAFE_SANDBOX_STORAGE: Symbolic links are not allowed.');
      }
    }
    mkdirSync(dirname(absolute), { recursive: true, mode: 0o700 });
    if (realpathSync(dirname(absolute)).toLowerCase() !== dirname(absolute).toLowerCase()) {
      throw new Error('UNSAFE_SANDBOX_STORAGE: Storage must resolve to its declared directory.');
    }
    // Node 24 is the required runtime. No application/Production DB connection.
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => SqliteDatabase };
    this.db = new DatabaseSync(absolute);
    this.db.exec('PRAGMA busy_timeout=5000');
    const applicationId = Number(this.db.prepare('PRAGMA application_id').get()?.application_id);
    const tables = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    if ((applicationId !== 0 && applicationId !== 1380997459) || (applicationId === 0 && tables.length > 0)) {
      this.db.close();
      throw new Error('UNSAFE_SANDBOX_STORAGE: Refusing an unrelated SQLite database.');
    }
    this.db.exec(`PRAGMA application_id=1380997459; PRAGMA journal_mode=WAL;
      PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS sandbox_payment_operations (
        namespace TEXT NOT NULL, operation_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
        status TEXT NOT NULL, result_json TEXT, provider_reference TEXT,
        PRIMARY KEY(namespace, operation_key));
      CREATE TABLE IF NOT EXISTS sandbox_payment_attempts (
        namespace TEXT NOT NULL, id TEXT NOT NULL, idempotency_key TEXT NOT NULL,
        provider_reference TEXT NOT NULL, fingerprint TEXT NOT NULL, record_json TEXT NOT NULL,
        PRIMARY KEY(namespace,id), UNIQUE(namespace,idempotency_key), UNIQUE(namespace,provider_reference));
      CREATE TABLE IF NOT EXISTS sandbox_payment_events (
        namespace TEXT NOT NULL, event_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
        result_json TEXT NOT NULL, PRIMARY KEY(namespace,event_key));`);
  }

  private transaction<T>(work: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = work(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  async runOperation<T>(key: string, fingerprint: string, execute: () => Promise<T>): Promise<T> {
    const replay = this.transaction(() => {
      const row = this.db.prepare('SELECT * FROM sandbox_payment_operations WHERE namespace=? AND operation_key=?').get(this.namespace, key);
      if (row) {
        if (row.fingerprint !== fingerprint) throw new Error('PAYMENT_IDEMPOTENCY_CONFLICT: Request facts differ from persisted intent.');
        if (row.status !== 'DONE') throw new Error('PAYMENT_RECONCILIATION_REQUIRED: Prior operation may have reached Xendit. It will not be resubmitted.');
        return { exists: true, value: JSON.parse(String(row.result_json)) as T };
      }
      this.db.prepare(`INSERT INTO sandbox_payment_operations(namespace,operation_key,fingerprint,status) VALUES(?,?,?,'STARTED')`).run(this.namespace, key, fingerprint);
      return { exists: false, value: undefined };
    });
    if (replay.exists) return replay.value as T;
    // STARTED intentionally survives errors/crashes. Never repeat an ambiguous POST.
    const result = await execute();
    const reference = result && typeof result === 'object' && 'providerReference' in result ?
      String(result.providerReference) : null;
    this.transaction(() => {
      this.db.prepare(`UPDATE sandbox_payment_operations SET status='DONE',result_json=?,provider_reference=? WHERE namespace=? AND operation_key=? AND fingerprint=? AND status='STARTED'`)
        .run(JSON.stringify(result), reference, this.namespace, key, fingerprint);
    });
    return result;
  }

  getOperationByReference<T>(reference: string): T | null {
    const row = this.db.prepare(`SELECT result_json FROM sandbox_payment_operations WHERE namespace=? AND provider_reference=? AND operation_key LIKE 'create:%' AND status='DONE'`).get(this.namespace, reference);
    return row ? JSON.parse(String(row.result_json)) as T : null;
  }

  private find(column: 'id' | 'idempotency_key' | 'provider_reference', value: string): PaymentAttemptRecord | null {
    const row = this.db.prepare(`SELECT record_json FROM sandbox_payment_attempts WHERE namespace=? AND ${column}=?`).get(this.namespace, value);
    return row ? Object.freeze(JSON.parse(String(row.record_json)) as PaymentAttemptRecord) : null;
  }
  getAttemptById(id: string) { return this.find('id', id); }
  getAttemptByIdempotency(key: string, fingerprint?: string) {
    if (fingerprint !== undefined) {
      const row = this.db.prepare('SELECT fingerprint FROM sandbox_payment_attempts WHERE namespace=? AND idempotency_key=?').get(this.namespace, key);
      if (row && row.fingerprint !== fingerprint) throw new Error('PAYMENT_IDEMPOTENCY_CONFLICT');
    }
    return this.find('idempotency_key', key);
  }
  getAttemptByReference(reference: string) { return this.find('provider_reference', reference); }

  attachAttempt(record: PaymentAttemptRecord, fingerprint: string): PaymentAttemptRecord {
    return this.transaction(() => {
      const row = this.db.prepare('SELECT fingerprint,record_json FROM sandbox_payment_attempts WHERE namespace=? AND idempotency_key=?').get(this.namespace, record.idempotencyKey);
      if (row) {
        const existing = JSON.parse(String(row.record_json)) as PaymentAttemptRecord;
        if (row.fingerprint !== fingerprint || existing.providerReference !== record.providerReference) throw new Error('PAYMENT_IDEMPOTENCY_CONFLICT: Attempt binding differs.');
        return Object.freeze(existing);
      }
      if (!record.providerReference) throw new Error('INVALID_PAYMENT_REFERENCE');
      this.db.prepare('INSERT INTO sandbox_payment_attempts VALUES(?,?,?,?,?,?)')
        .run(this.namespace, record.id, record.idempotencyKey, record.providerReference, fingerprint, JSON.stringify(record));
      return record;
    });
  }

  private writeAttempt(record: PaymentAttemptRecord, current: PaymentAttemptRecord): void {
    const identity = (r: PaymentAttemptRecord) => JSON.stringify([r.id,r.bookingId,r.payerId,r.providerId,r.jurisdictionCode,
      r.authoritativeAmountMinorUnits,r.depositAmountMinorUnits,r.deliveryFeeMinorUnits,r.transactionCurrency,
      r.paymentProviderId,r.idempotencyKey,r.providerReference]);
    if (identity(record) !== identity(current)) throw new Error('PAYMENT_AUTHORITY_CONFLICT: Immutable payment facts changed.');
    this.db.prepare('UPDATE sandbox_payment_attempts SET record_json=? WHERE namespace=? AND id=?')
      .run(JSON.stringify(record), this.namespace, record.id);
  }

  replaceAttempt(record: PaymentAttemptRecord, expected: PaymentAttemptRecord): PaymentAttemptRecord {
    return this.transaction(() => {
      const current = this.getAttemptById(record.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(expected)) throw new Error('PAYMENT_STATE_CONFLICT: Re-read the durable payment before updating.');
      this.writeAttempt(record, current);
      return record;
    });
  }

  applyWebhook(reference: string, eventKey: string, fingerprint: string,
    decide: (record: PaymentAttemptRecord) => StoredWebhookResult): StoredWebhookResult {
    return this.transaction(() => {
      const record = this.getAttemptByReference(reference);
      if (!record) return { success: false, error: 'RECORD_NOT_FOUND: No durable payment matches the provider reference.' };
      const receipt = this.db.prepare('SELECT fingerprint,result_json FROM sandbox_payment_events WHERE namespace=? AND event_key=?').get(this.namespace, eventKey);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) return { success: false, error: 'WEBHOOK_EVENT_CONFLICT: Event ID reused with different payment facts.' };
        return { ...(JSON.parse(String(receipt.result_json)) as StoredWebhookResult), paymentAttempt: record, isDuplicateReplay: true };
      }
      const result = decide(record);
      if (result.paymentAttempt) this.writeAttempt(result.paymentAttempt, record);
      if (result.success) this.db.prepare('INSERT INTO sandbox_payment_events VALUES(?,?,?,?)')
        .run(this.namespace, eventKey, fingerprint, JSON.stringify({ success: true, outOfOrderIgnored: result.outOfOrderIgnored }));
      return result;
    });
  }
  close(): void { this.db.close(); }
}
