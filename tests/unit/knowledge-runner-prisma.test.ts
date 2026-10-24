import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Knowledge Runner Initialization', () => {
  it('must use the canonical Prisma client instead of raw initialization', () => {
    const runnerPath = resolve(__dirname, '../../scripts/knowledge/knowledge-runner.ts');
    const content = readFileSync(runnerPath, 'utf8');

    // Ensure it imports the singleton
    expect(content).toMatch(/import \{ prisma \} from '\.\.\/\.\.\/src\/lib\/prisma';/);

    // Ensure it does not construct its own
    expect(content).not.toMatch(/new PrismaClient\(/);
  });
});
