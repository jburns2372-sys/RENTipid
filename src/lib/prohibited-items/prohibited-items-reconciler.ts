/**
 * RENTipid Idempotent Prohibited Items Reference-Data Reconciler
 *
 * Implements strict database target safety guards, deterministic diff calculation,
 * effectiveFrom preservation, and zero automatic deletions.
 */

import {
  CANONICAL_PROHIBITED_POLICIES,
  CANONICAL_POLICY_VERSION,
  type CanonicalProhibitedPolicyDefinition,
} from './canonical-policies';

export interface ProhibitedItemsReconcileOptions {
  databaseUrl?: string;
  expectedDatabaseName?: string;
  expectedEndpointId?: string;
  targetEnvironment?: 'production' | 'preview' | 'local';
  allowProhibitedItemsReconciliation?: boolean;
  allowProductionReconciliation?: boolean;
  allowPreviewReconciliation?: boolean;
  dryRun?: boolean;
}

export interface PolicyDiffItem {
  policyCode: string;
  name: string;
  slug: string;
  action: 'CREATE' | 'UPDATE' | 'UNCHANGED' | 'UNEXPECTED';
  reasons?: string[];
  existingId?: string;
}

export interface ProhibitedItemsDiffResult {
  toCreate: PolicyDiffItem[];
  toUpdate: PolicyDiffItem[];
  unchanged: PolicyDiffItem[];
  unexpected: PolicyDiffItem[];
  toDelete: PolicyDiffItem[];
  summary: {
    createCount: number;
    updateCount: number;
    unchangedCount: number;
    unexpectedCount: number;
    deleteCount: number;
    canonicalCount: number;
    databaseTotalBefore: number;
  };
}

export interface ProhibitedItemsReconcileResult {
  beforeCount: number;
  afterCount: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  unexpectedCount: number;
  deletedCount: number;
  canonicalCount: number;
  databaseName: string;
  dryRun: boolean;
  diff: ProhibitedItemsDiffResult;
  policies: Array<{ id: string; policyCode: string; slug: string; name: string; isActive: boolean }>;
}

/**
 * Pure diff calculator comparing DB state against canonical policies.
 */
