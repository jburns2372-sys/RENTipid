import { prisma } from '@/lib/prisma';
import { discoverAppInventory } from '../../../../scripts/discover-app-inventory';

export interface CoverageCellResult {
  role: string;
  module: string;
  feature: string;
  answerClass: string;
  authorityType: string;
  status: 'COVERED' | 'NOT_APPLICABLE' | 'MISSING' | 'REQUIRES_POLICY' | 'REQUIRES_LIVE_AUTHORITY';
  intentKeys: string[];
}

export interface CoverageMatrixReport {
  generatedAt: string;
  totalCellsChecked: number;
  coveredCells: number;
  missingCells: number;
  coverageRatePercent: number;
  cells: CoverageCellResult[];
}

export async function generateQuestionCoverageMatrix(): Promise<CoverageMatrixReport> {
  const inventory = discoverAppInventory();
  const allIntents = await prisma.canonicalQuestionIntent.findMany({
    where: { status: 'ACTIVE' },
    include: {
      accessScopes: { where: { status: 'ACTIVE' } }
    }
  });

  const cells: CoverageCellResult[] = [];
  let coveredCount = 0;
  let missingCount = 0;

  for (const moduleName of inventory.modules) {
    const moduleIntents = allIntents.filter(i => i.domain === moduleName || i.domain === 'Core Architecture');

    for (const role of inventory.roles) {
      for (const answerClass of inventory.answerClasses) {
        for (const authorityType of inventory.authorityTypes) {
          const matchingIntents = moduleIntents.filter(intent =>
            intent.accessScopes.some(scope =>
              (scope.role === role || scope.role === 'PUBLIC') &&
              scope.answerClass === answerClass &&
              scope.authorityType === authorityType
            )
          );

          const isCovered = matchingIntents.length > 0;
          if (isCovered) {
            coveredCount++;
          } else {
            missingCount++;
          }

          cells.push({
            role,
            module: moduleName,
            feature: matchingIntents[0]?.feature || 'general',
            answerClass,
            authorityType,
            status: isCovered ? 'COVERED' : 'MISSING',
            intentKeys: matchingIntents.map(i => i.intentKey)
          });
        }
      }
    }
  }

  const totalCells = coveredCount + missingCount;
  const coverageRatePercent = totalCells > 0 ? (coveredCount / totalCells) * 100 : 100;

  return {
    generatedAt: new Date().toISOString(),
    totalCellsChecked: totalCells,
    coveredCells: coveredCount,
    missingCells: missingCount,
    coverageRatePercent,
    cells
  };
}
