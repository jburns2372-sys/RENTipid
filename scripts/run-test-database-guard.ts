import { assertSafeLocalTestDatabaseTarget } from '../src/lib/test-database-guard';

try {
  assertSafeLocalTestDatabaseTarget();
  console.log('Test database guard passed successfully.');
  process.exit(0);
} catch (error: any) {
  console.error(error.message);
  process.exit(1);
}
