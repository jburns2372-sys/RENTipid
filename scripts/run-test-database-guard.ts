import { assertSafeLocalTestDatabaseTarget } from '../src/lib/test-database-guard';
import { assertKnowledgeMutationEnvironment } from '../src/lib/ai/knowledge/environment-guard';

try {
  let isAuthorizedPreview = false;

  if (process.env.VERCEL_ENV === 'preview' && process.env.ALLOW_PREVIEW_KNOWLEDGE_MUTATION === 'true') {
    try {
      const identity = assertKnowledgeMutationEnvironment({
        ...process.env,
        ALLOW_KNOWLEDGE_MUTATION: 'true',
      });
      if (identity.kind === 'PREVIEW') {
        isAuthorizedPreview = true;
      }
    } catch {
      // Fallback
    }
  }

  if (isAuthorizedPreview) {
    console.log('Authorized PREVIEW knowledge mutation environment detected. Bypassing local host checks.');
  } else {
    assertSafeLocalTestDatabaseTarget();
    console.log('Test database guard passed successfully.');
  }

  process.exit(0);
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}
