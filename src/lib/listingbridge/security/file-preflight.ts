import type { UploadPolicy } from '../../security/upload-security';
import { ListingBridgeSecurityError } from './errors';

export const LISTINGBRIDGE_STRUCTURED_FILE_POLICY: UploadPolicy = Object.freeze({
  maxFiles: 1,
  maxSize: 2 * 1024 * 1024,
  allowedExtensions: ['.json', '.csv', '.xml'],
  allowedMimes: ['application/json', 'text/csv', 'application/csv', 'text/xml', 'application/xml'],
  maxFilenameLength: 150,
  blockArchives: true,
});

export interface ListingBridgeStructuredFilePreflightInput {
  readonly fileName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly buffer: Uint8Array;
  readonly policy?: UploadPolicy;
}

export interface ListingBridgeStructuredFilePreflightResult {
  readonly accepted: true;
  readonly fileName: string;
  readonly extension: '.json' | '.csv' | '.xml';
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly dataClassification: 'UNTRUSTED_EXTERNAL_DATA';
  readonly eligibleForControlledParsing: true;
}

const dangerousExtensions = new Set(['.exe', '.sh', '.bat', '.cmd', '.ps1', '.js', '.ts', '.mjs', '.cjs', '.php', '.dll', '.so', '.vbs', '.msi']);
const executableMagic = [
  Buffer.from('MZ'),
  Buffer.from([0x7f, 0x45, 0x4c, 0x46]),
  Buffer.from('#!'),
];

export function preflightListingBridgeStructuredFile(
  input: ListingBridgeStructuredFilePreflightInput,
): ListingBridgeStructuredFilePreflightResult {
  const policy = input.policy ?? LISTINGBRIDGE_STRUCTURED_FILE_POLICY;
  const fileName = input.fileName.trim();
  const mimeType = input.mimeType.trim().toLowerCase();
  const buffer = Buffer.from(input.buffer);

  if (!fileName || /[\x00-\x1F\x7F]/.test(fileName) || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Invalid structured import filename' });
  }
  if (fileName.length > policy.maxFilenameLength) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Structured import filename too long' });
  }
  if (input.sizeBytes <= 0 || buffer.length === 0) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Structured import file is empty' });
  }
  if (input.sizeBytes > policy.maxSize || buffer.length > policy.maxSize) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Structured import file is too large' });
  }

  const extension = extractExtension(fileName);
  if (!extension || dangerousExtensions.has(extension) || !policy.allowedExtensions.includes(extension)) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Structured import extension is not allowed' });
  }
  if (!policy.allowedMimes.includes(mimeType)) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Structured import MIME type is not allowed' });
  }
  if (executableMagic.some(magic => buffer.subarray(0, magic.length).equals(magic))) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Executable payload rejected' });
  }

  validateContentEnvelope(extension as '.json' | '.csv' | '.xml', mimeType, buffer);

  return Object.freeze({
    accepted: true,
    fileName,
    extension: extension as '.json' | '.csv' | '.xml',
    mimeType,
    sizeBytes: input.sizeBytes,
    dataClassification: 'UNTRUSTED_EXTERNAL_DATA',
    eligibleForControlledParsing: true,
  });
}

function extractExtension(fileName: string): string {
  const match = fileName.match(/\.[0-9a-z]+$/i);
  return match ? match[0].toLowerCase() : '';
}

function validateContentEnvelope(extension: '.json' | '.csv' | '.xml', mimeType: string, buffer: Buffer): void {
  const start = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').trimStart();

  if (buffer.includes(0x00)) {
    throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'Structured import cannot contain null bytes' });
  }
  if (extension === '.json') {
    if (mimeType !== 'application/json' || (!start.startsWith('{') && !start.startsWith('['))) {
      throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'JSON import envelope mismatch' });
    }
  }
  if (extension === '.csv') {
    if (!['text/csv', 'application/csv'].includes(mimeType) || start.startsWith('<') || start.startsWith('{') || start.startsWith('[')) {
      throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'CSV import envelope mismatch' });
    }
  }
  if (extension === '.xml') {
    if (!['text/xml', 'application/xml'].includes(mimeType) || !start.startsWith('<')) {
      throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'XML import envelope mismatch' });
    }
    if (/<!DOCTYPE|<!ENTITY/i.test(start)) {
      throw new ListingBridgeSecurityError({ code: 'FILE_REJECTED', internalMessage: 'XML import DTD/entity declarations are not allowed' });
    }
  }
}