export function calculateProhibitedItemsDiff(
  currentRows: Array<any>,
  canonicalPolicies: readonly CanonicalProhibitedPolicyDefinition[] = CANONICAL_PROHIBITED_POLICIES,
): ProhibitedItemsDiffResult {
  const currentByCode = new Map<string, any>();
  for (const row of currentRows) {
    currentByCode.set(row.policyCode, row);
  }

  const toCreate: PolicyDiffItem[] = [];
  const toUpdate: PolicyDiffItem[] = [];
  const unchanged: PolicyDiffItem[] = [];
  const unexpected: PolicyDiffItem[] = [];
  const toDelete: PolicyDiffItem[] = []; // Default: NO DELETIONS

  const canonicalCodes = new Set(canonicalPolicies.map((p) => p.policyCode));

  for (const canonical of canonicalPolicies) {
    const existing = currentByCode.get(canonical.policyCode);
    if (!existing) {
      toCreate.push({
        policyCode: canonical.policyCode,
        name: canonical.name,
        slug: canonical.slug,
        action: 'CREATE',
      });
    } else {
      const diffReasons: string[] = [];
      if (existing.name !== canonical.name) diffReasons.push(`name: '${existing.name}' -> '${canonical.name}'`);
      if (existing.slug !== canonical.slug) diffReasons.push(`slug: '${existing.slug}' -> '${canonical.slug}'`);
      if (existing.summary !== canonical.summary) diffReasons.push('summary changed');
      if (existing.fullDescription !== canonical.fullDescription) diffReasons.push('fullDescription changed');
      if (existing.classification !== canonical.classification) diffReasons.push('classification changed');
      if (existing.riskLevel !== canonical.riskLevel) diffReasons.push('riskLevel changed');
      if (existing.enforcementAction !== canonical.enforcementAction) diffReasons.push('enforcementAction changed');
      if (existing.examples !== canonical.examples) diffReasons.push('examples changed');
      if (existing.prohibitedKeywords !== canonical.prohibitedKeywords) diffReasons.push('prohibitedKeywords changed');
      if (existing.reviewKeywords !== canonical.reviewKeywords) diffReasons.push('reviewKeywords changed');
      if (existing.exclusions !== canonical.exclusions) diffReasons.push('exclusions changed');
      if (existing.policyVersion !== CANONICAL_POLICY_VERSION) diffReasons.push(`policyVersion: '${existing.policyVersion}' -> '${CANONICAL_POLICY_VERSION}'`);
      if (existing.isActive !== true) diffReasons.push('isActive is false');

      const expectedBlock = canonical.enforcementAction === 'BLOCK';
      const expectedEscalate = canonical.riskLevel === 'CRITICAL';
      const expectedReview = canonical.enforcementAction === 'HOLD_FOR_REVIEW';

      if (Boolean(existing.automaticBlockEnabled) !== expectedBlock) diffReasons.push('automaticBlockEnabled changed');
      if (Boolean(existing.securityEscalationRequired) !== expectedEscalate) diffReasons.push('securityEscalationRequired changed');
      if (Boolean(existing.manualReviewRequired) !== expectedReview) diffReasons.push('manualReviewRequired changed');

      if (diffReasons.length > 0) {
        toUpdate.push({
          policyCode: canonical.policyCode,
          name: canonical.name,
          slug: canonical.slug,
          action: 'UPDATE',
          reasons: diffReasons,
          existingId: existing.id,
        });
      } else {
        unchanged.push({
          policyCode: canonical.policyCode,
          name: canonical.name,
          slug: canonical.slug,
          action: 'UNCHANGED',
          existingId: existing.id,
        });
      }
    }
  }

  // Detect unexpected rows present in DB that are not in canonical
  for (const row of currentRows) {
    if (!canonicalCodes.has(row.policyCode)) {
      unexpected.push({
        policyCode: row.policyCode,
        name: row.name,
        slug: row.slug,
        action: 'UNEXPECTED',
        existingId: row.id,
      });
    }
  }

  return {
    toCreate,
    toUpdate,
    unchanged,
    unexpected,
    toDelete, // Always empty by default
    summary: {
      createCount: toCreate.length,
      updateCount: toUpdate.length,
      unchangedCount: unchanged.length,
      unexpectedCount: unexpected.length,
      deleteCount: toDelete.length,
      canonicalCount: canonicalPolicies.length,
      databaseTotalBefore: currentRows.length,
    },
  };
}

/**
 * Reconciles the database with the canonical Prohibited Items catalog.
 * Strictly guarded against unintended mutations and database mismatches.
 */
