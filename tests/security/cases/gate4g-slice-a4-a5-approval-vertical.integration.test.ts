import { PrismaClient, SecurityApprovalStatus, SecurityApprovalGrantState, SecurityPlaybookStatus } from '@prisma/client';
import {
  ApprovalWriterError,
  submitResponseApprovalRequest,
  approveResponseRequest,
  rejectResponseRequest,
  cancelResponseRequest,
  revokeApprovalGrant,
  consumeApprovalGrant,
  expireResponseRequest
} from '../../../src/lib/security/approvals/security-response-approval.service';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';

const prisma = new PrismaClient();

describe('Gate 4G Slice A4 A5 Approval Vertical', () => {
  let requesterId: string;
  let approverId: string;
  let unauthorizedId: string;
  let incidentCaseId: string;
  let playbookId: string;

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    
    const requester = await prisma.user.create({
      data: {
        email: `requester_${Date.now()}@test.com`,
        full_name: 'Requester Analyst',
        role: 'SOC_ANALYST',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    requesterId = requester.id;

    const approver = await prisma.user.create({
      data: {
        email: `approver_${Date.now()}@test.com`,
        full_name: 'Approver Supervisor',
        role: 'SOC_SUPERVISOR',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    approverId = approver.id;

    const unauthorized = await prisma.user.create({
      data: {
        email: `unauthorized_${Date.now()}@test.com`,
        full_name: 'Unauthorized User',
        role: 'Guest',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    unauthorizedId = unauthorized.id;

    // Create a mock incident case and playbook for relationships
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
        case_reference: 'INC-20240101-ABCDEF12',
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
        status: SecurityPlaybookStatus.ACTIVE,
        lock_version: 0,
        created_by_id: approverId,
      },
    });
    playbookId = pb.playbook_id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('REQUEST CREATION', () => {
    it('Authorized request creation succeeds', async () => {
      await prisma.$transaction(async (tx) => {
        const req = await submitResponseApprovalRequest(tx, requesterId, {
          incident_case_id: incidentCaseId,
          playbook_id: playbookId,
          playbook_version: 1,
          justification: 'Need approval',
        });
        expect(req.status).toBe(SecurityApprovalStatus.PENDING);
        expect(req.requester_id).toBe(requesterId);
      });
    });

    it('Unauthorized request denial creates no grant', async () => {
      await prisma.$transaction(async (tx) => {
        await expect(
          submitResponseApprovalRequest(tx, unauthorizedId, {
            incident_case_id: incidentCaseId,
            playbook_id: playbookId,
            playbook_version: 1,
            justification: 'Hax',
          })
        ).rejects.toThrow(new ApprovalWriterError('UNAUTHORIZED'));
      });
    });
  });

  describe('APPROVAL & REJECTION', () => {
    it('Self-approval rejected', async () => {
      await prisma.$transaction(async (tx) => {
        const req = await submitResponseApprovalRequest(tx, approverId, {
          incident_case_id: incidentCaseId,
          playbook_id: playbookId,
          playbook_version: 1,
          justification: 'Self request',
        });

        await expect(
          approveResponseRequest(tx, approverId, {
            request_id: req.id,
            validity_duration_ms: 10000,
          })
        ).rejects.toThrow(new ApprovalWriterError('SELF_APPROVAL_NOT_ALLOWED'));
      });
    });

    it('Correct approver succeeds and creates a grant', async () => {
      await prisma.$transaction(async (tx) => {
        const req = await submitResponseApprovalRequest(tx, requesterId, {
          incident_case_id: incidentCaseId,
          playbook_id: playbookId,
          playbook_version: 1,
          justification: 'Please approve',
        });

        const { request, grant } = await approveResponseRequest(tx, approverId, {
          request_id: req.id,
          reason: 'Looks good',
          validity_duration_ms: 3600000,
        });

        expect(request.status).toBe(SecurityApprovalStatus.APPROVED);
        expect(grant.grant_state).toBe(SecurityApprovalGrantState.AVAILABLE);
      });
    });

    it('Rejection path works', async () => {
      await prisma.$transaction(async (tx) => {
        const req = await submitResponseApprovalRequest(tx, requesterId, {
          incident_case_id: incidentCaseId,
          playbook_id: playbookId,
          playbook_version: 1,
          justification: 'Please approve',
        });

        const result = await rejectResponseRequest(tx, approverId, {
          request_id: req.id,
          reason: 'No',
        });

        expect(result.status).toBe(SecurityApprovalStatus.REJECTED);
      });
    });
  });

  describe('LIFECYCLE CONTROLS', () => {
    it('Cancellation only while pending', async () => {
      await prisma.$transaction(async (tx) => {
        const req = await submitResponseApprovalRequest(tx, requesterId, {
          incident_case_id: incidentCaseId,
          playbook_id: playbookId,
          playbook_version: 1,
          justification: 'Cancel me',
        });

        const cancelled = await cancelResponseRequest(tx, requesterId, { request_id: req.id });
        expect(cancelled.status).toBe(SecurityApprovalStatus.CANCELLED);

        // Cannot cancel again
        await expect(
          cancelResponseRequest(tx, requesterId, { request_id: req.id })
        ).rejects.toThrow(new ApprovalWriterError('REQUEST_NOT_PENDING'));
      });
    });

    it('Revocation before use', async () => {
      await prisma.$transaction(async (tx) => {
        const req = await submitResponseApprovalRequest(tx, requesterId, {
          incident_case_id: incidentCaseId,
          playbook_id: playbookId,
          playbook_version: 1,
          justification: 'Please approve',
        });

        await approveResponseRequest(tx, approverId, {
          request_id: req.id,
          validity_duration_ms: 3600000,
        });

        const revoked = await revokeApprovalGrant(tx, approverId, { request_id: req.id, reason: 'Nvm' });
        expect(revoked.request.status).toBe(SecurityApprovalStatus.REVOKED);
        expect(revoked.grant.grant_state).toBe(SecurityApprovalGrantState.REVOKED);
      });
    });

    it('Single-use grant behavior (consume)', async () => {
      await prisma.$transaction(async (tx) => {
        const req = await submitResponseApprovalRequest(tx, requesterId, {
          incident_case_id: incidentCaseId,
          playbook_id: playbookId,
          playbook_version: 1,
          justification: 'Need consumption',
        });

        await approveResponseRequest(tx, approverId, {
          request_id: req.id,
          validity_duration_ms: 3600000,
        });

        const consumed = await consumeApprovalGrant(tx, requesterId, { request_id: req.id });
        expect(consumed.grant.grant_state).toBe(SecurityApprovalGrantState.CONSUMED);

        // Try consuming again
        await expect(
          consumeApprovalGrant(tx, requesterId, { request_id: req.id })
        ).rejects.toThrow(new ApprovalWriterError('REQUEST_NOT_APPROVED'));
      });
    });
  });
});
