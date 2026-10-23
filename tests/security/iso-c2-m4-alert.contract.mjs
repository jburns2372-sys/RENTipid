import test from 'node:test';
import assert from 'node:assert/strict';
import { alertDecision, reconcileAlert, TITLE, MARKER } from '../../scripts/security/backup-monitor-actions.mjs';
const issue = (number=7) => ({number,title:TITLE,state:'open',body:MARKER});
test('first unhealthy CREATE',()=>assert.equal(alertDecision('UNHEALTHY',[]).action,'CREATE'));
test('repeat unhealthy UPDATE',()=>assert.equal(alertDecision('UNHEALTHY',[issue()]).action,'UPDATE'));
test('recovery CLOSE',()=>assert.equal(alertDecision('HEALTHY',[issue()]).action,'CLOSE'));
test('healthy without incident NOOP',()=>assert.equal(alertDecision('HEALTHY',[]).action,'NOOP'));
test('duplicates choose lowest issue number',()=>assert.deepEqual(alertDecision('UNHEALTHY',[issue(9),issue(3),issue(7)]),{action:'UPDATE',issue:3,duplicates:[7,9]}));
test('unknown state never closes incident',()=>assert.equal(alertDecision('UNKNOWN',[issue()]).action,'UPDATE'));
test('closed issues and pull requests excluded',()=>assert.equal(alertDecision('UNHEALTHY',[{...issue(),state:'closed'},{...issue(),pull_request:{}}]).action,'CREATE'));
test('marker survives renamed incident',()=>assert.equal(alertDecision('UNHEALTHY',[{...issue(),title:'Renamed'}]).action,'UPDATE'));
test('mock lifecycle create update recover preserves history, missing labels allowed',async()=>{
  let open=[];const writes=[];
  const api=async(path,method='GET',body)=>{
    if(method==='GET') return path.includes('/labels')?[]:open;
    writes.push({path,method,body});
    if(path.endsWith('/issues')) open=[issue()];
    if(method==='PATCH') open=[];
    return {};
  };
  for(const status of ['UNHEALTHY','UNHEALTHY','HEALTHY','HEALTHY']) await reconcileAlert({api,repo:'o/r',evidence:{status}});
  assert.equal(writes.filter(w=>w.path.endsWith('/issues')).length,1);
  assert.equal(writes.filter(w=>w.path.endsWith('/comments')).length,2);
  assert.equal(writes.filter(w=>w.method==='PATCH').length,1);
  assert.deepEqual(writes[0].body.labels,[]);
});
test('duplicates are consolidated and closed deterministically',async()=>{
  const writes=[];const api=async(path,method='GET',body)=>{
    if(method==='GET')return [issue(9),issue(3)];
    writes.push({path,method,body});return {};
  };
  await reconcileAlert({api,repo:'o/r',evidence:{status:'UNHEALTHY'}});
  assert.equal(writes[0].path,'/repos/o/r/issues/3/comments');
  assert.equal(writes.at(-1).path,'/repos/o/r/issues/9');
  assert.equal(writes.at(-1).body.state,'closed');
});
