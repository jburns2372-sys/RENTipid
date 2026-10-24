import { AITools } from '../ai/ai-tools';

export class SocialAIAssistant {
  /**
   * Facade over Unified AI to draft social content.
   * Enforces the SUGGESTED CONTENT boundary.
   */
  static async draftSocialContent(listingId?: string, instructions?: string): Promise<string> {
    let context = '';
    if (listingId) {
      // Use existing Unified AI tool to pull listing context
      context = await AITools.getListingSummary(listingId);
    }
    
    // In a real scenario, this would pass `context` and `instructions` 
    // to the Unified AI orchestration layer. Here we mock it safely.
    const rawAiDraft = await AITools.createDraftListingDescription(context || 'Item');
    
    // Enforce SUGGESTED CONTENT boundary
    return `[SUGGESTED CONTENT]\n${rawAiDraft}\n\nAdditional Instructions: ${instructions || 'None'}`;
  }

  /**
   * Facade over Unified AI to suggest hashtags.
   */
  static async suggestSocialHashtags(topic: string): Promise<string[]> {
    // Mocking the Unified AI hashtag generation
    return ['#RENTipid', '#Rentals', `#${topic.replace(/\s+/g, '')}`];
  }
}
