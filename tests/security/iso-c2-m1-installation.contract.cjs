const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
test('all 64 legacy SQL files preserve recorded workspace or Git checkout bytes', () => {
  const expected = require('./fixtures/iso-c2-m1-legacy-migration-sha256.json');
  const actual = {};
  for (const name of fs.readdirSync(path.join(root,'prisma/migrations')).sort()) {
    const file = path.join(root,'prisma/migrations',name,'migration.sql');
    if (fs.existsSync(file)) actual[name] = createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  assert.equal(Object.keys(expected).length,64);
  const committed = require('./fixtures/iso-c2-m1-legacy-git-sha256.json');
  assert.deepEqual(Object.keys(actual), Object.keys(expected));
  for (const name of Object.keys(actual)) assert.ok(actual[name]===expected[name] || actual[name]===committed[name], name+' checksum changed');
});
test('UserGlobalPreference successor is byte-identical to authoritative legacy SQL', () => {
  const relative='20260925000000_add_user_global_preference/migration.sql';
  assert.deepEqual(fs.readFileSync(path.join(root,'prisma/installation_migrations',relative)),fs.readFileSync(path.join(root,'prisma/migrations',relative)));
});
test('versioned PostgreSQL definitions use exact authoritative functions, triggers and partial index', () => {
  const source=read('prisma/migrations/20260724131703_amend_incident_case_history_assignment/migration.sql');
  const foundation=read('prisma/migrations/20260723053752_add_incident_case_foundation/migration.sql');
  const target=read('prisma/installation_migrations/20261022000000_installation_postgresql_objects/migration.sql');
  const normalize=s=>s.replace(/\r\n/g,'\n');
  const functions=source.match(/CREATE OR REPLACE FUNCTION [\s\S]*?\$\$ LANGUAGE plpgsql;/g);
  assert.equal(functions.length,2);
  for (const sql of functions) assert.ok(normalize(target).includes(normalize(sql)));
  const triggers=(source+'\n'+foundation).match(/CREATE TRIGGER [\s\S]*?EXECUTE FUNCTION .*?;/g);
  assert.equal(triggers.length,4);
  for (const sql of triggers) assert.ok(normalize(target).includes(normalize(sql)));
  const index=read('prisma/migrations/20260716032811_phase3_detection_rules_and_alerts/migration.sql').match(/CREATE UNIQUE INDEX "DetectionRule_rule_id_active_idx".*?;/)[0];
  assert.ok(target.includes(index));
  assert.doesNotMatch(target,/CREATE ROLE|GRANT .*rentipid_test_user/);
});
