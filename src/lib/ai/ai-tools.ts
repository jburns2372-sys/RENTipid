export const AITools = {
  getBookingSummary: async (bookingId: string) => {
    return `[Mock] Booking ${bookingId} is in Pending state. Dates: Oct 1 - Oct 5.`;
  },
  getListingSummary: async (listingId: string) => {
    return `[Mock] Listing ${listingId} is active. Quantity: 1. Daily rate: 500.`;
  },
  getKYCChecklist: async (userId: string) => {
    return `[Mock] User ${userId} is missing Proof of Billing. ID is approved.`;
  },
  getPaymentSummary: async (bookingId: string) => {
    return `[Mock] Payment for booking ${bookingId} requires 500 deposit and 200 rental fee.`;
  },
  getAgreementSummary: async (bookingId: string) => {
    return `[Mock] Agreement for booking ${bookingId} has standard RENTipid terms + no pets allowed.`;
  },
  getInspectionSummary: async (bookingId: string) => {
    return `[Mock] Inspection for ${bookingId}: Pre-rental photos uploaded. Waiting for renter confirmation.`;
  },
  getDisputeSummary: async (disputeId: string) => {
    return `[Mock] Dispute ${disputeId}: Claim is for 1000 due to scratch. Provider submitted photos. Renter response pending.`;
  },
  getFinanceSummary: async (userId: string) => {
    return `[Mock] Finance for ${userId}: Total escrow 1500. Available for payout: 500.`;
  },
  getUserNextActions: async (userId: string) => {
    return `[Mock] Next actions for ${userId}: Upload ID for KYC.`;
  },
  createDraftListingDescription: async (item: string) => {
    return `[Mock Draft] "Premium ${item} available for rent. Well maintained and ready for your project. Includes standard accessories. Message for availability."`;
  },
  createDraftSupportReply: async (issue: string) => {
    return `[Mock Draft] "Hi there, sorry to hear you're experiencing issues with ${issue}. Let me check the logs and get back to you shortly."`;
  },
  createDraftAdminNote: async (userId: string) => {
    return `[Mock Draft] "Reviewed profile for user ${userId}. Looks legitimate but keeping an eye on risk factors."`;
  },
  summarizeAuditLogs: async (targetId: string) => {
    return `[Mock] Audit logs for ${targetId}: 3 events logged today. Normal activity.`;
  },
  
  // Phase 11 - Social Tools
  createDraftSocialContent: async (prompt: string) => {
    return `[Mock Draft] Suggested content for: ${prompt}`;
  },
  rewriteSocialContent: async (content: string) => {
    return `[Mock Draft] Rewritten content: ${content}`;
  },
  adaptContentForChannel: async (content: string, channel: string) => {
    return `[Mock Draft] Content adapted for ${channel}`;
  },
  suggestSocialHashtags: async (content: string) => {
    return `[Mock] #rentipid #rental #equipment`;
  },
  suggestCTA: async (content: string) => {
    return `[Mock] Rent now and save 20%!`;
  },
  summarizeListingForPromotion: async (listingId: string) => {
    return `[Mock] Listing ${listingId} is perfect for heavy duty construction`;
  },
  suggestCampaignIdeas: async (objective: string) => {
    return `[Mock] Campaign Idea: Summer Sale for ${objective}`;
  },
  summarizeCampaign: async (campaignId: string) => {
    return `[Mock] Campaign ${campaignId} is performing well with high engagement`;
  },
  recommendCampaignImprovements: async (campaignId: string) => {
    return `[Mock] Recommendation: Increase budget for Campaign ${campaignId}`;
  },
  classifySocialFeedback: async (content: string) => {
    return `[Mock] Sentiment: POSITIVE, Topic: SERVICE`;
  },
  summarizeSocialFeedback: async (feedbackId: string) => {
    return `[Mock] Feedback ${feedbackId} indicates high satisfaction with delivery`;
  },
  draftFeedbackResponse: async (feedbackId: string) => {
    return `[Mock Draft] Thank you for your feedback on ${feedbackId}!`;
  },
  summarizeSocialAnalytics: async (campaignId: string, data: any) => {
    return `[Mock] Analytics for ${campaignId} show an ROI of ${data.roiPercent}%`;
  },
  explainCampaignPerformance: async (campaignId: string, data: any) => {
    return `[Mock] Performance explained: Revenue is ${data.totalRevenue}`;
  },
  identifySocialTrends: async (topic: string) => {
    return `[Mock] Trends for ${topic} are pointing towards increased weekend rentals`;
  }
};
