import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MarketplaceAnalyticsAdapterError extends Error {
  constructor(readonly reason: string) {
    super(reason);
    this.name = 'MarketplaceAnalyticsAdapterError';
  }
}

export class MarketplaceAnalyticsAdapter {
  private static readonly PROHIBITED_KEYWORDS = [
    /\bINSERT\b/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bDROP\b/i,
    /\bALTER\b/i,
    /\bTRUNCATE\b/i,
    /\bMERGE\b/i,
    /\bUPSERT\b/i,
    /\bCREATE\b/i,
    /\bGRANT\b/i,
    /\bREVOKE\b/i,
    /\bCOPY\b/i,
    /\bCALL\b/i,
    /\bEXEC\b/i,
    /\bEXECUTE\b/i,
    /\bREPLACE\b/i,
    /;/g, // No multi-statement
    /--/g, // No comments
    /\/\*/g, // No block comments
    /\bpg_catalog\b/i, // No system catalog
    /\binformation_schema\b/i, // No info schema
    /\bpg_authid\b/i,
    /\bpg_shadow\b/i,
  ];

  static validateQuery(sql: string): void {
    const normalized = sql.trim();
    if (!normalized.match(/^SELECT\b/i) && !normalized.match(/^WITH\b.*?\bSELECT\b/i)) {
      throw new MarketplaceAnalyticsAdapterError('SYSTEM_BLOCKED: Only SELECT queries are permitted');
    }

    for (const pattern of this.PROHIBITED_KEYWORDS) {
      if (pattern.test(normalized)) {
        throw new MarketplaceAnalyticsAdapterError(`SYSTEM_BLOCKED: Prohibited keyword detected matching ${pattern}`);
      }
    }
  }

  static async executeQuery(sql: string, params: any[] = []): Promise<any> {
    this.validateQuery(sql);

    // Apply strict row limit wrapper to enforce A-MKT-01 result bounding
    const boundedSql = `SELECT * FROM (${sql.replace(/;$/, '')}) AS bounded_query LIMIT 100`;

    try {
      const result = await prisma.$queryRawUnsafe(boundedSql, ...params);
      return result;
    } catch (e: any) {
      throw new MarketplaceAnalyticsAdapterError(`Query execution failed: ${e.message}`);
    }
  }
}
