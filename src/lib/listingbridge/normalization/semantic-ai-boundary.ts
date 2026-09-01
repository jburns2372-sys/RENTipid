import { z } from 'zod';

export const ListingBridgeSemanticAiOutputSchema = z.object({
  categorySlugSuggestion: z.string().min(1).optional(),
  propertyTypeSuggestion: z.string().min(1).optional(),
  amenitySuggestions: z.array(
    z.object({
      rawAmenity: z.string().min(1),
      canonicalSuggestion: z.string().min(1),
      confidence: z.enum(['HIGH_CONFIDENCE', 'REVIEW_RECOMMENDED']),
    }),
  ).optional(),
  confidence: z.enum(['HIGH_CONFIDENCE', 'REVIEW_RECOMMENDED']),
  reasoningSummary: z.string().max(500).optional(),
});

export type ListingBridgeSemanticAiOutput = z.infer<typeof ListingBridgeSemanticAiOutputSchema>;

export interface ListingBridgeSemanticAiInput {
  readonly rawTitle?: string;
  readonly rawDescription?: string;
  readonly rawPropertyType?: string;
  readonly unmappedAmenities: readonly string[];
  readonly categoryAmbiguityReason?: string;
}

export interface ListingBridgeSemanticAiAdapter {
  isAvailable(): boolean;
  mapAmbiguousFields(input: ListingBridgeSemanticAiInput): Promise<ListingBridgeSemanticAiOutput | null>;
}

export class DisabledSemanticAiAdapter implements ListingBridgeSemanticAiAdapter {
  isAvailable(): boolean {
    return false;
  }

  async mapAmbiguousFields(): Promise<ListingBridgeSemanticAiOutput | null> {
    return null;
  }
}

export class BoundedMockSemanticAiAdapter implements ListingBridgeSemanticAiAdapter {
  private readonly handler?: (input: ListingBridgeSemanticAiInput) => Promise<ListingBridgeSemanticAiOutput | null>;

  constructor(handler?: (input: ListingBridgeSemanticAiInput) => Promise<ListingBridgeSemanticAiOutput | null>) {
    this.handler = handler;
  }

  isAvailable(): boolean {
    return true;
  }

  async mapAmbiguousFields(input: ListingBridgeSemanticAiInput): Promise<ListingBridgeSemanticAiOutput | null> {
    if (this.handler) {
      const rawResult = await this.handler(input);
      if (!rawResult) return null;
      const parsed = ListingBridgeSemanticAiOutputSchema.safeParse(rawResult);
      if (!parsed.success) {
        return null; // Fail-safe: malformed output rejected safely
      }
      return parsed.data;
    }
    return null;
  }
}
