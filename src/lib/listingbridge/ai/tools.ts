import type { ToolDefinition, ToolContext, AiToolGateway } from '../../ai/tools/AiToolGateway';
import { ListingBridgeAiService } from './listingbridge-ai-service';

const aiService = new ListingBridgeAiService();

const PROVIDER_AND_ADMIN_ROLES = [
  'Provider',
  'Individual Provider',
  'Business Provider',
  'Admin',
  'Super Admin',
];

export const getListingBridgeReviewSummaryTool: ToolDefinition = {
  name: 'getListingBridgeReviewSummary',
  riskClass: 'READ_ONLY',
  description: 'Retrieve a sanitized, provider-friendly summary of an active listing import review snapshot.',
  allowedRoles: PROVIDER_AND_ADMIN_ROLES,
  handler: async (args: { importJobId: string }, context: ToolContext) => {
    if (!args.importJobId) throw new Error('MISSING_ARGUMENT: importJobId is required');
    return await aiService.getReviewSummary(context.userId, args.importJobId);
  },
};

export const identifyListingBridgeMissingFieldsTool: ToolDefinition = {
  name: 'identifyListingBridgeMissingFields',
  riskClass: 'READ_ONLY',
  description: 'Identify unresolved or missing required fields for an import job and get actionable guidance.',
  allowedRoles: PROVIDER_AND_ADMIN_ROLES,
  handler: async (args: { importJobId: string }, context: ToolContext) => {
    if (!args.importJobId) throw new Error('MISSING_ARGUMENT: importJobId is required');
    return await aiService.identifyMissingFields(context.userId, args.importJobId);
  },
};

export const explainListingBridgeConflictTool: ToolDefinition = {
  name: 'explainListingBridgeConflict',
  riskClass: 'READ_ONLY',
  description: 'Explain a deterministic validation or conflict code in plain, provider-friendly terms.',
  allowedRoles: PROVIDER_AND_ADMIN_ROLES,
  handler: async (args: { importJobId: string; conflictCode: string }, context: ToolContext) => {
    if (!args.importJobId) throw new Error('MISSING_ARGUMENT: importJobId is required');
    if (!args.conflictCode) throw new Error('MISSING_ARGUMENT: conflictCode is required');
    return await aiService.explainConflict(context.userId, args.importJobId, args.conflictCode);
  },
};

export const suggestListingBridgeAmenityMappingTool: ToolDefinition = {
  name: 'suggestListingBridgeAmenityMapping',
  riskClass: 'READ_ONLY',
  description: 'Suggest a canonical RENTipid amenity taxonomy ID for an unmapped or colloquial amenity term.',
  allowedRoles: PROVIDER_AND_ADMIN_ROLES,
  handler: async (args: { rawTerm: string }, context: ToolContext) => {
    if (!args.rawTerm) throw new Error('MISSING_ARGUMENT: rawTerm is required');
    return aiService.suggestAmenityMapping(context.userId, args.rawTerm);
  },
};

export const suggestListingBridgePropertyCategoryTool: ToolDefinition = {
  name: 'suggestListingBridgePropertyCategory',
  riskClass: 'READ_ONLY',
  description: 'Suggest an existing RENTipid property category slug for a raw property type string.',
  allowedRoles: PROVIDER_AND_ADMIN_ROLES,
  handler: async (args: { rawPropertyType: string }, context: ToolContext) => {
    if (!args.rawPropertyType) throw new Error('MISSING_ARGUMENT: rawPropertyType is required');
    return aiService.suggestPropertyCategory(context.userId, args.rawPropertyType);
  },
};

export const draftListingBridgeOriginalDescriptionTool: ToolDefinition = {
  name: 'draftListingBridgeOriginalDescription',
  riskClass: 'DRAFT_ONLY',
  description: 'Draft an original RENTipid listing description synthesized strictly from verified/confirmed attributes.',
  allowedRoles: PROVIDER_AND_ADMIN_ROLES,
  handler: async (args: { importJobId: string }, context: ToolContext) => {
    if (!args.importJobId) throw new Error('MISSING_ARGUMENT: importJobId is required');
    return await aiService.draftOriginalDescription(context.userId, args.importJobId);
  },
};

export const listingBridgeAiTools: readonly ToolDefinition[] = Object.freeze([
  getListingBridgeReviewSummaryTool,
  identifyListingBridgeMissingFieldsTool,
  explainListingBridgeConflictTool,
  suggestListingBridgeAmenityMappingTool,
  suggestListingBridgePropertyCategoryTool,
  draftListingBridgeOriginalDescriptionTool,
]);

export function registerListingBridgeTools(gateway: AiToolGateway): void {
  for (const tool of listingBridgeAiTools) {
    gateway.registerTool(tool);
  }
}
