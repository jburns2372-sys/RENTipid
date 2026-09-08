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
  applicableCells: number;
  notApplicableCells: number;
  partialCells: number;
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
  let applicableCount = 0;
  let notApplicableCount = 0;
  let partialCount = 0;

  const roleMatches = (scopeRole: string, role: string): boolean => {
    const scope = scopeRole.toUpperCase();
    const requested = role.toUpperCase();
    if (scope === 'PUBLIC') return requested === 'GUEST';
    if (scope === requested) return true;
    if (requested === 'PROVIDER') return scope === 'INDIVIDUAL PROVIDER' || scope === 'BUSINESS PROVIDER';
    if (requested === 'ADMIN') return scope === 'ADMIN' || scope === 'COMPLIANCE ADMIN';
    return false;
  };

  for (const moduleName of inventory.modules) {
    const moduleIntents = allIntents.filter(i => i.domain === moduleName);

    for (const role of inventory.roles) {
      for (const answerClass of inventory.answerClasses) {
        for (const authorityType of inventory.authorityTypes) {
          const matchingIntents = moduleIntents.filter(intent =>
            intent.accessScopes.some(scope =>
              roleMatches(scope.role, role) &&
              scope.answerClass === answerClass &&
              scope.authorityType === authorityType
            )
          );

          // A cell is applicable only when repository-backed behavior declares
          // that role, answer class, and authority combination. This avoids
          // treating impossible Cartesian combinations as coverage gaps.
          const isApplicable = moduleIntents.some(intent =>
            intent.accessScopes.some(scope =>
              roleMatches(scope.role, role)
              && scope.answerClass === answerClass
              && scope.authorityType === authorityType
            )
          );
          const isCovered = matchingIntents.length > 0;
          if (!isApplicable) {
            notApplicableCount++;
          } else if (isCovered) {
            applicableCount++;
            coveredCount++;
          } else {
            applicableCount++;
            missingCount++;
          }

          cells.push({
            role,
            module: moduleName,
            feature: matchingIntents[0]?.feature || 'general',
            answerClass,
            authorityType,
            status: !isApplicable ? 'NOT_APPLICABLE' : isCovered ? 'COVERED' : 'MISSING',
            intentKeys: matchingIntents.map(i => i.intentKey)
          });
        }
      }
    }
  }

  const totalCells = cells.length;
  const coverageRatePercent = applicableCount > 0 ? (coveredCount / applicableCount) * 100 : 100;

  return {
    generatedAt: new Date().toISOString(),
    totalCellsChecked: totalCells,
    coveredCells: coveredCount,
    missingCells: missingCount,
    applicableCells: applicableCount,
    notApplicableCells: notApplicableCount,
    partialCells: partialCount,
    coverageRatePercent,
    cells
  };
}
