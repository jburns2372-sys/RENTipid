import { CANONICAL_CATEGORIES } from '../src/lib/categories/canonical-categories';

interface ReconcileOptions {
  databaseUrl?: string;
  allowProduction?: boolean;
}

export interface ReconcileResult {
  beforeCount: number;
  afterCount: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  canonicalCount: number;
  categories: Array<{ id: string; slug: string; name: string }>;
}

export async function reconcileCategories(options?: ReconcileOptions): Promise<ReconcileResult> {
  const databaseUrl = options?.databaseUrl || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for category reconciliation.');
  }

  // Safety checks
  const isNeon = databaseUrl.includes('neon.tech');

  if (isNeon) {
    // Use @neondatabase/serverless for rock-solid HTTP connection to Neon
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(databaseUrl);

    // 1. Audit before counts
    const countBeforeRes = await sql`SELECT COUNT(*)::int as count FROM "Category"`;
    const beforeCount = countBeforeRes[0].count;

    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    // 2. Idempotent upsert by slug
    for (const cat of CANONICAL_CATEGORIES) {
      const existing = await sql`SELECT id, name, risk_level, requires_deposit, requires_insurance, requires_permit, requires_admin_approval FROM "Category" WHERE slug = ${cat.slug}`;

      if (existing.length === 0) {
        // Generate CUID-like ID or let default cuid generate if db handles it
        // In Prisma schema: id String @id @default(cuid())
        // Since SQL INSERT without id needs cuid if no DB default, check if table has default
        // In PostgreSQL migration: id TEXT NOT NULL, CONSTRAINT Category_pkey PRIMARY KEY (id)
        // Prisma schema handles cuid() at client level or gen_random_uuid() / cuid
        const generatedId = `cat_${cat.slug.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
        await sql`
          INSERT INTO "Category" (
            id, name, slug, description, risk_level,
            requires_admin_approval, requires_deposit, requires_insurance, requires_permit, is_active
          ) VALUES (
            ${generatedId}, ${cat.name}, ${cat.slug}, ${cat.description || null}, ${cat.risk_level},
            ${cat.requires_admin_approval || false}, ${cat.requires_deposit || false},
            ${cat.requires_insurance || false}, ${cat.requires_permit || false}, true
          )
        `;
        createdCount++;
      } else {
        // Row exists - preserve existing ID, update metadata idempotently
        await sql`
          UPDATE "Category"
          SET name = ${cat.name},
              description = COALESCE(description, ${cat.description || null}),
              risk_level = ${cat.risk_level},
              requires_admin_approval = ${cat.requires_admin_approval || false},
              requires_deposit = ${cat.requires_deposit || false},
              requires_insurance = ${cat.requires_insurance || false},
              requires_permit = ${cat.requires_permit || false},
              is_active = true
          WHERE slug = ${cat.slug}
        `;
        updatedCount++;
      }
    }

    // 3. Audit after counts
    const countAfterRes = await sql`SELECT COUNT(*)::int as count FROM "Category"`;
    const afterCount = countAfterRes[0].count;

    const allCategories = await sql`SELECT id, slug, name FROM "Category" ORDER BY slug ASC`;

    return {
      beforeCount,
      afterCount,
      createdCount,
      updatedCount,
      unchangedCount,
      canonicalCount: CANONICAL_CATEGORIES.length,
      categories: allCategories.map((r: any) => ({ id: r.id, slug: r.slug, name: r.name })),
    };
  } else {
    // Use PrismaClient for standard local postgres
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

    try {
      const beforeCount = await prisma.category.count();
      let createdCount = 0;
      let updatedCount = 0;

      for (const cat of CANONICAL_CATEGORIES) {
        const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
        if (!existing) {
          await prisma.category.create({
            data: {
              name: cat.name,
              slug: cat.slug,
              description: cat.description || null,
              risk_level: cat.risk_level,
              requires_admin_approval: cat.requires_admin_approval || false,
              requires_deposit: cat.requires_deposit || false,
              requires_insurance: cat.requires_insurance || false,
              requires_permit: cat.requires_permit || false,
              is_active: true,
            },
          });
          createdCount++;
        } else {
          await prisma.category.update({
            where: { slug: cat.slug },
            data: {
              name: cat.name,
              description: existing.description || cat.description || null,
              risk_level: cat.risk_level,
              requires_admin_approval: cat.requires_admin_approval || false,
              requires_deposit: cat.requires_deposit || false,
              requires_insurance: cat.requires_insurance || false,
              requires_permit: cat.requires_permit || false,
              is_active: true,
            },
          });
          updatedCount++;
        }
      }

      const afterCount = await prisma.category.count();
      const allCategories = await prisma.category.findMany({
        select: { id: true, slug: true, name: true },
        orderBy: { slug: 'asc' },
      });

      return {
        beforeCount,
        afterCount,
        createdCount,
        updatedCount,
        unchangedCount: 0,
        canonicalCount: CANONICAL_CATEGORIES.length,
        categories: allCategories,
      };
    } finally {
      await prisma.$disconnect();
    }
  }
}

async function cli() {
  const targetUrl = process.env.TARGET_DB_URL || process.env.DATABASE_URL;
  console.log('=== TARGETED CATEGORY REFERENCE-DATA RECONCILER ===\n');
  const result = await reconcileCategories({ databaseUrl: targetUrl });
  console.log('CATEGORY_COUNT_BEFORE:', result.beforeCount);
  console.log('CREATED_COUNT:', result.createdCount);
  console.log('UPDATED_COUNT:', result.updatedCount);
  console.log('CATEGORY_COUNT_AFTER:', result.afterCount);
  console.log('CANONICAL_TOTAL:', result.canonicalCount);
  console.log('RECONCILED_SLUGS:', result.categories.map((c) => c.slug).join(', '));
}

if (require.main === module) {
  cli().catch((err) => {
    console.error('Reconciliation failed:', err);
    process.exit(1);
  });
}
