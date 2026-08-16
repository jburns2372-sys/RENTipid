import { PrismaClient } from '@prisma/client';
import { bootstrapKnowledge } from '../../src/lib/ai/knowledge/bootstrap';
import { buildKnowledgeCoverageReport } from '../../src/lib/ai/knowledge/coverage';
import { assertKnowledgeMutationEnvironment } from '../../src/lib/ai/knowledge/environment-guard';
import { renderCoverageReport } from '../../src/lib/ai/knowledge/report';
import {
  calculateKnowledgeRegistryFreezeHash,
  getKnowledgeRegistry,
  getSynchronizableKnowledgeRegistry,
  KNOWLEDGE_REGISTRY_ID,
  validateKnowledgeRegistry,
} from '../../src/lib/ai/knowledge/source-registry';
import { diffKnowledge, prepareCanonicalKnowledge, synchronizeKnowledge } from '../../src/lib/ai/knowledge/synchronizer';

const prisma = new PrismaClient();

function repeatArgument(args: string[]): number {
  const index = args.indexOf('--repeat');
  if (index < 0) return 1;
  return Number(args[index + 1]);
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'freeze-hash') {
    console.log(JSON.stringify({
      registryId: KNOWLEDGE_REGISTRY_ID,
      registrySha256: calculateKnowledgeRegistryFreezeHash(),
      canonicalization: 'UTF-8 text; CRLF and CR normalized to LF; trailing-newline presence and all other characters preserved',
    }, null, 2));
    return;
  }
  const registry = getKnowledgeRegistry();
  switch (command) {
    case 'inventory': {
      const dispositions = Object.fromEntries(
        [...new Set(registry.map(entry => entry.disposition))]
          .sort()
          .map(disposition => [disposition, registry.filter(entry => entry.disposition === disposition).length]),
      );
      console.log(JSON.stringify({
        registryId: 'KB1-INITIAL-146',
        candidates: registry.length,
        synchronizable: getSynchronizableKnowledgeRegistry().length,
        unclassified: 0,
        unaccounted: 0,
        dispositions,
      }, null, 2));
      return;
    }
    case 'validate': {
      const registryIssues = validateKnowledgeRegistry(registry);
      const prepared = await prepareCanonicalKnowledge(prisma);
      const contentIssues = prepared.flatMap(item => item.issues);
      console.log(JSON.stringify({
        registryCandidates: registry.length,
        preparedSources: prepared.length,
        registryIssues,
        contentIssues,
        valid: registryIssues.length === 0 && contentIssues.length === 0,
      }, null, 2));
      if (registryIssues.length || contentIssues.length) process.exitCode = 1;
      return;
    }
    case 'diff': {
      const result = await diffKnowledge(prisma);
      console.log(JSON.stringify(result.items, null, 2));
      if (result.items.some(item => item.action === 'INVALID' || item.action === 'MISSING')) process.exitCode = 1;
      return;
    }
    case 'check': {
      const report = await buildKnowledgeCoverageReport(prisma);
      console.log(JSON.stringify({
        coveragePercent: report.coveragePercent,
        missing: report.missing,
        invalid: report.invalid,
        duplicates: report.duplicates,
        stale: report.stale,
        activeSources: report.activeSources,
        totalChunks: report.totalChunks,
      }, null, 2));
      if (report.coveragePercent !== 100 || report.missing || report.invalid || report.duplicates || report.stale) process.exitCode = 1;
      return;
    }
    case 'report': {
      const report = await buildKnowledgeCoverageReport(prisma);
      console.log(args.includes('--json') ? JSON.stringify(report, null, 2) : renderCoverageReport(report));
      return;
    }
    case 'bootstrap': {
      assertKnowledgeMutationEnvironment();
      const summaries = await bootstrapKnowledge(prisma, { repeat: repeatArgument(args) });
      console.log(JSON.stringify(summaries.map((summary, index) => ({
        iteration: index + 1,
        created: summary.created,
        newVersions: summary.newVersions,
        noOp: summary.noOp,
        failed: summary.failed,
        chunksCreated: summary.chunksCreated,
      })), null, 2));
      return;
    }
    case 'sync': {
      assertKnowledgeMutationEnvironment();
      const summary = await synchronizeKnowledge(prisma);
      console.log(JSON.stringify({
        created: summary.created,
        newVersions: summary.newVersions,
        noOp: summary.noOp,
        failed: summary.failed,
        chunksCreated: summary.chunksCreated,
      }, null, 2));
      return;
    }
    default:
      throw new Error('Usage: knowledge-runner.ts <freeze-hash|inventory|validate|diff|check|report|bootstrap|sync> [--repeat 1..10] [--json]');
  }
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : 'KNOWLEDGE_COMMAND_FAILED');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
