import { ToolDefinition } from './AiToolGateway';
import { AITools } from '../ai-tools';
import { PrismaClient } from '@prisma/client';
import { hasSocialPermission, SOCIAL_PERMISSIONS } from '../../social/social-permissions';
import { SocialAnalyticsService } from '../../social/social-analytics-service';

const prisma = new PrismaClient();

const ALL_ROLES = [
  'Guest', 'Renter', 'Individual Provider', 'Business Provider',
  'Admin', 'Finance Admin', 'Compliance Admin', 'Super Admin', 'USER'
];

async function enforceSocialPermission(userId: string, permission: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Unauthorized actor');
  if (!hasSocialPermission(user.role, permission as any)) {
    throw new Error(`Role ${user.role} not authorized for social action (Missing: ${permission})`);
  }
  return user;
}

export const draftSocialContentTool: ToolDefinition = {
  name: 'draftSocialContent',
  riskClass: 'DRAFT_ONLY',
  description: 'Draft new social media content based on a prompt',
  allowedRoles: ALL_ROLES,
  handler: async (args: { prompt: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.CREATE);
    return await AITools.createDraftSocialContent(args.prompt);
  }
};

export const rewriteSocialContentTool: ToolDefinition = {
  name: 'rewriteSocialContent',
  riskClass: 'DRAFT_ONLY',
  description: 'Rewrite existing social media content',
  allowedRoles: ALL_ROLES,
  handler: async (args: { content: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.EDIT);
    return await AITools.rewriteSocialContent(args.content);
  }
};

export const adaptContentForChannelTool: ToolDefinition = {
  name: 'adaptContentForChannel',
  riskClass: 'DRAFT_ONLY',
  description: 'Adapt social media content for a specific channel',
  allowedRoles: ALL_ROLES,
  handler: async (args: { content: string, channel: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.EDIT);
    return await AITools.adaptContentForChannel(args.content, args.channel);
  }
};

export const suggestSocialHashtagsTool: ToolDefinition = {
  name: 'suggestSocialHashtags',
  riskClass: 'READ_ONLY',
  description: 'Suggest hashtags for social media content',
  allowedRoles: ALL_ROLES,
  handler: async (args: { content: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.VIEW);
    return await AITools.suggestSocialHashtags(args.content);
  }
};

export const suggestCTATool: ToolDefinition = {
  name: 'suggestCTA',
  riskClass: 'READ_ONLY',
  description: 'Suggest Call-To-Action (CTA) for social media content',
  allowedRoles: ALL_ROLES,
  handler: async (args: { content: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.VIEW);
    return await AITools.suggestCTA(args.content);
  }
};

export const summarizeListingForPromotionTool: ToolDefinition = {
  name: 'summarizeListingForPromotion',
  riskClass: 'READ_ONLY',
  description: 'Summarize a listing for social media promotion',
  allowedRoles: ALL_ROLES,
  handler: async (args: { listingId: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.VIEW);
    return await AITools.summarizeListingForPromotion(args.listingId);
  }
};

export const suggestCampaignIdeasTool: ToolDefinition = {
  name: 'suggestCampaignIdeas',
  riskClass: 'READ_ONLY',
  description: 'Suggest campaign ideas',
  allowedRoles: ALL_ROLES,
  handler: async (args: { objective: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.VIEW);
    return await AITools.suggestCampaignIdeas(args.objective);
  }
};

export const summarizeCampaignTool: ToolDefinition = {
  name: 'summarizeCampaign',
  riskClass: 'READ_ONLY',
  description: 'Summarize campaign details',
  allowedRoles: ALL_ROLES,
  handler: async (args: { campaignId: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.VIEW);
    return await AITools.summarizeCampaign(args.campaignId);
  }
};

export const recommendCampaignImprovementsTool: ToolDefinition = {
  name: 'recommendCampaignImprovements',
  riskClass: 'READ_ONLY',
  description: 'Recommend improvements for a campaign',
  allowedRoles: ALL_ROLES,
  handler: async (args: { campaignId: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.VIEW);
    return await AITools.recommendCampaignImprovements(args.campaignId);
  }
};

export const classifySocialFeedbackTool: ToolDefinition = {
  name: 'classifySocialFeedback',
  riskClass: 'READ_ONLY',
  description: 'Classify social feedback sentiment and topic',
  allowedRoles: ALL_ROLES,
  handler: async (args: { content: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.FEEDBACK_VIEW);
    return await AITools.classifySocialFeedback(args.content);
  }
};

export const summarizeSocialFeedbackTool: ToolDefinition = {
  name: 'summarizeSocialFeedback',
  riskClass: 'READ_ONLY',
  description: 'Summarize social feedback',
  allowedRoles: ALL_ROLES,
  handler: async (args: { feedbackId: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.FEEDBACK_VIEW);
    return await AITools.summarizeSocialFeedback(args.feedbackId);
  }
};

export const draftFeedbackResponseTool: ToolDefinition = {
  name: 'draftFeedbackResponse',
  riskClass: 'DRAFT_ONLY',
  description: 'Draft a response for social feedback',
  allowedRoles: ALL_ROLES,
  handler: async (args: { feedbackId: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.FEEDBACK_RESPOND);
    return await AITools.draftFeedbackResponse(args.feedbackId);
  }
};

export const summarizeSocialAnalyticsTool: ToolDefinition = {
  name: 'summarizeSocialAnalytics',
  riskClass: 'READ_ONLY',
  description: 'Summarize social analytics using deterministic P10 data',
  allowedRoles: ALL_ROLES,
  handler: async (args: { campaignId: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.ANALYTICS_VIEW);
    const data = await SocialAnalyticsService.calculateCampaignROI(args.campaignId);
    return await AITools.summarizeSocialAnalytics(args.campaignId, data);
  }
};

export const explainCampaignPerformanceTool: ToolDefinition = {
  name: 'explainCampaignPerformance',
  riskClass: 'READ_ONLY',
  description: 'Explain campaign performance using deterministic P10 data',
  allowedRoles: ALL_ROLES,
  handler: async (args: { campaignId: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.ANALYTICS_VIEW);
    const data = await SocialAnalyticsService.calculateCampaignROI(args.campaignId);
    return await AITools.explainCampaignPerformance(args.campaignId, data);
  }
};

export const identifySocialTrendsTool: ToolDefinition = {
  name: 'identifySocialTrends',
  riskClass: 'READ_ONLY',
  description: 'Identify social trends',
  allowedRoles: ALL_ROLES,
  handler: async (args: { topic: string }, context) => {
    await enforceSocialPermission(context.userId, SOCIAL_PERMISSIONS.ANALYTICS_VIEW);
    return await AITools.identifySocialTrends(args.topic);
  }
};

export const socialDomainTools = [
  draftSocialContentTool,
  rewriteSocialContentTool,
  adaptContentForChannelTool,
  suggestSocialHashtagsTool,
  suggestCTATool,
  summarizeListingForPromotionTool,
  suggestCampaignIdeasTool,
  summarizeCampaignTool,
  recommendCampaignImprovementsTool,
  classifySocialFeedbackTool,
  summarizeSocialFeedbackTool,
  draftFeedbackResponseTool,
  summarizeSocialAnalyticsTool,
  explainCampaignPerformanceTool,
  identifySocialTrendsTool
];
