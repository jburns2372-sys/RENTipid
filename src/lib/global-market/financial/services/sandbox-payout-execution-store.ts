import { mkdirSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, resolve, dirname, basename, parse, sep } from 'node:path';
import type { CreatePayoutOutput } from '../contracts/payout-provider';
import type { PayoutInstructionRecord } from '../contracts/payout-record';
import type { PayoutExecutionStore, PayoutWebhookResult } from '../contracts/payout-execution-store';

type Row = Record<string, unknown>;
interface Statement { run(...args: unknown[]): unknown; get(...args: unknown[]): Row | undefined; all(...args: unknown[]): Row[]; }
interface Database { exec(sql: string): void; prepare(sql: string): Statement; close(): void; }
export function isSandboxPayoutStatePath(path: string): boolean {
  return isAbsolute(path) && !/^(\\\\|\/\/)/.test(path) && basename(path) === 'xendit-payout-sandbox.sqlite' && basename(dirname(path)) === '.rentipid-sandbox';
}
/** Separate sandbox database. No payment store or application/Production DB access. */
export class SandboxPayoutExecutionStore implements PayoutExecutionStore {
  private readonly db: Database;
  constructor(path: string) {
    if (!isSandboxPayoutStatePath(path)) throw new Error('SANDBOX_PAYOUT_STORAGE_REQUIRED');
    const absolute = resolve(path); let cursor = parse(absolute).root;
    for (const part of absolute.slice(cursor.length).split(sep)) {
      cursor = resolve(cursor, part);
      if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error('UNSAFE_SANDBOX_PAYOUT_STORAGE');
    }
    mkdirSync(dirname(absolute), { recursive: true, mode: 0o700 });
    if (realpathSync(dirname(absolute)).toLowerCase() !== dirname(absolute).toLowerCase()) throw new Error('UNSAFE_SANDBOX_PAYOUT_STORAGE');
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => Database };
    this.db = new DatabaseSync(absolute); this.db.exec('PRAGMA busy_timeout=5000');
    const id = Number(this.db.prepare('PRAGMA application_id').get()?.application_id);
    if ((id !== 0 && id !== 1380997460) || (id === 0 && this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().length)) {
      this.db.close(); throw new Error('UNSAFE_SANDBOX_PAYOUT_STORAGE');
    }
    this.db.exec(`PRAGMA application_id=1380997460; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS payout_operations (booking_id TEXT PRIMARY KEY, idempotency_key TEXT UNIQUE NOT NULL,
        fingerprint TEXT NOT NULL, status TEXT NOT NULL, result_json TEXT, provider_reference TEXT UNIQUE);
      CREATE TABLE IF NOT EXISTS payout_instructions (id TEXT PRIMARY KEY, booking_id TEXT UNIQUE NOT NULL,
        idempotency_key TEXT UNIQUE NOT NULL, provider_reference TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, record_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS payout_events (event_key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, result_json TEXT NOT NULL);`);
  }
  private transaction<T>(work: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const value = work(); this.db.exec('COMMIT'); return value; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async runCreate(bookingId: string, key: string, fingerprint: string, execute: () => Promise<CreatePayoutOutput>): Promise<CreatePayoutOutput> {
    const prior = this.transaction(() => {
      const keyed = this.db.prepare('SELECT booking_id FROM payout_operations WHERE idempotency_key=?').get(key);
      if (keyed && keyed.booking_id !== bookingId) throw new Error('PAYOUT_IDEMPOTENCY_CONFLICT');
      const row = this.db.prepare('SELECT * FROM payout_operations WHERE booking_id=?').get(bookingId);
      if (row) {
        if (row.fingerprint !== fingerprint) throw new Error('PAYOUT_IDEMPOTENCY_CONFLICT');
        if (row.status !== 'DONE') throw new Error('PAYOUT_RECONCILIATION_REQUIRED: Ambiguous payout will not be resubmitted.');
        return JSON.parse(String(row.result_json)) as CreatePayoutOutput;
      }
      this.db.prepare(`INSERT INTO payout_operations(booking_id,idempotency_key,fingerprint,status) VALUES(?,?,?,'STARTED')`).run(bookingId, key, fingerprint);
      return null;
    });
    if (prior) return prior;
    const output = await execute();
    this.transaction(() => this.db.prepare(`UPDATE payout_operations SET status='DONE',result_json=?,provider_reference=? WHERE booking_id=? AND status='STARTED'`)
      .run(JSON.stringify(output), output.providerReference, bookingId));
    return output;
  }
  getOperationByReference(reference: string): CreatePayoutOutput | null {
    const row = this.db.prepare(`SELECT result_json FROM payout_operations WHERE provider_reference=? AND status='DONE'`).get(reference);
    return row ? JSON.parse(String(row.result_json)) as CreatePayoutOutput : null;
  }
  private find(column: 'id' | 'booking_id' | 'provider_reference' | 'idempotency_key', value: string): PayoutInstructionRecord | null {
    const row = this.db.prepare(`SELECT record_json FROM payout_instructions WHERE ${column}=?`).get(value);
    return row ? Object.freeze(JSON.parse(String(row.record_json)) as PayoutInstructionRecord) : null;
  }
  getById(id: string) { return this.find('id', id); }
  getByKey(key: string) { return this.find('idempotency_key', key); }
  getByReference(reference: string) { return this.find('provider_reference', reference); }
  getByBooking(bookingId: string, fingerprint?: string) {
    if (fingerprint !== undefined) {
      const row = this.db.prepare('SELECT fingerprint FROM payout_instructions WHERE booking_id=?').get(bookingId);
      if (row && row.fingerprint !== fingerprint) throw new Error('PAYOUT_AUTHORITY_CONFLICT');
    }
    return this.find('booking_id', bookingId);
  }
  attach(record: PayoutInstructionRecord, fingerprint: string): PayoutInstructionRecord {
    return this.transaction(() => {
      const existing = this.getByBooking(record.bookingId, fingerprint);
      if (existing) {
        if (existing.providerReference !== record.providerReference) throw new Error('PAYOUT_REFERENCE_CONFLICT');
        return existing;
      }
      this.db.prepare('INSERT INTO payout_instructions VALUES(?,?,?,?,?,?)').run(record.id,record.bookingId,record.idempotencyKey,record.providerReference,fingerprint,JSON.stringify(record));
      return record;
    });
  }
  private write(record: PayoutInstructionRecord, current: PayoutInstructionRecord) {
    const identity = (r: PayoutInstructionRecord) => JSON.stringify([r.id,r.bookingId,r.providerId,r.jurisdictionCode,r.beneficiaryReference,
      r.payoutAmountMinorUnits,r.settlementCurrency,r.payoutProviderId,r.idempotencyKey,r.providerReference]);
    if (identity(record) !== identity(current)) throw new Error('PAYOUT_AUTHORITY_CONFLICT');
    this.db.prepare('UPDATE payout_instructions SET record_json=? WHERE id=?').run(JSON.stringify(record),record.id);
  }
  replace(record: PayoutInstructionRecord, expected: PayoutInstructionRecord): void {
    this.transaction(() => {
      const current = this.getById(record.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(expected)) throw new Error('PAYOUT_STATE_CONFLICT');
      this.write(record, current);
    });
  }
  applyWebhook(reference: string, eventKey: string, fingerprint: string, decide: (record: PayoutInstructionRecord) => PayoutWebhookResult): PayoutWebhookResult {
    return this.transaction(() => {
      const record = this.getByReference(reference);
      if (!record) return { success: false, error: 'PAYOUT_RECORD_NOT_FOUND' };
      const receipt = this.db.prepare('SELECT * FROM payout_events WHERE event_key=?').get(eventKey);
      if (receipt) return receipt.fingerprint !== fingerprint ? { success: false, error: 'PAYOUT_WEBHOOK_EVENT_CONFLICT' } :
        { ...JSON.parse(String(receipt.result_json)), isDuplicateReplay: true, payoutInstruction: record } as PayoutWebhookResult;
      const result = decide(record);
      if (result.payoutInstruction) this.write(result.payoutInstruction, record);
      if (result.success) this.db.prepare('INSERT INTO payout_events VALUES(?,?,?)').run(eventKey,fingerprint,JSON.stringify({ success: true, outOfOrderIgnored: result.outOfOrderIgnored }));
      return result;
    });
  }
  close() { this.db.close(); }
}
