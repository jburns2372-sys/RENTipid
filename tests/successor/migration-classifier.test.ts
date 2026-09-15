import { classifyDatabase } from '../../scripts/db/db-install';

describe('Migration Track Classifier Suite (G1 Gate)', () => {
  it('classifies rentipid_local_dev as LEGACY track', async () => {
    const connStr = 'postgresql://rentipid_test_user:o3uHj8ds0ZV9CJpbY74U@127.0.0.1:5432/rentipid_local_dev';
    const result = await classifyDatabase(connStr);
    expect(result.databaseName).toBe('rentipid_local_dev');
    expect(result.classification.track).toBe('LEGACY');
    expect(result.classification.migrationCount).toBeGreaterThanOrEqual(63);
    expect(result.classification.tableCount).toBeGreaterThan(30);
  });

  it('fails closed on non-loopback database target host', async () => {
    // Simulated connection string pointing to remote
    const fakeRemoteConn = 'postgresql://user:pass@192.168.1.100:5432/rentipid_test';
    await expect(classifyDatabase(fakeRemoteConn)).rejects.toThrow();
  });

  it('fails closed on preview database targets', async () => {
    const previewConn = 'postgresql://rentipid_test_user:o3uHj8ds0ZV9CJpbY74U@127.0.0.1:5432/rentipid_preview';
    await expect(classifyDatabase(previewConn)).rejects.toThrow(/\[SECURITY_FAIL_CLOSED\]/);
  });

  it('fails closed on production-named database targets', async () => {
    const prodConn = 'postgresql://rentipid_test_user:o3uHj8ds0ZV9CJpbY74U@127.0.0.1:5432/rentipid_production';
    await expect(classifyDatabase(prodConn)).rejects.toThrow(/\[SECURITY_FAIL_CLOSED\]/);
  });
});
