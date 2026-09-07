/**
 * RENTipid Production Reference-Data Integrity Gate
 *
 * READ-ONLY validator for mandatory platform datasets:
 * 1. Prohibited & Restricted Items Policies (PI-001 through PI-025, PH-V1.0)
 * 2. Canonical Platform Categories (15 canonical categories)
 * 3. Unified AI Knowledge Center (Active sources and chunks)
 *
 * Strictly non-mutating. Returns detailed pass/fail diagnostics.
 */

import {
  CANONICAL_PROHIBITED_POLICIES,
  CANONICAL_POLICY_VERSION,
} from '../prohibited-items/canonical-policies';
import { CANONICAL_CATEGORIES } from '../categories/canonical-categories';

export interface DatasetCheckResult {
  dataset: 'prohibited_items' | 'categories' | 'ai_knowledge';
  pass: boolean;
  expectedCount: number;
  actualCount: number;
  details: Record<string, any>;
  errors: string[];
}

export interface ReferenceDataIntegrityReport {
  overallPass: boolean;
  databaseName: string;
  host: string;
  checkedAt: string;
  datasets: {
    prohibitedItems: DatasetCheckResult;
    categories: DatasetCheckResult;
    aiKnowledge: DatasetCheckResult;
  };
}

export interface ReferenceDataCheckOptions {
  databaseUrl?: string;
  expectedDatabaseName?: string;
}

/**
 * Executes read-only checks across all mandatory reference datasets.
 */
