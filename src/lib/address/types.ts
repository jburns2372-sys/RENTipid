export interface NormalizedAddress {
  addressLine1: string | null;
  addressLine2: string | null;
  sublocality: string | null;
  locality: string | null;
  administrativeArea2: string | null;
  administrativeArea1: string | null;
  postalCode: string | null;
  countryCode: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  provider: string; // "google", "manual", "legacy", etc.
  providerPlaceId: string | null;
  validationStatus: string; // "UNVERIFIED", "VALIDATED", "PARTIALLY_VALIDATED", "MANUAL", "VALIDATION_FAILED", "AUTOCOMPLETE_SELECTED"
  validationLevel: string | null;
  manuallyEdited: boolean;
  validatedAt: string | null;
}

export interface AddressSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  validationStatus: string;
  normalizedAddress?: NormalizedAddress;
}

import { z } from 'zod';
import { COUNTRIES } from './countryRegistry';

export const addressSchema = z.object({
  addressLine1: z.string().max(255).nullable(),
  addressLine2: z.string().max(255).nullable(),
  sublocality: z.string().max(255).nullable(),
  locality: z.string().max(255).nullable(),
  administrativeArea2: z.string().max(255).nullable(),
  administrativeArea1: z.string().max(255).nullable(),
  postalCode: z.string().max(50).nullable(),
  countryCode: z.string().length(2).refine(
    (code) => {
      return COUNTRIES.some((c: { countryCode: string }) => c.countryCode === code);
    },
    { message: "Must be a valid ISO 3166-1 alpha-2 code from the registry" }
  ).nullable(),
  formattedAddress: z.string().max(1000).nullable(),
  latitude: z.number().min(-90).max(90).finite().nullable(),
  longitude: z.number().min(-180).max(180).finite().nullable(),
  provider: z.enum(['google', 'MANUAL', 'LEGACY']),
  providerPlaceId: z.string().max(255).nullable(),
  validationStatus: z.enum(['UNVERIFIED', 'VALIDATED', 'PARTIALLY_VALIDATED', 'MANUAL', 'VALIDATION_FAILED', 'AUTOCOMPLETE_SELECTED']),
  validationLevel: z.string().max(100).nullable(),
  manuallyEdited: z.boolean(),
  validatedAt: z.string().datetime().nullable().optional(),
  selectionToken: z.string().max(8192).optional(),
}).strict();

export const tokenPayloadSchema = addressSchema.omit({ selectionToken: true }).extend({
  userId: z.string().min(1),
  expiresAt: z.number().positive(),
}).strict();

export const autocompleteRequestSchema = z.object({
  input: z.string().min(1).max(255),
  countryCode: z.string().length(2).refine(
    (code) => COUNTRIES.some((c: { countryCode: string }) => c.countryCode === code),
    { message: "Must be a valid ISO 3166-1 alpha-2 code from the registry" }
  ),
  sessionToken: z.string().max(1024).optional(),
}).strict();

export const detailsRequestSchema = z.object({
  placeId: z.string().min(1).max(255),
  sessionToken: z.string().max(1024).optional(),
}).strict();

export interface AddressProvider {
  autocomplete(
    input: string,
    context?: Record<string, string>
  ): Promise<{ status: string, suggestions: AddressSuggestion[] }>;

  getDetails(
    placeId: string,
    context?: Record<string, string>
  ): Promise<NormalizedAddress>;

  validate?(
    address: NormalizedAddress
  ): Promise<AddressValidationResult>;
}
