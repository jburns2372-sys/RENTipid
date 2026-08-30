import fs from 'node:fs';
import path from 'node:path';

describe('home page category query', () => {
  test('uses Prisma to-one relation filter syntax for optional requirements', () => {
    const home = fs.readFileSync(path.resolve(__dirname, '../../src/app/page.tsx'), 'utf8');

    expect(home).toContain(
      'requirements: { is: { notes: { startsWith: MARKETPLACE_CATEGORY_METADATA_PREFIX } } }',
    );
    expect(home).not.toContain(
      'requirements: { notes: { startsWith: MARKETPLACE_CATEGORY_METADATA_PREFIX } }',
    );
  });
});