export async function checkReferenceDataIntegrity(
  options?: ReferenceDataCheckOptions,
): Promise<ReferenceDataIntegrityReport> {
  const databaseUrl = options?.databaseUrl || process.env.TARGET_DB_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or TARGET_DB_URL is required for reference data integrity check.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (e: any) {
    throw new Error(`Invalid database URL format: ${e.message}`);
  }

  const actualDatabaseName = parsedUrl.pathname.replace(/^\//, '').split('?')[0];
  const host = parsedUrl.hostname;
  const isNeon = host.includes('neon.tech');

  if (options?.expectedDatabaseName && actualDatabaseName !== options.expectedDatabaseName) {
    throw new Error(
      `REFERENCE_DATA_CHECK_DATABASE_MISMATCH: Expected '${options.expectedDatabaseName}', but targeting '${actualDatabaseName}'.`
    );
  }

  let prohibitedRows: Array<{ policyCode: string; slug: string; isActive: boolean; policyVersion: string }> = [];
  let categoryRows: Array<{ slug: string; is_active: boolean }> = [];
  let aiSourceCount = 0;
  let aiChunkCount = 0;

  if (isNeon) {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);

    // 1. Query ProhibitedItemPolicy
    const pRows = await sql`
      SELECT "policyCode", slug, "isActive", "policyVersion"
      FROM "ProhibitedItemPolicy"
      ORDER BY "policyCode" ASC
    `;
    prohibitedRows = pRows.map((r: any) => ({
      policyCode: r.policyCode,
      slug: r.slug,
      isActive: Boolean(r.isActive),
      policyVersion: r.policyVersion,
    }));

    // 2. Query Category
    const cRows = await sql`
      SELECT slug, is_active
      FROM "Category"
      ORDER BY slug ASC
    `;
    categoryRows = cRows.map((r: any) => ({
      slug: r.slug,
      is_active: Boolean(r.is_active),
    }));

    // 3. Query AI Knowledge
    try {
      const srcRes = await sql`
        SELECT COUNT(*)::int AS count
        FROM "AiKnowledgeSource"
        WHERE status = 'ACTIVE'
      `;
      aiSourceCount = srcRes[0]?.count ?? 0;

      const chkRes = await sql`
        SELECT COUNT(*)::int AS count
        FROM "AiKnowledgeChunk"
      `;
      aiChunkCount = chkRes[0]?.count ?? 0;
    } catch {
      // Table might not exist in unmigrated environments
      aiSourceCount = 0;
      aiChunkCount = 0;
    }
  } else {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

    try {
      const pRows = await prisma.prohibitedItemPolicy.findMany({
        select: { policyCode: true, slug: true, isActive: true, policyVersion: true },
        orderBy: { policyCode: 'asc' },
      });
      prohibitedRows = pRows;

      const cRows = await prisma.category.findMany({
        select: { slug: true, is_active: true },
        orderBy: { slug: 'asc' },
      });
      categoryRows = cRows;

      try {
        aiSourceCount = await prisma.aiKnowledgeSource.count({
          where: { status: 'ACTIVE' },
        });
        aiChunkCount = await prisma.aiKnowledgeChunk.count();
      } catch {
        aiSourceCount = 0;
        aiChunkCount = 0;
      }
    } finally {
      await prisma.$disconnect();
    }
  }

  // --- Validate ProhibitedItemPolicy ---
  const activeProhibited = prohibitedRows.filter((r) => r.isActive);
  const activeCodes = new Set(activeProhibited.map((r) => r.policyCode));
  const expectedCodes = CANONICAL_PROHIBITED_POLICIES.map((p) => p.policyCode);
  const missingProhibitedCodes = expectedCodes.filter((code) => !activeCodes.has(code));
  const outdatedVersionPolicies = activeProhibited.filter(
    (r) => r.policyVersion !== CANONICAL_POLICY_VERSION,
  );

  const prohibitedErrors: string[] = [];
  if (missingProhibitedCodes.length > 0) {
    prohibitedErrors.push(`Missing canonical policies: ${missingProhibitedCodes.join(', ')}`);
  }
  if (outdatedVersionPolicies.length > 0) {
    prohibitedErrors.push(
      `Policies with non-canonical version: ${outdatedVersionPolicies.map((p) => `${p.policyCode}(${p.policyVersion})`).join(', ')}`,
    );
  }
  if (activeProhibited.length < CANONICAL_PROHIBITED_POLICIES.length) {
    prohibitedErrors.push(
      `Active policy count ${activeProhibited.length} is less than canonical ${CANONICAL_PROHIBITED_POLICIES.length}`,
    );
  }

  const prohibitedPass = prohibitedErrors.length === 0;

  // --- Validate Category ---
  const activeCategories = categoryRows.filter((r) => r.is_active);
  const activeCategorySlugs = new Set(activeCategories.map((r) => r.slug));
  const expectedCategorySlugs = CANONICAL_CATEGORIES.map((c) => c.slug);
  const missingCategorySlugs = expectedCategorySlugs.filter((slug) => !activeCategorySlugs.has(slug));

  const categoryErrors: string[] = [];
  if (missingCategorySlugs.length > 0) {
    categoryErrors.push(`Missing canonical categories: ${missingCategorySlugs.join(', ')}`);
  }
  if (activeCategories.length < CANONICAL_CATEGORIES.length) {
    categoryErrors.push(
      `Active category count ${activeCategories.length} is less than canonical ${CANONICAL_CATEGORIES.length}`,
    );
  }

  const categoryPass = categoryErrors.length === 0;

  // --- Validate AI Knowledge ---
  const aiErrors: string[] = [];
  if (aiSourceCount === 0) {
    aiErrors.push('No active AiKnowledgeSource records found in database');
  }
  if (aiChunkCount === 0) {
    aiErrors.push('No AiKnowledgeChunk records found in database');
  }

  const aiPass = aiErrors.length === 0;

  const overallPass = prohibitedPass && categoryPass && aiPass;

  return {
    overallPass,
    databaseName: actualDatabaseName,
    host,
    checkedAt: new Date().toISOString(),
    datasets: {
      prohibitedItems: {
        dataset: 'prohibited_items',
        pass: prohibitedPass,
        expectedCount: CANONICAL_PROHIBITED_POLICIES.length,
        actualCount: activeProhibited.length,
        details: {
          totalRows: prohibitedRows.length,
          activeCount: activeProhibited.length,
          missingCodes: missingProhibitedCodes,
          canonicalVersion: CANONICAL_POLICY_VERSION,
        },
        errors: prohibitedErrors,
      },
      categories: {
        dataset: 'categories',
        pass: categoryPass,
        expectedCount: CANONICAL_CATEGORIES.length,
        actualCount: activeCategories.length,
        details: {
          totalRows: categoryRows.length,
          activeCount: activeCategories.length,
          missingSlugs: missingCategorySlugs,
        },
        errors: categoryErrors,
      },
      aiKnowledge: {
        dataset: 'ai_knowledge',
        pass: aiPass,
        expectedCount: 1, // At least 1 active source required
        actualCount: aiSourceCount,
        details: {
          activeSources: aiSourceCount,
          totalChunks: aiChunkCount,
        },
        errors: aiErrors,
      },
    },
  };
}
