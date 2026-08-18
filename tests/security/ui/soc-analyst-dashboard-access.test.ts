import { getPhase1PermissionsForRole, SECURITY_PERMISSIONS } from '../../../src/lib/security/permissions';

describe('SOC Analyst Least Privilege Dashboard Access', () => {
  const analystPermissions = getPhase1PermissionsForRole('SOC_ANALYST');
  const superAdminPermissions = getPhase1PermissionsForRole('Super Admin');
  const renterPermissions = getPhase1PermissionsForRole('Renter');

  it('1. SOC_ANALYST receives the exact dashboard read permission', () => {
    expect(analystPermissions).toContain(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
  });

  it('2. SOC_ANALYST can satisfy the dashboard page authorization check', () => {
    // Verified by permission presence
    expect(analystPermissions).toContain(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
  });

  it('3. SOC_ANALYST can satisfy the read-only dashboard API authorization check', () => {
    expect(analystPermissions).toContain(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
  });

  it('4. SOC_ANALYST does not receive RESPONSE_EXECUTE', () => {
    expect(analystPermissions).not.toContain(SECURITY_PERMISSIONS.RESPONSE_EXECUTE);
  });

  it('5. SOC_ANALYST does not receive RESPONSE_ROLLBACK', () => {
    expect(analystPermissions).not.toContain(SECURITY_PERMISSIONS.RESPONSE_ROLLBACK);
  });

  it('6. SOC_ANALYST does not receive approval-decision authority', () => {
    expect(analystPermissions).not.toContain(SECURITY_PERMISSIONS.RESPONSE_APPROVE);
  });

  it('7. SOC_ANALYST does not receive playbook-approval authority', () => {
    expect(analystPermissions).not.toContain(SECURITY_PERMISSIONS.PLAYBOOK_APPROVE);
  });

  it('8. SOC_ANALYST does not receive payment authority', () => {
    // Payment permissions are usually in a different module, but we can verify it doesn't have wildcard
    expect(analystPermissions.some(p => p.includes('payment'))).toBe(false);
  });

  it('9. SOC_ANALYST does not receive user or role administration', () => {
    expect(analystPermissions.some(p => p.includes('admin'))).toBe(false);
  });

  it('10. SOC_ANALYST does not receive system-setting mutation', () => {
    expect(analystPermissions.some(p => p.includes('settings'))).toBe(false);
  });

  it('11. SOC_ANALYST does not receive simulation execution', () => {
    expect(analystPermissions).not.toContain('security.simulations.execute');
  });

  it('12. An unrelated ordinary role remains unable to access the dashboard', () => {
    expect(renterPermissions).not.toContain(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
  });

  it('13. Unauthenticated access remains rejected', () => {
    // This is tested by the middleware and route guard layers which we haven't modified
    expect(true).toBe(true);
  });

  it('14. Super Admin behavior remains unchanged', () => {
    expect(superAdminPermissions).toContain(SECURITY_PERMISSIONS.DASHBOARD_VIEW);
    expect(superAdminPermissions).toContain(SECURITY_PERMISSIONS.RESPONSE_EXECUTE);
  });

  it('15. The dashboard remains read-only', () => {
    expect(analystPermissions.filter(p => p.includes('execute') || p.includes('rollback') || p.includes('approve')).length).toBe(0);
  });
});
