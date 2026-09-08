jest.mock('@/lib/prisma', () => ({
  prisma: {
    canonicalQuestionIntent: { findMany: jest.fn() },
  },
}));

jest.mock('../../scripts/discover-app-inventory', () => ({
  discoverAppInventory: () => ({
    modules: ['Listings'],
    roles: ['Guest', 'Renter'],
    answerClasses: ['INFORMATION', 'ELIGIBILITY_POLICY', 'PERSONALIZED_READ', 'ACTION', 'UNSUPPORTED_EXTERNAL'],
    authorityTypes: ['KNOWLEDGE_CENTER', 'POLICY_TAXONOMY', 'LIVE_SERVICE', 'TOOL_GATEWAY'],
  }),
}));

import { prisma } from '@/lib/prisma';
import { generateQuestionCoverageMatrix } from '@/lib/ai/knowledge/question-coverage-matrix';

test('marks only declared role/authority combinations applicable', async () => {
  (prisma.canonicalQuestionIntent.findMany as jest.Mock).mockResolvedValue([
    {
      intentKey: 'listing.info',
      domain: 'Listings',
      feature: 'listing_creation',
      accessScopes: [{ role: 'Guest', answerClass: 'INFORMATION', authorityType: 'KNOWLEDGE_CENTER' }],
    },
  ]);

  const report = await generateQuestionCoverageMatrix();

  expect(report.totalCellsChecked).toBe(40);
  expect(report.applicableCells).toBe(1);
  expect(report.notApplicableCells).toBe(39);
  expect(report.coveredCells).toBe(1);
  expect(report.missingCells).toBe(0);
  expect(report.coverageRatePercent).toBe(100);
});
