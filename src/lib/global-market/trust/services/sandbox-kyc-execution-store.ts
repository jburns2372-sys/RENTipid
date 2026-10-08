import { mkdirSync,existsSync,lstatSync,realpathSync } from 'node:fs';
import { isAbsolute,dirname,basename,resolve,parse,sep } from 'node:path';
import type { KycVerificationResult,CreateVerificationInput } from '../adapters/kyc-provider-adapter.interface';
type Row = Record<string,unknown>;
interface Statement { get(...args:unknown[]):Row | undefined; all(...args:unknown[]):Row[]; run(...args:unknown[]):unknown; }
interface Database { exec(sql:string):void; prepare(sql:string):Statement; close():void; }
export interface KycBinding extends CreateVerificationInput {
  readonly verificationId:string;
  readonly externalUserId:string;
  readonly levelName:string;
  readonly result:KycVerificationResult;
  readonly version:number;
}
export function isSandboxKycStatePath(path:string):boolean {
  return isAbsolute(path) && !/^(\\\\|\/\/)/.test(path) && basename(dirname(path)) === '.rentipid-sandbox' && basename(path) === 'sumsub-kyc-sandbox.sqlite';
}
/** Only opaque bindings, sanitized results and receipts are persisted. Never evidence or tokens. */
export class SandboxKycExecutionStore {
  private readonly db:Database;
  constructor(path:string,tenantId:string) {
    if (!isSandboxKycStatePath(path)) throw new Error('SANDBOX_KYC_STORAGE_REQUIRED');
    const absolute = resolve(path); let cursor = parse(absolute).root;
    for (const part of absolute.slice(cursor.length).split(sep)) {
      cursor = resolve(cursor,part); if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) throw new Error('UNSAFE_KYC_STORAGE');
    }
    mkdirSync(dirname(absolute),{ recursive:true,mode:0o700 });
    if (realpathSync(dirname(absolute)).toLowerCase() !== dirname(absolute).toLowerCase()) throw new Error('UNSAFE_KYC_STORAGE');
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync:new(path:string)=>Database };
    this.db = new DatabaseSync(absolute); this.db.exec('PRAGMA busy_timeout=5000');
    const appId = Number(this.db.prepare('PRAGMA application_id').get()?.application_id);
    if ((appId !== 0 && appId !== 1380997461) || (appId === 0 && this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().length)) {
      this.db.close(); throw new Error('UNSAFE_KYC_STORAGE');
    }
    this.db.exec(`PRAGMA application_id=1380997461; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS kyc_tenant (tenant_id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS kyc_operations (operation_key TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,status TEXT NOT NULL,result_json TEXT);
      CREATE TABLE IF NOT EXISTS kyc_bindings (verification_id TEXT PRIMARY KEY,external_id TEXT UNIQUE NOT NULL,account_id TEXT NOT NULL,binding_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS kyc_receipts (event_key TEXT PRIMARY KEY,verification_id TEXT NOT NULL,fingerprint TEXT NOT NULL);`);
    try {
      this.transaction(() => {
        const tenant = this.db.prepare('SELECT tenant_id FROM kyc_tenant').get();
        if (tenant && tenant.tenant_id !== tenantId) throw new Error('KYC_TENANT_MISMATCH');
        if (!tenant) this.db.prepare('INSERT INTO kyc_tenant VALUES(?)').run(tenantId);
      });
    } catch(error) { this.db.close(); throw error; }
  }
  private transaction<T>(work:()=>T):T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = work(); this.db.exec('COMMIT'); return result; } catch(error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async runOperation<T>(key:string,fingerprint:string,execute:()=>Promise<T>):Promise<T> {
    const replay = this.transaction(() => {
      const row = this.db.prepare('SELECT * FROM kyc_operations WHERE operation_key=?').get(key);
      if (row) {
        if (row.fingerprint !== fingerprint) throw new Error('KYC_IDEMPOTENCY_CONFLICT');
        if (row.status !== 'DONE') throw new Error('KYC_RECONCILIATION_REQUIRED: Ambiguous operation will not be resubmitted.');
        return { exists:true,value:JSON.parse(String(row.result_json)) as T };
      }
      this.db.prepare(`INSERT INTO kyc_operations(operation_key,fingerprint,status) VALUES(?,?,'STARTED')`).run(key,fingerprint);
      return { exists:false,value:undefined };
    });
    if (replay.exists) return replay.value as T;
    const result = await execute();
    this.transaction(() => this.db.prepare(`UPDATE kyc_operations SET status='DONE',result_json=? WHERE operation_key=?`).run(JSON.stringify(result),key));
    return result;
  }
  get(id:string):KycBinding | null {
    const row = this.db.prepare('SELECT binding_json FROM kyc_bindings WHERE verification_id=?').get(id);
    return row ? JSON.parse(String(row.binding_json)) as KycBinding:null;
  }
  byAccount(accountId:string):KycBinding {
    const rows = this.db.prepare('SELECT binding_json FROM kyc_bindings WHERE account_id=?').all(accountId);
    if (rows.length !== 1) throw new Error('KYC_ACCOUNT_CONTEXT_AMBIGUOUS_OR_UNKNOWN');
    return JSON.parse(String(rows[0].binding_json)) as KycBinding;
  }
  attach(binding:KycBinding):KycBinding {
    return this.transaction(() => {
      const existing = this.get(binding.verificationId);
      if (existing) {
        if (existing.externalUserId !== binding.externalUserId || existing.accountId !== binding.accountId || existing.levelName !== binding.levelName) throw new Error('KYC_BINDING_CONFLICT');
        return existing;
      }
      this.db.prepare('INSERT INTO kyc_bindings VALUES(?,?,?,?)').run(binding.verificationId,binding.externalUserId,binding.accountId,JSON.stringify(binding));
      return binding;
    });
  }
  replay(eventKey:string,fingerprint:string,id:string):KycVerificationResult | null {
    const row = this.db.prepare('SELECT * FROM kyc_receipts WHERE event_key=?').get(eventKey);
    if (!row) return null;
    if (row.fingerprint !== fingerprint || row.verification_id !== id) throw new Error('KYC_EVENT_CONFLICT');
    const binding = this.get(id); if (!binding) throw new Error('UNKNOWN_KYC_APPLICANT');
    return binding.result;
  }
  observe(expected:KycBinding,result:KycVerificationResult,eventKey?:string,fingerprint?:string):KycVerificationResult {
    return this.transaction(() => {
      if (eventKey && fingerprint) { const replay = this.replay(eventKey,fingerprint,expected.verificationId); if (replay) return replay; }
      const current = this.get(expected.verificationId);
      if (!current || current.version !== expected.version || result.verificationId !== current.verificationId || result.accountId !== current.accountId) throw new Error('KYC_STATE_OR_AUTHORITY_CONFLICT');
      const updated = { ...current,result,version:current.version + 1 };
      this.db.prepare('UPDATE kyc_bindings SET binding_json=? WHERE verification_id=?').run(JSON.stringify(updated),current.verificationId);
      if (eventKey && fingerprint) this.db.prepare('INSERT INTO kyc_receipts VALUES(?,?,?)').run(eventKey,current.verificationId,fingerprint);
      return result;
    });
  }
  close() { this.db.close(); }
}
