import { PrismaClient, SecurityApprovalGrantState, SecurityApprovalStatus } from '@prisma/client';
import { approveResponseRequest, submitResponseApprovalRequest } from '../../../src/lib/security/approvals/security-response-approval.service';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';

const prisma = new PrismaClient();

describe('Gate 4G Slice A4 A5 R2 Grant Consumption Boundary', () => {
  let requesterId: string;
  let approverId: string;
  let playbookId: string;
  let incidentCaseId: string;

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    
    const requester = await prisma.user.create({
      data: {
        email: `requester_r2_${Date.now()}@test.com`,
        full_name: 'Requester Analyst',
        role: 'SOC_ANALYST',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    requesterId = requester.id;

    const approver = await prisma.user.create({
      data: {
        email: `approver_r2_${Date.now()}@test.com`,
        full_name: 'Approver Supervisor',
        role: 'SOC_SUPERVISOR',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    approverId = approver.id;

    const reporter = await prisma.user.create({
      data: { email: `reporter_${Date.now()}@test.com`, full_name: 'Rep', role: 'Guest', status: 'Verified', account_type: 'Individual' },
    });
    const incCase = await prisma.incidentCase.create({
      data: {
        title: 'Test Case',
        summary: 'Test',
        severity: 'MEDIUM',
        status: 'OPEN',
        created_by_user_id: reporter.id,
        case_reference: `INC-20240101-${Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, '0')}`,
        origin: 'MANUAL',
        opened_at: new Date(),
      },
    });
    incidentCaseId = incCase.id;

    const pb = await prisma.securityResponsePlaybook.create({
      data: {
        playbook_id: `PB-TEST-${Date.now()}`,
        version: 1,
        name: 'Test PB',
        description: 'Desc',
        status: 'ACTIVE',
        lock_version: 0,
        created_by_id: approverId,
      },
    });
    playbookId = pb.playbook_id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Approval service does not export consumeApprovalGrant', async () => {
    const service = await import('../../../src/lib/security/approvals/security-response-approval.service');
    expect(service).not.toHaveProperty('consumeApprovalGrant');
  });

  it('No Gate 4G API route exposes grant consumption', async () => {
    const api = await import('../../../src/lib/security/approvals/security-response-approval-api');
    const handlers = api.createApprovalApiHandlers({
      database: prisma,
      getAuthenticatedUser: async () => ({ id: requesterId })
    });
    expect(handlers).not.toHaveProperty('consumeGrant');
    expect(handlers).not.toHaveProperty('consumeApprovalGrant');
  });

  it('Approval still creates a valid grant without executable consumption', async () => {
    await prisma.$transaction(async (tx) => {
      const req = await submitResponseApprovalRequest(tx, requesterId, {
        incident_case_id: incidentCaseId,
        playbook_id: playbookId,
        playbook_version: 1,
        justification: 'Need consumption test',
      });

      const approved = await approveResponseRequest(tx, approverId, {
        request_id: req.id,
        validity_duration_ms: 3600000,
      });

      expect(approved.request.status).toBe(SecurityApprovalStatus.APPROVED);
      expect(approved.grant).toBeDefined();
      expect(approved.grant?.grant_state).toBe(SecurityApprovalGrantState.AVAILABLE);
    });
  });
});
