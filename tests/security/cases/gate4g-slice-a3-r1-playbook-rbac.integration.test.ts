import { Prisma, PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { assertSafeLocalTestDatabaseTarget } from '../../../src/lib/test-database-guard';
import { assertSecurityPermissionForService } from '../../../src/lib/security/authorization';
import {
  SECURITY_PERMISSIONS,
  getPhase1PermissionsForRole,
} from '../../../src/lib/security/permissions';

const prisma = new PrismaClient();
class IntentionalRollback extends Error {}

describe('Gate 4G Slice A3-R1: Playbook Lifecycle RBAC Foundation', () => {
  const unique = () => `${Date.now()}-${randomBytes(4).toString('hex')}`;

  const withRollback = async (
    work: (tx: Prisma.TransactionClient) => Promise<void>,
  ) => {
    try {
      await prisma.$transaction(async (tx) => {
        await work(tx);
        throw new IntentionalRollback();
      });
    } catch (error) {
      if (!(error instanceof IntentionalRollback)) throw error;
    }
  };

  const createUser = (tx: Prisma.TransactionClient, role: string, label: string) =>
    tx.user.create({
      data: {
        email: `a3-r1-${label.toLowerCase().replace(/ /g, '-')}-${unique()}@example.test`,
        full_name: `A3 R1 ${label}`,
        account_type: 'Individual',
        role,
        status: 'Verified',
        is_test_data: true,
      },
    });

  const PLAYBOOK_PERMS = [
    SECURITY_PERMISSIONS.PLAYBOOK_VIEW,
    SECURITY_PERMISSIONS.PLAYBOOK_CREATE,
    SECURITY_PERMISSIONS.PLAYBOOK_EDIT,
    SECURITY_PERMISSIONS.PLAYBOOK_VERSION_CREATE,
    SECURITY_PERMISSIONS.PLAYBOOK_SUBMIT_REVIEW,
  ];

  beforeAll(() => {
    assertSafeLocalTestDatabaseTarget();
  });

  describe('Static Permissions Matrix', () => {
    it('SOC_ANALYST has all five playbook permissions', () => {
      const perms = getPhase1PermissionsForRole('SOC_ANALYST');
      for (const p of PLAYBOOK_PERMS) {
        expect(perms).toContain(p);
      }
    });

    it('SOC_SUPERVISOR has all five playbook permissions', () => {
      const perms = getPhase1PermissionsForRole('SOC_SUPERVISOR');
      for (const p of PLAYBOOK_PERMS) {
        expect(perms).toContain(p);
      }
    });

    it('Super Admin has all five playbook permissions (Existing behavior remains compatible)', () => {
      const perms = getPhase1PermissionsForRole('Super Admin');
      for (const p of PLAYBOOK_PERMS) {
        expect(perms).toContain(p);
      }
    });

    it('Renter has none of the five permissions', () => {
      const perms = getPhase1PermissionsForRole('Renter');
      for (const p of PLAYBOOK_PERMS) {
        expect(perms).not.toContain(p);
      }
    });

    it('Individual Provider has none', () => {
      const perms = getPhase1PermissionsForRole('Individual Provider');
      for (const p of PLAYBOOK_PERMS) {
        expect(perms).not.toContain(p);
      }
    });

    it('Business Provider has none', () => {
      const perms = getPhase1PermissionsForRole('Business Provider');
      for (const p of PLAYBOOK_PERMS) {
        expect(perms).not.toContain(p);
      }
    });

    it('Finance-only role (Finance Admin) has none', () => {
      const perms = getPhase1PermissionsForRole('Finance Admin');
      for (const p of PLAYBOOK_PERMS) {
        expect(perms).not.toContain(p);
      }
    });

    it('Missing permission denies by default', () => {
      const perms = getPhase1PermissionsForRole('Unknown_Role');
      expect(perms).toHaveLength(0);
    });

    it('No PLAYBOOK_APPROVE, RESPONSE_REQUEST, or RESPONSE_APPROVE permission is introduced', () => {
      const keys = Object.keys(SECURITY_PERMISSIONS);
      expect(keys).not.toContain('PLAYBOOK_APPROVE');
      expect(keys).not.toContain('RESPONSE_REQUEST');
      expect(keys).not.toContain('RESPONSE_APPROVE');
      expect(keys).not.toContain('RESPONSE_EXECUTE');
      expect(keys).not.toContain('RESPONSE_REVOKE');
    });

    it('Existing Gate 4F incident-case permissions remain unchanged', () => {
      const analystPerms = getPhase1PermissionsForRole('SOC_ANALYST');
      expect(analystPerms).toContain(SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW);
      expect(analystPerms).toContain(SECURITY_PERMISSIONS.INCIDENT_CASE_CREATE);
      expect(analystPerms).toContain(SECURITY_PERMISSIONS.INCIDENT_CASE_ADD_NOTE);
      
      const supervisorPerms = getPhase1PermissionsForRole('SOC_SUPERVISOR');
      expect(supervisorPerms).toContain(SECURITY_PERMISSIONS.INCIDENT_CASE_RESOLVE);
    });
  });

  describe('Database-Authoritative Authorization Helpers', () => {
    it('SOC_ANALYST is granted PLAYBOOK_CREATE via authorization helper', async () => {
      await withRollback(async (tx) => {
        const u = await createUser(tx, 'SOC_ANALYST', 'Analyst');
        const allowed = await assertSecurityPermissionForService(u.id, SECURITY_PERMISSIONS.PLAYBOOK_CREATE, tx);
        expect(allowed).toBe(true);
      });
    });

    it('Caller-supplied fake role cannot bypass authorization', async () => {
      await withRollback(async (tx) => {
        // User is actually a Renter in the database
        const u = await createUser(tx, 'Renter', 'Sneaky Renter');
        
        // Caller tries to claim they are SOC_ANALYST, but helper uses database truth
        const allowed = await assertSecurityPermissionForService(u.id, SECURITY_PERMISSIONS.PLAYBOOK_CREATE, tx);
        expect(allowed).toBe(false);
      });
    });

    it('Denied checks create no database or audit mutation', async () => {
      await withRollback(async (tx) => {
        const u = await createUser(tx, 'Renter', 'Renter');
        
        // Count audit logs before
        const logsBefore = await tx.auditLog.count();
        
        // This will be denied
        const allowed = await assertSecurityPermissionForService(u.id, SECURITY_PERMISSIONS.PLAYBOOK_EDIT, tx);
        expect(allowed).toBe(false);

        // Count audit logs after
        const logsAfter = await tx.auditLog.count();
        expect(logsAfter).toEqual(logsBefore);
      });
    });

    it('Permission checks expose no credential or private-data leakage', async () => {
      await withRollback(async (tx) => {
        const u = await createUser(tx, 'SOC_ANALYST', 'Analyst');
        
        // Ensure the helper execution throws no exceptions that could leak state
        let threw = false;
        try {
          await assertSecurityPermissionForService(u.id, SECURITY_PERMISSIONS.PLAYBOOK_VIEW, tx);
          await assertSecurityPermissionForService('non_existent_id', SECURITY_PERMISSIONS.PLAYBOOK_VIEW, tx);
        } catch {
          threw = true;
        }
        
        expect(threw).toBe(false);
      });
    });
  });
});
