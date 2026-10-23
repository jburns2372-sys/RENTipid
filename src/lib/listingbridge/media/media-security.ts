import { computeSha256 } from '../utils/idempotency';

export type ListingBridgeMediaMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export interface MediaValidationResult {
  readonly isValid: boolean;
  readonly contentSha256: string;
  readonly detectedMime?: ListingBridgeMediaMimeType;
  readonly sizeBytes: number;
  readonly suggestedExtension?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

export interface MediaSecurityPolicy {
  readonly maxSizeBytes: number;
  readonly minSizeBytes: number;
  readonly allowedMimes: readonly ListingBridgeMediaMimeType[];
}

export const DEFAULT_LISTINGBRIDGE_MEDIA_POLICY: MediaSecurityPolicy = Object.freeze({
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  minSizeBytes: 100, // 100 bytes
  allowedMimes: Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as readonly ListingBridgeMediaMimeType[]),
});

export class ListingBridgeMediaSecurityValidator {
  constructor(private readonly policy: MediaSecurityPolicy = DEFAULT_LISTINGBRIDGE_MEDIA_POLICY) {}

  validate(buffer: Buffer, declaredMime?: string): MediaValidationResult {
    const sizeBytes = buffer.length;
    const contentSha256 = computeSha256(buffer);

    if (sizeBytes < this.policy.minSizeBytes) {
      return Object.freeze({
        isValid: false,
        contentSha256,
        sizeBytes,
        errorCode: 'MEDIA_EMPTY_OR_TOO_SMALL',
        errorMessage: `Media size (${sizeBytes} bytes) is below minimum allowed (${this.policy.minSizeBytes} bytes)`,
      });
    }

    if (sizeBytes > this.policy.maxSizeBytes) {
      return Object.freeze({
        isValid: false,
        contentSha256,
        sizeBytes,
        errorCode: 'MEDIA_TOO_LARGE',
        errorMessage: `Media size (${sizeBytes} bytes) exceeds maximum limit (${this.policy.maxSizeBytes} bytes)`,
      });
    }

    const detectedMime = this.sniffMimeType(buffer);

    if (!detectedMime || !this.policy.allowedMimes.includes(detectedMime)) {
      return Object.freeze({
        isValid: false,
        contentSha256,
        sizeBytes,
        errorCode: 'MEDIA_MIME_NOT_ALLOWED',
        errorMessage: `Detected media type '${detectedMime || 'unknown'}' is not allowed`,
      });
    }

    // Declared vs Detected compatibility check
    if (declaredMime && declaredMime.trim()) {
      const normalizedDeclared = declaredMime.trim().toLowerCase();
      if (
        normalizedDeclared !== detectedMime
        && !this.areMimesCompatible(normalizedDeclared, detectedMime)
      ) {
        return Object.freeze({
          isValid: false,
          contentSha256,
          sizeBytes,
          detectedMime,
          errorCode: 'MEDIA_TYPE_MISMATCH',
          errorMessage: `Declared MIME '${declaredMime}' does not match detected format '${detectedMime}'`,
        });
      }
    }

    const suggestedExtension = this.getExtensionForMime(detectedMime);

    return Object.freeze({
      isValid: true,
      contentSha256,
      detectedMime,
      sizeBytes,
      suggestedExtension,
    });
  }

  private sniffMimeType(buffer: Buffer): ListingBridgeMediaMimeType | undefined {
    if (buffer.length < 12) return undefined;

    const hex = buffer.subarray(0, 16).toString('hex').toUpperCase();

    // JPEG: Starts with FFD8FF
    if (hex.startsWith('FFD8FF')) {
      return 'image/jpeg';
    }

    // PNG: Starts with 89504E470D0A1A0A (\x89PNG\r\n\x1a\n)
    if (hex.startsWith('89504E470D0A1A0A')) {
      return 'image/png';
    }

    // GIF: Starts with 47494638 ('GIF8')
    if (hex.startsWith('47494638')) {
      return 'image/gif';
    }

    // WEBP: Starts with 'RIFF' (52494646) and bytes 8..11 are 'WEBP' (57454250)
    if (hex.startsWith('52494646') && hex.substring(16, 24) === '57454250') {
      return 'image/webp';
    }

    return undefined;
  }

  private areMimesCompatible(declared: string, detected: string): boolean {
    if (declared === 'image/jpg' && detected === 'image/jpeg') return true;
    if (declared === 'image/pjpeg' && detected === 'image/jpeg') return true;
    if (declared === 'application/octet-stream') return true; // Generic binary stream
    return false;
  }

  private getExtensionForMime(mime: ListingBridgeMediaMimeType): string {
    switch (mime) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
    }
  }
}
