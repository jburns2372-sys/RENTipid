import { ToolDefinition } from './AiToolGateway';
import { MarketplaceAnalyticsAdapter } from '../analytics/marketplace-analytics-adapter';

export const executeMarketplaceAnalyticsQueryTool: ToolDefinition = {
  name: 'execute_marketplace_analytics_query',
  riskClass: 'READ_ONLY',
  description: 'Execute read-only analytics query on the marketplace database. Must be valid SELECT SQL.',
  allowedRoles: ['Admin', 'Super Admin'],
  handler: async (args: { sql: string }) => {
    try {
      const results = await MarketplaceAnalyticsAdapter.executeQuery(args.sql);
      return { success: true, results, count: results.length, methodology: 'Live database semantic read model query', bounds: 'Max 100 rows' };
    } catch (e: any) {
      if (e.message.includes('SYSTEM_BLOCKED')) {
         throw new Error(`SYSTEM_BLOCKED: ${e.message}`);
      }
      throw new Error(`EXECUTION_FAILED: ${e.message}`);
    }
  }
};
