jest.mock('@/lib/prisma', () => ({
  prisma: {
    canonicalQuestionIntent: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getCanonicalQuestionSuggestions } from '@/lib/ai/context/canonical-intent-registry';

describe('canonical Help Center question discovery', () => {
  test('filters canonical questions by the caller role and public audience', async () => {
    (prisma.canonicalQuestionIntent.findMany as jest.Mock).mockResolvedValue([
      {
        intentKey: 'public.question',
        canonicalQuestion: 'What rentals are supported?',
        accessScopes: [{ role: 'Guest', audience: 'PUBLIC' }],
      },
      {
        intentKey: 'provider.question',
        canonicalQuestion: 'How do I create a listing?',
        accessScopes: [{ role: 'Individual Provider', audience: 'PROVIDER' }],
      },
      {
        intentKey: 'internal.question',
        canonicalQuestion: 'How do I validate the Knowledge Center?',
        accessScopes: [{ role: 'Admin', audience: 'INTERNAL' }],
      },
    ]);

    await expect(getCanonicalQuestionSuggestions('Guest')).resolves.toEqual([
      expect.objectContaining({ id: 'canonical:public.question' }),
    ]);
    await expect(getCanonicalQuestionSuggestions('Individual Provider')).resolves.toEqual([
      expect.objectContaining({ id: 'canonical:provider.question' }),
    ]);
  });
});
