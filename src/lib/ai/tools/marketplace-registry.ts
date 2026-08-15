import { ToolDefinition } from './AiToolGateway';
import { MarketplaceAnalyticsAdapter } from '../analytics/marketplace-analytics-adapter';
import { AiSpecialistRegistryError } from '../specialists/registry';

export const executeMarketplaceAnalyticsQueryTool: ToolDefinition = {
  name: 'execute_marketplace_analytics_query',
  riskClass: 'READ_ONLY',
  description: 'Execute read-only analytics query on the marketplace database. Must be valid SELECT SQL.',
  allowedRoles: ['Admin', 'Super Admin'],
  handler: async (args: { sql: string }, context) => {
    // Role validation is handled by gateway, but we explicitly enforce boundaries here just in case
    if (!['Admin', 'Super Admin'].includes(context.userRole)) {
      throw new AiSpecialistRegistryError('ROLE_DENIED', 'Unauthorized for analytics tool');
    }

    try {
      const results = await MarketplaceAnalyticsAdapter.executeQuery(args.sql);
      return { success: true, results, count: results.length, methodology: 'Live database semantic read model query', bounds: 'Max 100 rows' };
    } catch (e: any) {
      if (e.message.includes('SYSTEM_BLOCKED')) {
         throw new AiSpecialistRegistryError('SYSTEM_BLOCKED', e.message);
      }
      throw new AiSpecialistRegistryError('EXECUTION_FAILED', e.message);
    }
  }
};
