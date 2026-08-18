export const LEGACY_MIGRATION_LOCK_ID = 1000;
export const PROTECTED_DBS = ['rentipid_test_soc', 'postgres', 'template0', 'template1'];

export function assertDatabaseIsSafe(name: string) {
  if (PROTECTED_DBS.includes(name)) {
    throw new Error(`Database safety guard: Database '${name}' is blocked from migrations.`);
  }
}