export async function reconcileProhibitedItems(
  options?: ProhibitedItemsReconcileOptions,
): Promise<ProhibitedItemsReconcileResult> {
  const databaseUrl = options?.databaseUrl || process.env.TARGET_DB_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or TARGET_DB_URL is required for prohibited items reconciliation.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (e: any) {
    throw new Error(`Invalid database URL format: ${e.message}`);
  }

  const actualDatabaseName = parsedUrl.pathname.replace(/^\//, '').split('?')[0];
  const hostname = parsedUrl.hostname;
  const isNeon = hostname.includes('neon.tech');
  const isRemote = isNeon || !['localhost', '127.0.0.1', '::1'].includes(hostname);

  // Extract Neon endpoint ID from hostname (e.g. ep-gentle-fog-apwlhnhf or ep-gentle-fog-apwlhnhf-pooler)
  const neonEndpointMatch = hostname.match(/^(ep-[a-z0-9-]+?)(?:-pooler)?\./);
  const actualEndpointId = neonEndpointMatch ? neonEndpointMatch[1] : null;

  const expectedDatabaseName =
    options?.expectedDatabaseName || process.env.EXPECTED_DATABASE_NAME;
  const expectedEndpointId =
    options?.expectedEndpointId || process.env.EXPECTED_NEON_ENDPOINT_ID;
  const targetEnvironment =
    options?.targetEnvironment ||
    (process.env.REFERENCE_DATA_TARGET_ENVIRONMENT as 'production' | 'preview' | 'local' | undefined);

  // Authorizations: production vs preview
  const allowProd =
    options?.allowProductionReconciliation ??
    (process.env.ALLOW_PRODUCTION_PROHIBITED_ITEMS_RECONCILIATION === 'true' ||
      process.argv.includes('--authorize-production-reference-reconciliation'));

  const allowPreview =
    options?.allowPreviewReconciliation ??
    (process.env.ALLOW_PREVIEW_PROHIBITED_ITEMS_RECONCILIATION === 'true' ||
      process.argv.includes('--authorize-preview-reference-reconciliation'));

  // Legacy fallback flag strictly for local/non-remote use
  const genericAuth =
    options?.allowProhibitedItemsReconciliation ??
    (process.env.ALLOW_PROHIBITED_ITEMS_RECONCILIATION === 'true');

  const isDryRun = options?.dryRun ?? (process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run'));

  // Authorization resolution: Remote mutation strictly requires environment-specific authorization
  const isAuthorized = isRemote
    ? targetEnvironment === 'production'
      ? allowProd
      : targetEnvironment === 'preview'
        ? allowPreview
        : false
    : targetEnvironment === 'production'
      ? allowProd
      : targetEnvironment === 'preview'
        ? allowPreview
        : (allowProd || allowPreview || genericAuth);

  // Guard 1: Database mismatch and required database name guard
  if (expectedDatabaseName && actualDatabaseName !== expectedDatabaseName) {
    throw new Error(
      `PROHIBITED_ITEMS_RECONCILIATION_DATABASE_MISMATCH: Expected database '${expectedDatabaseName}', but received '${actualDatabaseName}'.`
    );
  }

  if (isRemote && !expectedDatabaseName) {
    throw new Error(
      'PROHIBITED_ITEMS_RECONCILIATION_EXPECTED_DATABASE_REQUIRED: EXPECTED_DATABASE_NAME must be specified for remote reconciliation.'
    );
  }

  // Guard 2: Target environment guard for remote databases
  if (isRemote && (!targetEnvironment || !['production', 'preview'].includes(targetEnvironment))) {
    throw new Error(
      'PROHIBITED_ITEMS_RECONCILIATION_TARGET_ENV_REQUIRED: REFERENCE_DATA_TARGET_ENVIRONMENT must be explicitly specified as "production" or "preview" for remote reconciliation.'
    );
  }

  // Guard 3: Cross-environment authorization guard: Disallow production auth on preview or preview auth on production
  if (isRemote && !isDryRun) {
    if (targetEnvironment === 'production' && allowPreview && !allowProd) {
      throw new Error(
        'PROHIBITED_ITEMS_RECONCILIATION_AUTH_MISMATCH: Preview authorization cannot be used for Production reconciliation.'
      );
    }
    if (targetEnvironment === 'preview' && allowProd && !allowPreview) {
      throw new Error(
        'PROHIBITED_ITEMS_RECONCILIATION_AUTH_MISMATCH: Production authorization cannot be used for Preview reconciliation.'
      );
    }
  }

  // Guard 4: Authorization guard for remote/production databases
  if (isRemote && !isAuthorized && !isDryRun) {
    throw new Error(
      `PROHIBITED_ITEMS_RECONCILIATION_NOT_AUTHORIZED: Explicit operator authorization required for ${
        targetEnvironment ? targetEnvironment.toUpperCase() : 'remote'
      } reconciliation.`
    );
  }

  // Guard 5: Expected Neon endpoint ID guard for remote databases
  if (isRemote && !expectedEndpointId) {
    throw new Error(
      'PROHIBITED_ITEMS_RECONCILIATION_EXPECTED_ENDPOINT_REQUIRED: EXPECTED_NEON_ENDPOINT_ID must be specified for remote reconciliation.'
    );
  }

  // Guard 6: Strict remote environment-to-identity binding
  if (isRemote && targetEnvironment === 'production') {
    if (expectedDatabaseName !== 'rentipid_production') {
      throw new Error(
        `PROHIBITED_ITEMS_RECONCILIATION_DATABASE_MISMATCH: Expected database 'rentipid_production' for Production reconciliation, but received '${expectedDatabaseName}'.`
      );
    }
    if (expectedEndpointId !== 'ep-gentle-fog-apwlhnhf') {
      throw new Error(
        `PROHIBITED_ITEMS_RECONCILIATION_ENDPOINT_MISMATCH: Expected Neon endpoint 'ep-gentle-fog-apwlhnhf' for Production reconciliation, but received '${expectedEndpointId}'.`
      );
    }
  }

  if (isRemote && targetEnvironment === 'preview') {
    if (expectedDatabaseName !== 'rentipid_production') {
      throw new Error(
        `PROHIBITED_ITEMS_RECONCILIATION_DATABASE_MISMATCH: Expected database 'rentipid_production' for Preview reconciliation, but received '${expectedDatabaseName}'.`
      );
    }
    if (expectedEndpointId !== 'ep-soft-pine-ap1b22e5') {
      throw new Error(
        `PROHIBITED_ITEMS_RECONCILIATION_ENDPOINT_MISMATCH: Expected Neon endpoint 'ep-soft-pine-ap1b22e5' for Preview reconciliation, but received '${expectedEndpointId}'.`
      );
    }
  }

  // Guard 7: Connected Neon endpoint ID mismatch guard
  if (expectedEndpointId) {
    if (!actualEndpointId) {
      throw new Error(
        `PROHIBITED_ITEMS_RECONCILIATION_ENDPOINT_MISMATCH: Expected Neon endpoint '${expectedEndpointId}', but hostname '${hostname}' is not a valid Neon endpoint.`
      );
    }
    if (actualEndpointId !== expectedEndpointId) {
      throw new Error(
        `PROHIBITED_ITEMS_RECONCILIATION_ENDPOINT_MISMATCH: Expected Neon endpoint '${expectedEndpointId}', but connected to '${actualEndpointId}'.`
      );
    }
  }

  if (isNeon) {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);

    // 1. Audit current policies
    const existingRows = await sql`
      SELECT id, "policyCode", slug, name, summary, "fullDescription",
             classification, "riskLevel", "enforcementAction", examples,
             "prohibitedKeywords", "reviewKeywords", exclusions, "policyVersion",
             "isActive", "effectiveFrom", "displayOrder",
             "automaticBlockEnabled", "securityEscalationRequired", "manualReviewRequired"
      FROM "ProhibitedItemPolicy"
      ORDER BY "policyCode" ASC
    `;

    const diff = calculateProhibitedItemsDiff(existingRows, CANONICAL_PROHIBITED_POLICIES);

    if (isDryRun) {
      return {
        beforeCount: existingRows.length,
        afterCount: existingRows.length,
        createdCount: diff.summary.createCount,
        updatedCount: diff.summary.updateCount,
        unchangedCount: diff.summary.unchangedCount,
        unexpectedCount: diff.summary.unexpectedCount,
        deletedCount: 0,
        canonicalCount: CANONICAL_PROHIBITED_POLICIES.length,
        databaseName: actualDatabaseName,
        dryRun: true,
        diff,
        policies: existingRows.map((r: any) => ({
          id: r.id,
          policyCode: r.policyCode,
          slug: r.slug,
          name: r.name,
          isActive: r.isActive,
        })),
      };
    }

    let createdCount = 0;
    let updatedCount = 0;

    // 2. Perform creations
    for (const item of diff.toCreate) {
      const canonical = CANONICAL_PROHIBITED_POLICIES.find((p) => p.policyCode === item.policyCode)!;
      const id = `pol_${canonical.policyCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
      const autoBlock = canonical.enforcementAction === 'BLOCK';
      const securityEscalate = canonical.riskLevel === 'CRITICAL';
      const manualReview = canonical.enforcementAction === 'HOLD_FOR_REVIEW';
      const now = new Date();

      await sql`
        INSERT INTO "ProhibitedItemPolicy" (
          id, "policyCode", name, slug, summary, "fullDescription",
          classification, "riskLevel", "enforcementAction", examples,
          "prohibitedKeywords", "reviewKeywords", exclusions,
          "automaticBlockEnabled", "securityEscalationRequired", "manualReviewRequired",
          "accountEnforcementEligible", "isActive", "effectiveFrom", "policyVersion",
          "displayOrder", created_at, updated_at
        ) VALUES (
          ${id}, ${canonical.policyCode}, ${canonical.name}, ${canonical.slug}, ${canonical.summary}, ${canonical.fullDescription},
          ${canonical.classification}, ${canonical.riskLevel}, ${canonical.enforcementAction}, ${canonical.examples},
          ${canonical.prohibitedKeywords}, ${canonical.reviewKeywords}, ${canonical.exclusions},
          ${autoBlock}, ${securityEscalate}, ${manualReview},
          false, true, ${now}, ${CANONICAL_POLICY_VERSION},
          ${canonical.displayOrder ?? 0}, ${now}, ${now}
        )
      `;
      createdCount++;
    }

    // 3. Perform controlled updates (Preserving existing effectiveFrom and id)
    for (const item of diff.toUpdate) {
      const canonical = CANONICAL_PROHIBITED_POLICIES.find((p) => p.policyCode === item.policyCode)!;
      const autoBlock = canonical.enforcementAction === 'BLOCK';
      const securityEscalate = canonical.riskLevel === 'CRITICAL';
      const manualReview = canonical.enforcementAction === 'HOLD_FOR_REVIEW';
      const now = new Date();

      await sql`
        UPDATE "ProhibitedItemPolicy"
        SET name = ${canonical.name},
            slug = ${canonical.slug},
            summary = ${canonical.summary},
            "fullDescription" = ${canonical.fullDescription},
            classification = ${canonical.classification},
            "riskLevel" = ${canonical.riskLevel},
            "enforcementAction" = ${canonical.enforcementAction},
            examples = ${canonical.examples},
            "prohibitedKeywords" = ${canonical.prohibitedKeywords},
            "reviewKeywords" = ${canonical.reviewKeywords},
            exclusions = ${canonical.exclusions},
            "automaticBlockEnabled" = ${autoBlock},
            "securityEscalationRequired" = ${securityEscalate},
            "manualReviewRequired" = ${manualReview},
            "isActive" = true,
            "policyVersion" = ${CANONICAL_POLICY_VERSION},
            "displayOrder" = ${canonical.displayOrder ?? 0},
            updated_at = ${now}
        WHERE "policyCode" = ${canonical.policyCode}
      `;
      updatedCount++;
    }

    // 4. Audit final state
    const afterRows = await sql`
      SELECT id, "policyCode", slug, name, "isActive"
      FROM "ProhibitedItemPolicy"
      ORDER BY "policyCode" ASC
    `;

    return {
      beforeCount: existingRows.length,
      afterCount: afterRows.length,
      createdCount,
      updatedCount,
      unchangedCount: diff.summary.unchangedCount,
      unexpectedCount: diff.summary.unexpectedCount,
      deletedCount: 0,
      canonicalCount: CANONICAL_PROHIBITED_POLICIES.length,
      databaseName: actualDatabaseName,
      dryRun: false,
      diff,
      policies: afterRows.map((r: any) => ({
        id: r.id,
        policyCode: r.policyCode,
        slug: r.slug,
        name: r.name,
        isActive: r.isActive,
      })),
    };
  } else {
    // Local / Prisma client execution path
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

    try {
      const existingRows = await prisma.prohibitedItemPolicy.findMany({
        orderBy: { policyCode: 'asc' },
      });

      const diff = calculateProhibitedItemsDiff(existingRows, CANONICAL_PROHIBITED_POLICIES);

      if (isDryRun) {
        return {
          beforeCount: existingRows.length,
          afterCount: existingRows.length,
          createdCount: diff.summary.createCount,
          updatedCount: diff.summary.updateCount,
          unchangedCount: diff.summary.unchangedCount,
          unexpectedCount: diff.summary.unexpectedCount,
          deletedCount: 0,
          canonicalCount: CANONICAL_PROHIBITED_POLICIES.length,
          databaseName: actualDatabaseName,
          dryRun: true,
          diff,
          policies: existingRows.map((r) => ({
            id: r.id,
            policyCode: r.policyCode,
            slug: r.slug,
            name: r.name,
            isActive: r.isActive,
          })),
        };
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const item of diff.toCreate) {
        const canonical = CANONICAL_PROHIBITED_POLICIES.find((p) => p.policyCode === item.policyCode)!;
        await prisma.prohibitedItemPolicy.create({
          data: {
            policyCode: canonical.policyCode,
            name: canonical.name,
            slug: canonical.slug,
            summary: canonical.summary,
            fullDescription: canonical.fullDescription,
            classification: canonical.classification,
            riskLevel: canonical.riskLevel,
            enforcementAction: canonical.enforcementAction,
            examples: canonical.examples,
            prohibitedKeywords: canonical.prohibitedKeywords,
            reviewKeywords: canonical.reviewKeywords,
            exclusions: canonical.exclusions,
            displayOrder: canonical.displayOrder ?? 0,
            effectiveFrom: new Date(),
            policyVersion: CANONICAL_POLICY_VERSION,
            automaticBlockEnabled: canonical.enforcementAction === 'BLOCK',
            securityEscalationRequired: canonical.riskLevel === 'CRITICAL',
            manualReviewRequired: canonical.enforcementAction === 'HOLD_FOR_REVIEW',
            isActive: true,
          },
        });
        createdCount++;
      }

      for (const item of diff.toUpdate) {
        const canonical = CANONICAL_PROHIBITED_POLICIES.find((p) => p.policyCode === item.policyCode)!;
        await prisma.prohibitedItemPolicy.update({
          where: { policyCode: canonical.policyCode },
          data: {
            name: canonical.name,
            slug: canonical.slug,
            summary: canonical.summary,
            fullDescription: canonical.fullDescription,
            classification: canonical.classification,
            riskLevel: canonical.riskLevel,
            enforcementAction: canonical.enforcementAction,
            examples: canonical.examples,
            prohibitedKeywords: canonical.prohibitedKeywords,
            reviewKeywords: canonical.reviewKeywords,
            exclusions: canonical.exclusions,
            displayOrder: canonical.displayOrder ?? 0,
            policyVersion: CANONICAL_POLICY_VERSION,
            automaticBlockEnabled: canonical.enforcementAction === 'BLOCK',
            securityEscalationRequired: canonical.riskLevel === 'CRITICAL',
            manualReviewRequired: canonical.enforcementAction === 'HOLD_FOR_REVIEW',
            isActive: true,
            // Notice: effectiveFrom is NOT touched here; preserved
          },
        });
        updatedCount++;
      }

      const afterRows = await prisma.prohibitedItemPolicy.findMany({
        select: { id: true, policyCode: true, slug: true, name: true, isActive: true },
        orderBy: { policyCode: 'asc' },
      });

      return {
        beforeCount: existingRows.length,
        afterCount: afterRows.length,
        createdCount,
        updatedCount,
        unchangedCount: diff.summary.unchangedCount,
        unexpectedCount: diff.summary.unexpectedCount,
        deletedCount: 0,
        canonicalCount: CANONICAL_PROHIBITED_POLICIES.length,
        databaseName: actualDatabaseName,
        dryRun: false,
        diff,
        policies: afterRows,
      };
    } finally {
      await prisma.$disconnect();
    }
  }
}
