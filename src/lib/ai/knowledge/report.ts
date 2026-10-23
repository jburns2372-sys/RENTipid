import type { KnowledgeCoverageReport } from './types';

export function renderCoverageReport(report: KnowledgeCoverageReport): string {
  const byModule = new Map<string, { total: number; active: number; missing: number; chunks: number }>();
  for (const item of report.items) {
    const value = byModule.get(item.module) ?? { total: 0, active: 0, missing: 0, chunks: 0 };
    value.total += 1;
    value.active += item.active ? 1 : 0;
    value.missing += item.missing ? 1 : 0;
    value.chunks += item.chunkCount;
    byModule.set(item.module, value);
  }
  const rows = [...byModule.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([module, value]) => `| ${module} | ${value.total} | ${value.active} | ${value.missing} | ${value.chunks} |`)
    .join('\n');
  return `# RENTipid Knowledge Coverage\n\nRegistry: ${report.registryId}\n\nCoverage: ${report.coveragePercent}%\n\n- Candidates: ${report.totalCandidates}\n- Accounted: ${report.accountedCandidates}\n- Approved canonical: ${report.approvedCanonicalSources}\n- Active: ${report.activeSources}\n- Excluded/accounted-only: ${report.excludedSources}\n- Missing: ${report.missing}\n- Invalid: ${report.invalid}\n- Duplicates: ${report.duplicates}\n- Stale: ${report.stale}\n- Chunks: ${report.totalChunks}\n\n| Module | Registered | Active | Missing | Chunks |\n|---|---:|---:|---:|---:|\n${rows}\n`;
}
