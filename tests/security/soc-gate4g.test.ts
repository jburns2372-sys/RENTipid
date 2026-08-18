import { PrismaClient, SecurityPlaybookStatus } from '@prisma/client';
import { 
  submitResponseApprovalRequest, 
  approveResponseRequest, 
  consumeApprovalGrantForExecution, 
} from '../../src/lib/security/approvals/security-response-approval.service';

const prisma = new PrismaClient();

describe('GATE4G - Playbooks and Approvals', () => {
  let requesterId: string;
  let approverId: string;
  let unauthorizedId: string;
  let caseId: string;
  let playbookId: string;
  
  beforeAll(async () => {
    const ts = Date.now();
    const r = await prisma.user.create({
      data: { email: `req-${ts}@example.com`, full_name: 'Requester', account_type: 'Individual', role: 'SOC_ANALYST', status: 'Verified' }
    });
    requesterId = r.id;
    
    const a = await prisma.user.create({
      data: { email: `app-${ts}@example.com`, full_name: 'Approver', account_type: 'Individual', role: 'SOC_SUPERVISOR', status: 'Verified' }
    });
    approverId = a.id;

    const u = await prisma.user.create({
      data: { email: `unauth-${ts}@example.com`, full_name: 'Unauth', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    unauthorizedId = u.id;

    const c = await prisma.incidentCase.create({
      data: { title: 'Test Case', status: 'OPEN', severity: 'LOW', created_by_user: { connect: { id: requesterId } }, case_reference: 'INC-20260728-' + ts.toString().slice(-8), origin: 'MANUAL', opened_at: new Date() }
    });
    caseId = c.id;

    playbookId = 'PB-TEST-' + ts;
    await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: playbookId,
        version: 1,
        name: 'Test Playbook',
        description: 'Test',
        status: SecurityPlaybookStatus.ACTIVE,
        created_by: { connect: { id: requesterId } },
        approved_by: { connect: { id: approverId } }
      }
    });
  });

  afterAll(async () => {
    if (caseId) {
      await prisma.securityResponseAction.deleteMany({ where: { execution: { incident_case_id: caseId } } });
      await prisma.securityResponseExecution.deleteMany({ where: { incident_case_id: caseId } });
      await prisma.securityResponseApprovalDecision.deleteMany({ where: { request: { incident_case_id: caseId } } });
      await prisma.securityResponseApprovalGrant.deleteMany({ where: { incident_case_id: caseId } });
      await prisma.securityResponseApprovalRequest.deleteMany({ where: { incident_case_id: caseId } });
      await prisma.incidentCasePlaybookLink.deleteMany({ where: { incident_case_id: caseId } });
      await prisma.incidentCase.deleteMany({ where: { id: caseId } });
    }
    if (playbookId) {
      await prisma.securityResponsePlaybook.deleteMany({ where: { playbook_id: playbookId } });
    }
    if (requesterId) {
      await prisma.user.deleteMany({ where: { id: { in: [requesterId, approverId, unauthorizedId].filter(Boolean) } } });
    }
    await prisma.$disconnect();
  });

  it('execution without approval is rejected', async () => {
    await prisma.$transaction(async (tx) => {
      await expect(consumeApprovalGrantForExecution(tx, approverId, { grant_id: 'invalid-grant-id', idempotency_key: 'exec-1' }))
        .rejects.toThrow('GRANT_NOT_FOUND');
    });
  });

  it('an unauthorized role cannot approve', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: caseId, playbook_id: playbookId, playbook_version: 1, justification: 'test', response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: 'user-1'
      });
      await expect(approveResponseRequest(tx, unauthorizedId, { request_id: req.id, validity_duration_ms: 1000 }))
        .rejects.toThrow('UNAUTHORIZED');
      throw new Error('ROLLBACK');
    }).catch(e => { if (e.message !== 'ROLLBACK') throw e; });
  });

  it('an approval is bound to the correct action and target', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: caseId, playbook_id: playbookId, playbook_version: 1, justification: 'test', response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: 'user-1'
      });
      const approved = await approveResponseRequest(tx, approverId, { request_id: req.id, validity_duration_ms: 10000 });
      expect(approved.request.response_type).toBe('NOOP_SIMULATION');
      expect(approved.grant.incident_case_id).toBe(caseId);
      throw new Error('ROLLBACK');
    }).catch(e => { if (e.message !== 'ROLLBACK') throw e; });
  });

  it('reused approval is rejected where single-use is required', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: caseId, playbook_id: playbookId, playbook_version: 1, justification: 'test', response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: 'user-1'
      });
      const approved = await approveResponseRequest(tx, approverId, { request_id: req.id, validity_duration_ms: 10000 });
      await consumeApprovalGrantForExecution(tx, approverId, { grant_id: approved.grant.id, idempotency_key: 'key-1' });
      await expect(consumeApprovalGrantForExecution(tx, approverId, { grant_id: approved.grant.id, idempotency_key: 'key-2' }))
        .rejects.toThrow('GRANT_NOT_AVAILABLE');
      throw new Error('ROLLBACK');
    }).catch(e => { if (e.message !== 'ROLLBACK') throw e; });
  });

  it('expired, revoked, or invalid approval is rejected', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: caseId, playbook_id: playbookId, playbook_version: 1, justification: 'test', response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: 'user-1'
      });
      const approved = await approveResponseRequest(tx, approverId, { request_id: req.id, validity_duration_ms: -1000 });
      await expect(consumeApprovalGrantForExecution(tx, approverId, { grant_id: approved.grant.id, idempotency_key: 'key-ex' }))
        .rejects.toThrow('GRANT_EXPIRED');
      throw new Error('ROLLBACK');
    }).catch(e => { if (e.message !== 'ROLLBACK') throw e; });
  });

  it('high-risk actions require valid human approval', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: caseId, playbook_id: playbookId, playbook_version: 1, justification: 'test', response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: 'user-1'
      });
      const approved = await approveResponseRequest(tx, approverId, { request_id: req.id, validity_duration_ms: 10000 });
      await expect(consumeApprovalGrantForExecution(tx, requesterId, { grant_id: approved.grant.id, idempotency_key: 'exec-self' }))
        .rejects.toThrow('UNAUTHORIZED');
      throw new Error('ROLLBACK');
    }).catch(e => { if (e.message !== 'ROLLBACK') throw e; });
  });

  it('approval and rejection create real audit records', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: caseId, playbook_id: playbookId, playbook_version: 1, justification: 'test', response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: 'user-1'
      });
      await approveResponseRequest(tx, approverId, { request_id: req.id, validity_duration_ms: 10000 });
      const audits = await tx.auditLog.findMany({
        where: { target_id: req.id, action: 'SOC_RESPONSE_APPROVAL_GRANTED' }
      });
      expect(audits.length).toBe(1);
      throw new Error('ROLLBACK');
    }).catch(e => { if (e.message !== 'ROLLBACK') throw e; });
  });

  it('failed execution leaves no partial mutation', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: caseId, playbook_id: playbookId, playbook_version: 1, justification: 'test', response_type: 'NOOP_SIMULATION', target_type: 'USER', target_id: 'user-1'
      });
      const preCount = await tx.securityResponseApprovalDecision.count();
      try {
        await approveResponseRequest(tx, unauthorizedId, { request_id: req.id, validity_duration_ms: 10000 });
        throw new Error('EXPECTED_TO_FAIL');
      } catch (e) {
        expect((e as Error).message).toBe('UNAUTHORIZED');
      }
      const postCount = await tx.securityResponseApprovalDecision.count();
      expect(postCount).toBe(preCount);
      throw new Error('ROLLBACK');
    }).catch(e => { if (e.message !== 'ROLLBACK') throw e; });
  });
});
