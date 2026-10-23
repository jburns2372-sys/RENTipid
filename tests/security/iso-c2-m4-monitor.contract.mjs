import test from 'node:test';
import assert from 'node:assert/strict';
import { checkProvider, freshness, PROJECT, BRANCH, RETENTION } from '../../scripts/security/check-backup-freshness.mjs';
import { scheduledFreshness, PROVIDER_STEP, pages } from '../../scripts/security/backup-monitor-actions.mjs';

const key = 'NEVER-EMIT-THIS-SECRET';
const now = Date.parse('2026-10-23T14:00:00Z');
function fixture({ project = {}, branch = {}, status = 200, unavailable = false, rawProject, rawBranch } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (unavailable) throw new Error(key);
    return { status, ok: status === 200, json: async () => url.endsWith(BRANCH) ?
      (rawBranch ?? { branch: { id: BRANCH, project_id: PROJECT, current_state: 'ready', protected: true, ...branch } }) :
      (rawProject ?? { project: { id: PROJECT, history_retention_seconds: RETENTION, ...project } }) };
  };
  return { calls, run: () => checkProvider({ key, fetchImpl, now: () => new Date(now) }) };
}
test('correct provider fields pass; only two read-only management GETs', async () => {
  const f = fixture(); const e = await f.run();
  assert.equal(e.status, 'HEALTHY');
  assert.equal(f.calls.length, 2);
  assert(f.calls.every(c => c.options.method === 'GET' && c.url.startsWith('https://console.neon.tech/api/v2/projects/' + PROJECT)));
  assert.equal(e.observed_at, new Date(now).toISOString());
});
for (const [name, options] of [
  ['wrong project', { project: { id: 'wrong' } }],
  ['wrong branch', { branch: { id: 'wrong' } }],
  ['wrong branch parent project', { branch: { project_id: 'wrong' } }],
  ['branch not ready', { branch: { current_state: 'starting' } }],
  ['branch not protected', { branch: { protected: false } }],
  ['retention below 30 days', { project: { history_retention_seconds: 21600 } }],
  ['401 auth failure', { status: 401 }],
  ['403 auth failure', { status: 403 }],
  ['provider 503', { status: 503 }],
  ['network unavailable', { unavailable: true }],
  ['malformed project', { rawProject: {} }],
  ['malformed branch', { rawBranch: {} }],
  ['retention string malformed', { project: { history_retention_seconds: '2592000' } }],
  ['missing protection', { branch: { protected: undefined } }],
  ['unknown state fails closed', { branch: { current_state: 'UNKNOWN' } }],
]) test(name, async () => assert.equal((await fixture(options).run()).status, 'UNHEALTHY'));
test('JSON parse failure is unhealthy', async () => {
  const e = await checkProvider({key, fetchImpl: async () => ({ok:true,status:200,json:async()=>{throw new Error(key);}})});
  assert.equal(e.status, 'UNHEALTHY'); assert(!JSON.stringify(e).includes(key));
});
test('API key never appears in output, including reflected provider fields/errors', async () => {
  for (const options of [{unavailable:true},{project:{id:key}},{branch:{current_state:key}},{rawProject:{error:key}}]) {
    assert(!JSON.stringify(await fixture(options).run()).includes(key));
  }
});
test('missing authentication fails without fetch', async () => {
  assert.equal((await checkProvider({ fetchImpl: () => assert.fail('network') })).failure_reason, 'AUTH_FAILURE');
});
test('wrong configured target fails without fetch', async () => {
  assert.equal((await checkProvider({key, projectId:'wrong', fetchImpl:()=>assert.fail('network')})).status,'UNHEALTHY');
});
test('30 minute inclusive boundary passes', () => assert.equal(freshness(new Date(now - 1800000).toISOString(), true, now), 'FRESH'));
test('older than 30 minutes fails', () => assert.equal(freshness(new Date(now - 1800001).toISOString(), true, now), 'STALE'));
test('first activation is explicit bootstrap', () => assert.equal(freshness(null, false, now), 'BOOTSTRAP'));
test('missing evidence after activation fails', () => assert.equal(freshness(null, true, now), 'MISSING'));
test('invalid/future time never passes', () => {
  for(const t of ['bad',new Date(now+1).toISOString()]) assert.equal(freshness(t,true,now),'UNKNOWN');
});

function history({ prior = [], jobs = [], event = 'schedule', attempt = 1, runNumber = 1 } = {}) {
  const api = async path => path.includes('/jobs?') ? { jobs } :
    path.includes('/workflows/') ? { workflow_runs: prior } : {run_number: runNumber, workflow_id:1, head_branch:'main', event};
  return scheduledFreshness({api,repo:'owner/repo',runId:'10',attempt,now});
}
const run = { id:9, run_number:9, event:'schedule', head_branch:'main', workflow_id:1, conclusion:'failure' };
test('first legitimate scheduled history bootstraps', async()=>assert.equal(await history(),'BOOTSTRAP'));
test('manual run is not bootstrap evidence', async()=>assert.equal(await history({event:'workflow_dispatch'}),'MISSING'));
test('rerun cannot bootstrap', async()=>assert.equal(await history({attempt:2}),'MISSING'));
test('prior failed activation prevents repeated bootstrap', async()=>assert.equal(await history({runNumber:10,prior:[run]}),'MISSING'));
test('successful provider step in stale failed workflow is new evidence for next run', async()=> {
  assert.equal(await history({runNumber:10,prior:[run],jobs:[{steps:[{name:PROVIDER_STEP,conclusion:'success',started_at:new Date(now-900000).toISOString()}]}]}),'FRESH');
});
test('failed provider step is not evidence', async()=> {
  assert.equal(await history({runNumber:10,prior:[run],jobs:[{steps:[{name:PROVIDER_STEP,conclusion:'failure',started_at:new Date(now-900000).toISOString()}]}]}),'MISSING');
});
test('old successful provider step is stale', async()=> {
  assert.equal(await history({runNumber:10,prior:[run],jobs:[{steps:[{name:PROVIDER_STEP,conclusion:'success',started_at:new Date(now-1800001).toISOString()}]}]}),'STALE');
});
test('history API failure rejects rather than bootstraps', async()=> {
  await assert.rejects(scheduledFreshness({api:async()=>{throw new Error('offline');},repo:'o/r',runId:10,now}));
});
test('malformed job response rejects', async()=>await assert.rejects(history({runNumber:10,prior:[run],jobs:[{}]})));
test('pagination reads beyond first page', async()=> {
  let calls=0; const result = await pages(async()=>++calls===1 ? Array(100).fill({}) : [{}],'/issues');
  assert.equal(result.length,101);assert.equal(calls,2);
});
test('history truncation fails closed', async()=>await assert.rejects(pages(async()=>Array(100).fill({}),'/issues')));

test('deleted history cannot bootstrap an established workflow', async()=>assert.equal(await history({runNumber:10}),'MISSING'));
test('recent evidence succeeds without exhausting long history', async()=> {
  let historyCalls=0;
  const api=async path=> {
    if(path.includes('/jobs?')) return {jobs:[{steps:[{name:PROVIDER_STEP,conclusion:'success',started_at:new Date(now-900000).toISOString()}]}]};
    if(path.includes('/workflows/')) { historyCalls++; return {workflow_runs:Array.from({length:100},(_,i)=>({...run,id:2000-i,run_number:2000-i}))}; }
    return {run_number:2001,workflow_id:1,head_branch:'main',event:'schedule'};
  };
  assert.equal(await scheduledFreshness({api,repo:'o/r',runId:2001,now}),'FRESH');
  assert.equal(historyCalls,1);
});
