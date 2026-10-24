import 'server-only';
import { SecretEnvelopeService } from '@/lib/security/crypto/secret-envelope';
import { KeyPurpose } from '@/lib/security/crypto/key-provider';

import { tokenPayloadSchema } from './types';

const TOKEN_CONTEXT = 'rentipid.address.selection.token.v1';
const EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes

export interface AddressSelectionPayload {
  userId: string;
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
  provider: string;
  providerPlaceId: string | null;
  validationStatus: string;
  validationLevel: string | null;
  manuallyEdited: boolean;
  validatedAt: string | null;
  expiresAt: number;
}

export class AddressTokenService {
  static generateToken(payload: Omit<AddressSelectionPayload, 'expiresAt'>): string {
    const fullPayload: AddressSelectionPayload = {
      ...payload,
      expiresAt: Date.now() + EXPIRATION_MS,
    };
    
    const plaintext = JSON.stringify(fullPayload);
    const envelope = SecretEnvelopeService.encryptSecret(plaintext, TOKEN_CONTEXT, KeyPurpose.FIELD_ENCRYPTION);
    
    return Buffer.from(JSON.stringify(envelope)).toString('base64');
  }

  static verifyToken(tokenBase64: string): AddressSelectionPayload | null {
    try {
      const envelopeStr = Buffer.from(tokenBase64, 'base64').toString('utf8');
      const envelope = JSON.parse(envelopeStr);
      
      const plaintext = SecretEnvelopeService.decryptSecret(envelope, TOKEN_CONTEXT, KeyPurpose.FIELD_ENCRYPTION);
      const rawPayload = JSON.parse(plaintext);
      
      // Validate using imported schema
      const validationResult = tokenPayloadSchema.safeParse(rawPayload);
      if (!validationResult.success) {
        console.warn('Address token failed schema validation:', JSON.stringify(validationResult.error.issues, null, 2));
        return null;
      }
      
      const payload = validationResult.data as AddressSelectionPayload;
      
      if (Date.now() > payload.expiresAt) {
        return null;
      }
      
      return payload;
    } catch {
      return null;
    }
  }
}
