// Read-only verification of the authorized disposable installation databases.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {Client} = require('pg');
const root = path.resolve(__dirname, '../..');
const normalize = value => value.replace(/\s+/g, ' ').trim();
async function main() {
  const url = new URL(process.env.DATABASE_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.ok(['rentipid_iso_fresh_install_test', 'rentipid_test_soc'].includes(url.pathname.slice(1)));
  const client = new Client({connectionString: url.toString()});
  await client.connect();
  try {
    const result = await client.query('SELECT current_database() AS name, current_setting(\'server_version_num\')::int AS version');
    assert.ok(result.rows[0].version >= 160000 && result.rows[0].version < 170000);
    const expected = fs.readdirSync(path.join(root, 'prisma/installation_migrations')).filter(name => fs.existsSync(path.join(root, 'prisma/installation_migrations', name, 'migration.sql'))).sort();
    const ledger = (await client.query('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name')).rows;
    assert.deepEqual(ledger.map(row => row.migration_name), expected);
    for (const row of ledger) {
      assert.ok(row.finished_at && !row.rolled_back_at);
      assert.equal(row.checksum, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'prisma/installation_migrations', row.migration_name, 'migration.sql'))).digest('hex'));
    }
    const columns = (await client.query(`SELECT data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='SemanticLearningCandidate' AND column_name='semanticType'`)).rows;
    assert.deepEqual(columns, [{data_type: 'text', is_nullable: 'NO', column_default: null}]);
    const authoritative = fs.readFileSync(path.join(root, 'prisma/migrations/20260724131703_amend_incident_case_history_assignment/migration.sql'), 'utf8');
    for (const name of ['prevent_incident_case_mutation', 'require_incident_case_assignment_target']) {
      const body = (await client.query('SELECT prosrc FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname=\'public\' AND proname=$1', [name])).rows;
      assert.equal(body.length, 1);
      const source = authoritative.slice(authoritative.indexOf('CREATE OR REPLACE FUNCTION '+name)).split('$$')[1];
      assert.equal(normalize(body[0].prosrc), normalize(source));
    }
    const triggers = (await client.query(`SELECT tgname, pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE NOT tgisinternal AND tgname = ANY($1::text[]) ORDER BY tgname`, [[
      'trigger_prevent_update_delete_history', 'trigger_require_incident_case_assignment_target', 'trigger_prevent_update_delete_note', 'trigger_prevent_update_delete_evidence'
    ]])).rows;
    assert.equal(triggers.length, 4);
    for (const row of triggers) {
      assert.match(row.definition, row.tgname.includes('assignment') ? /BEFORE INSERT ON public\."IncidentCaseHistory".*require_incident_case_assignment_target/ : /BEFORE (?:DELETE OR UPDATE|UPDATE OR DELETE).*prevent_incident_case_mutation/);
    }
    const index = (await client.query(`SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='DetectionRule_rule_id_active_idx'`)).rows;
    assert.equal(index.length, 1);
    assert.match(index[0].indexdef, /CREATE UNIQUE INDEX.*\(rule_id\).*WHERE.*ACTIVE/);
    const constraints = (await client.query(`SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='public."UserGlobalPreference"'::regclass`)).rows;
    assert.ok(constraints.some(row => row.conname==='UserGlobalPreference_pkey' && /PRIMARY KEY \(id\)/.test(row.definition)));
    assert.ok(constraints.some(row => row.conname==='UserGlobalPreference_user_id_fkey' && /FOREIGN KEY \(user_id\).*ON UPDATE CASCADE ON DELETE CASCADE/.test(row.definition)));
    const indexes = (await client.query(`SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename=ANY($1::text[])`, [['UserGlobalPreference','SemanticLearningCandidate']])).rows;
    for (const name of ['UserGlobalPreference_user_id_key','UserGlobalPreference_user_id_idx','SemanticLearningCandidate_pkey','SemanticLearningCandidate_status_idx','SemanticLearningCandidate_canonicalCandidateId_idx','SemanticLearningCandidate_normalizedPhrase_canonicalCandida_key']) assert.ok(indexes.some(row => row.indexname===name), name);
    assert.match(indexes.find(row => row.indexname==='SemanticLearningCandidate_normalizedPhrase_canonicalCandida_key').indexdef, /CREATE UNIQUE INDEX.*normalizedPhrase.*canonicalCandidateId.*domain.*semanticType/);
    if (result.rows[0].name==='rentipid_test_soc') {
      const role = (await client.query('SELECT current_user AS name, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
      assert.deepEqual(role, {name:'rentipid_test_user', rolsuper:false, rolcreatedb:false, rolcreaterole:false, rolreplication:false, rolbypassrls:false});
    }
    console.log(JSON.stringify({database: result.rows[0].name, postgres:16, migrations: expected, legacyDuplicateReplayed:false, schema:'PASS', functions:'PASS', triggers:'PASS', indexesAndConstraints:'PASS'}));
  } finally { await client.end(); }
}
main().catch(error => { console.error(error.message); process.exitCode=1; });
