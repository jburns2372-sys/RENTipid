import type {
  ListingBridgeSemanticAiAdapter,
  ListingBridgeSemanticAiInput,
  ListingBridgeSemanticAiOutput,
} from '../normalization/semantic-ai-boundary';
import { ListingBridgeSemanticAiOutputSchema } from '../normalization/semantic-ai-boundary';
import { ListingBridgeAiService } from './listingbridge-ai-service';

export interface UnifiedAiAdapterOptions {
  readonly enabled?: boolean;
  readonly aiService?: ListingBridgeAiService;
}

export class ListingBridgeUnifiedAiAdapter implements ListingBridgeSemanticAiAdapter {
  private readonly enabled: boolean;
  private readonly aiService: ListingBridgeAiService;

  constructor(options?: UnifiedAiAdapterOptions) {
    this.enabled = options?.enabled ?? process.env.LISTINGBRIDGE_AI_MAPPING !== 'false';
    this.aiService = options?.aiService ?? new ListingBridgeAiService();
  }

  isAvailable(): boolean {
    return this.enabled;
  }

  async mapAmbiguousFields(
    input: ListingBridgeSemanticAiInput,
  ): Promise<ListingBridgeSemanticAiOutput | null> {
    if (!this.enabled) {
      return null; // AI disabled fallback
    }

    try {
      const amenitySuggestions: Array<{
        rawAmenity: string;
        canonicalSuggestion: string;
        confidence: 'HIGH_CONFIDENCE' | 'REVIEW_RECOMMENDED';
      }> = [];

      // 1. Process unmapped amenities through bounded semantic suggestions
      for (const rawAmenity of input.unmappedAmenities) {
        const result = this.aiService.suggestAmenityMapping('system-ai', rawAmenity);
        if (result.suggestedDisplayName) {
          amenitySuggestions.push({
            rawAmenity,
            canonicalSuggestion: result.suggestedDisplayName,
            confidence: result.confidence,
          });
        }
      }

      // 2. Process ambiguous property type / category
      let categorySlugSuggestion: string | undefined;
      if (input.rawPropertyType) {
        const catResult = this.aiService.suggestPropertyCategory(
          'system-ai',
          input.rawPropertyType,
        );
        if (catResult.suggestedCategorySlug) {
          categorySlugSuggestion = catResult.suggestedCategorySlug;
        }
      }

      const rawOutput = {
        categorySlugSuggestion,
        propertyTypeSuggestion: undefined,
        amenitySuggestions: amenitySuggestions.length > 0 ? amenitySuggestions : undefined,
        confidence: 'HIGH_CONFIDENCE' as const,
        reasoningSummary: 'Synthesized via Unified AI semantic mapping rules.',
      };

      // 3. Strict schema validation
      const parsed = ListingBridgeSemanticAiOutputSchema.safeParse(rawOutput);
      if (!parsed.success) {
        return null; // Fail-closed on schema violations
      }

      return parsed.data;
    } catch {
      // Fail-closed on AI execution errors
      return null;
    }
  }
}
