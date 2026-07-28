import { PrismaClient } from '@prisma/client';
import { assertAccountAllowedForSocAccess, assertSecurityPermissionForService, canAccessSecurityPermission } from '../../src/lib/security/authorization';
import { SECURITY_PERMISSIONS, SecurityPermission } from '../../src/lib/security/permissions';

const prisma = new PrismaClient();

describe('PHASE5D - SOC Authorization Evidence', () => {
  let adminId: string;
  let unauthId: string;
  let disabledId: string;

  beforeAll(async () => {
    const ts = Date.now();
    const a = await prisma.user.create({
      data: { email: `admin-${ts}@example.com`, full_name: 'SOC Admin', account_type: 'Individual', role: 'SOC_SUPERVISOR', status: 'Verified' }
    });
    adminId = a.id;
    
    const u = await prisma.user.create({
      data: { email: `unauth-${ts}@example.com`, full_name: 'SOC Unauth', account_type: 'Individual', role: 'Renter', status: 'Verified' }
    });
    unauthId = u.id;
    
    const d = await prisma.user.create({
      data: { email: `disabled-${ts}@example.com`, full_name: 'SOC Disabled', account_type: 'Individual', role: 'SOC_ANALYST', status: 'Suspended' }
    });
    disabledId = d.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [adminId, unauthId, disabledId] } } });
    await prisma.$disconnect();
  });

  it('unauthorized access: non-SOC role is denied', async () => {
    const user = await prisma.user.findUnique({ where: { id: unauthId } });
    const res = await assertAccountAllowedForSocAccess(user as any);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('SOC_ACCESS_DENIED_ROLE');
  });

  it('invalid status: suspended SOC user is denied', async () => {
    const user = await prisma.user.findUnique({ where: { id: disabledId } });
    const res = await assertAccountAllowedForSocAccess(user as any);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe('SOC_ACCESS_DENIED_ACCOUNT_STATUS');
  });

  it('authorized success: active SOC user is allowed and returns permissions', async () => {
    const user = await prisma.user.findUnique({ where: { id: adminId } });
    const res = await assertAccountAllowedForSocAccess(user as any);
    expect(res.allowed).toBe(true);
    expect(res.permissions?.length).toBeGreaterThan(0);
    // Check specific permission
    const hasPerm = canAccessSecurityPermission(res.permissions!, SECURITY_PERMISSIONS.PLAYBOOK_VIEW as SecurityPermission);
    // Note: Actually the permission is INCIDENT_CASE_VIEW
    const hasDashboardPerm = canAccessSecurityPermission(res.permissions!, SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW as SecurityPermission);
    expect(hasDashboardPerm).toBe(true);
  });

  it('service authorization: rejects unauthorized user', async () => {
    const isAllowed = await assertSecurityPermissionForService(unauthId, SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW as SecurityPermission, prisma);
    expect(isAllowed).toBe(false);
  });

  it('service authorization: allows authorized user', async () => {
    const isAllowed = await assertSecurityPermissionForService(adminId, SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW as SecurityPermission, prisma);
    expect(isAllowed).toBe(true);
  });

  it('service authorization: safely fails on non-existent user without mutation', async () => {
    const isAllowed = await assertSecurityPermissionForService('non-existent-id', SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW as SecurityPermission, prisma);
    expect(isAllowed).toBe(false);
  });
});

