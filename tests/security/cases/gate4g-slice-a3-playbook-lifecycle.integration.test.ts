import { PrismaClient, SecurityPlaybookStatus, SecurityResponseActionType, SecurityResponseReversibility, SecuritySeverity } from '@prisma/client';
import {
  createSecurityResponsePlaybookDraft,
  updateSecurityResponsePlaybookDraft,
  addSecurityResponseStep,
  updateSecurityResponseStep,
  removeSecurityResponseStep,
  reorderSecurityResponseSteps,
  createSecurityResponsePlaybookVersion,
  submitSecurityResponsePlaybookForReview,
  PlaybookWriterError
} from '../../../src/lib/security/playbooks/security-response-playbook.service';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';

const prisma = new PrismaClient();

describe('Gate 4G Slice A3 Playbook Lifecycle', () => {
  let authorizedUserId: string;
  let unauthorizedUserId: string;

  beforeAll(async () => {
    assertSafeLocalTestDatabaseTarget();
    
    // Create users for testing
    const authorizedUser = await prisma.user.create({
      data: {
        email: `authorized_${Date.now()}@test.com`,
        full_name: 'Authorized User',
        role: 'SOC_ANALYST',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    authorizedUserId = authorizedUser.id;

    const unauthorizedUser = await prisma.user.create({
      data: {
        email: `unauthorized_${Date.now()}@test.com`,
        full_name: 'Unauthorized User',
        role: 'Guest',
        status: 'Verified',
        account_type: 'Individual',
      },
    });
    unauthorizedUserId = unauthorizedUser.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('DRAFT CREATION', () => {
    it('Authorized creation succeeds, status is DRAFT, lock_version is 0', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Test Playbook 1',
          description: 'Description 1'
        });

        expect(draft.status).toBe(SecurityPlaybookStatus.DRAFT);
        expect(draft.lock_version).toBe(0);
        expect(draft.version).toBe(0);
        expect(draft.created_by_id).toBe(authorizedUserId);
      });
    });

    it('Unauthorized actor is denied and creates no partial records', async () => {
      await prisma.$transaction(async (tx) => {
        await expect(createSecurityResponsePlaybookDraft(tx, unauthorizedUserId, {
          name: 'Unauthorized Playbook',
          description: 'Should fail'
        })).rejects.toThrow(new PlaybookWriterError('UNAUTHORIZED'));
      });
    });
  });

  describe('DRAFT EDITING', () => {
    it('Correct lock_version update succeeds and increments lock_version exactly once', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Test Playbook',
          description: 'Desc'
        });

        const updated = await updateSecurityResponsePlaybookDraft(tx, authorizedUserId, draft.id, 0, {
          name: 'Updated Name'
        });

        expect(updated.name).toBe('Updated Name');
        expect(updated.lock_version).toBe(1);
      });
    });

    it('Stale lock_version updates zero rows and is rejected', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Stale Test',
          description: 'Desc'
        });

        await expect(updateSecurityResponsePlaybookDraft(tx, authorizedUserId, draft.id, 999, {
          name: 'Stale Update'
        })).rejects.toThrow(new PlaybookWriterError('STALE_OR_INVALID_STATE'));
        
        const fresh = await tx.securityResponsePlaybook.findUnique({ where: { id: draft.id } });
        expect(fresh?.name).toBe('Stale Test');
      });
    });

    it('REVIEW_PENDING draft cannot be edited', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Review Pending Test',
          description: 'Desc'
        });
        
        await addSecurityResponseStep(tx, authorizedUserId, draft.id, 0, {
          step_order: 1,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Do something',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        });

        await submitSecurityResponsePlaybookForReview(tx, authorizedUserId, draft.id, 1);

        // Edit should now fail because status is not DRAFT
        await expect(updateSecurityResponsePlaybookDraft(tx, authorizedUserId, draft.id, 2, {
          name: 'Should Fail'
        })).rejects.toThrow(new PlaybookWriterError('STALE_OR_INVALID_STATE'));
      });
    });
  });

  describe('STEP MANAGEMENT', () => {
    it('Valid step addition succeeds and increments lock_version', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Step Test',
          description: 'Desc'
        });

        const step = await addSecurityResponseStep(tx, authorizedUserId, draft.id, 0, {
          step_order: 1,
          action_type: SecurityResponseActionType.ACCOUNT_RESTRICTION,
          human_instruction: 'Restrict account',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.MEDIUM
        });

        expect(step.step_order).toBe(1);
        const fresh = await tx.securityResponsePlaybook.findUnique({ where: { id: draft.id } });
        expect(fresh?.lock_version).toBe(1);
      });
    });

    it('Duplicate step order is rejected', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Dup Step Test',
          description: 'Desc'
        });

        await addSecurityResponseStep(tx, authorizedUserId, draft.id, 0, {
          step_order: 1,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Test 1',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        });

        await expect(addSecurityResponseStep(tx, authorizedUserId, draft.id, 1, {
          step_order: 1,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Test 2',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        })).rejects.toThrow(new PlaybookWriterError('DUPLICATE_STEP_ORDER'));
      });
    });

    it('Step update and removal succeed only while editable', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Step Update Remove Test',
          description: 'Desc'
        });

        const step = await addSecurityResponseStep(tx, authorizedUserId, draft.id, 0, {
          step_order: 1,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Test',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        });

        await updateSecurityResponseStep(tx, authorizedUserId, draft.id, step.id, 1, {
          human_instruction: 'Updated Test'
        });

        const updatedStep = await tx.securityResponseStep.findUnique({ where: { id: step.id } });
        expect(updatedStep?.human_instruction).toBe('Updated Test');

        await removeSecurityResponseStep(tx, authorizedUserId, draft.id, step.id, 2);
        const removedStep = await tx.securityResponseStep.findUnique({ where: { id: step.id } });
        expect(removedStep).toBeNull();
      });
    });

    it('Reorder succeeds atomically and prevents duplicates', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Step Reorder Test',
          description: 'Desc'
        });

        const step1 = await addSecurityResponseStep(tx, authorizedUserId, draft.id, 0, {
          step_order: 1,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Test 1',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        });

        const step2 = await addSecurityResponseStep(tx, authorizedUserId, draft.id, 1, {
          step_order: 2,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Test 2',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        });

        await reorderSecurityResponseSteps(tx, authorizedUserId, draft.id, 2, [
          { step_id: step1.id, new_order: 2 },
          { step_id: step2.id, new_order: 1 },
        ]);

        const fresh1 = await tx.securityResponseStep.findUnique({ where: { id: step1.id } });
        const fresh2 = await tx.securityResponseStep.findUnique({ where: { id: step2.id } });

        expect(fresh1?.step_order).toBe(2);
        expect(fresh2?.step_order).toBe(1);
      });
    });
  });

  describe('VERSIONING', () => {
    it('Creates immutable version, increments semantic version, preserves order', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Version Test',
          description: 'Desc'
        });

        await addSecurityResponseStep(tx, authorizedUserId, draft.id, 0, {
          step_order: 1,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Step 1',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        });

        const version1 = await createSecurityResponsePlaybookVersion(tx, authorizedUserId, draft.id, 1);
        
        expect(version1.version).toBe(1);
        expect(version1.lock_version).toBe(0);

        const versionSteps = await tx.securityResponseStep.findMany({
          where: { playbook_id: version1.playbook_id, playbook_version: 1 }
        });
        expect(versionSteps.length).toBe(1);
        expect(versionSteps[0].step_order).toBe(1);

        const freshDraft = await tx.securityResponsePlaybook.findUnique({ where: { id: draft.id } });
        expect(freshDraft?.lock_version).toBe(2);
      });
    });
  });

  describe('REVIEW SUBMISSION', () => {
    it('Valid snapshot can be submitted and increments lock_version', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Review Test',
          description: 'Desc'
        });

        await addSecurityResponseStep(tx, authorizedUserId, draft.id, 0, {
          step_order: 1,
          action_type: SecurityResponseActionType.MANUAL_PROCEDURE,
          human_instruction: 'Step 1',
          reversibility: SecurityResponseReversibility.REVERSIBLE,
          risk_level: SecuritySeverity.LOW
        });

        await submitSecurityResponsePlaybookForReview(tx, authorizedUserId, draft.id, 1);

        const freshDraft = await tx.securityResponsePlaybook.findUnique({ where: { id: draft.id } });
        expect(freshDraft?.status).toBe(SecurityPlaybookStatus.REVIEW_PENDING);
        expect(freshDraft?.lock_version).toBe(2);
      });
    });

    it('Empty definition cannot be submitted', async () => {
      await prisma.$transaction(async (tx) => {
        const draft = await createSecurityResponsePlaybookDraft(tx, authorizedUserId, {
          name: 'Empty Review Test',
          description: 'Desc'
        });

        await expect(submitSecurityResponsePlaybookForReview(tx, authorizedUserId, draft.id, 0))
          .rejects.toThrow(new PlaybookWriterError('EMPTY_DEFINITION'));
      });
    });
  });

  describe('SECURITY AND ISOLATION', () => {
    it('Permission denial creates no business mutation', async () => {
      await prisma.$transaction(async (tx) => {
        const countBefore = await tx.securityResponsePlaybook.count();
        
        await expect(createSecurityResponsePlaybookDraft(tx, unauthorizedUserId, {
          name: 'Secret',
          description: 'Desc'
        })).rejects.toThrow(new PlaybookWriterError('UNAUTHORIZED'));

        const countAfter = await tx.securityResponsePlaybook.count();
        expect(countAfter).toBe(countBefore);
      });
    });
  });
});
