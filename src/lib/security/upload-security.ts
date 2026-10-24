import { NextResponse } from 'next/server';

export type UploadErrorCode =
  | 'UPLOAD_FILE_REQUIRED'
  | 'UPLOAD_FILE_EMPTY'
  | 'UPLOAD_TOO_LARGE'
  | 'UPLOAD_TOO_MANY_FILES'
  | 'UPLOAD_FILENAME_INVALID'
  | 'UPLOAD_FILENAME_TOO_LONG'
  | 'UPLOAD_EXTENSION_NOT_ALLOWED'
  | 'UPLOAD_MIME_NOT_ALLOWED'
  | 'UPLOAD_TYPE_MISMATCH'
  | 'UPLOAD_BINARY_CONTENT_REJECTED';

export interface UploadPolicy {
  readonly maxFiles: number;
  readonly maxSize: number; // bytes
  readonly allowedExtensions: readonly string[];
  readonly allowedMimes: readonly string[];
  readonly maxFilenameLength: number;
  readonly blockArchives: boolean;
  readonly isXlsxAllowed?: boolean;
}

export const FINANCE_UPLOAD_POLICY: UploadPolicy = Object.freeze({
  maxFiles: 1,
  maxSize: 10 * 1024 * 1024,
  allowedExtensions: ['.csv', '.xlsx'],
  allowedMimes: [
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  maxFilenameLength: 150,
  blockArchives: true,
  isXlsxAllowed: true
});

export const KYC_DOCUMENT_POLICY: UploadPolicy = Object.freeze({
  maxFiles: 5, // Preserved multi-file fallback
  maxSize: 5 * 1024 * 1024,
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  allowedMimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  maxFilenameLength: 150,
  blockArchives: true
});

export const LISTING_PHOTO_POLICY: UploadPolicy = Object.freeze({
  maxFiles: 10,
  maxSize: 5 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFilenameLength: 150,
  blockArchives: true
});

export const LISTING_DOCUMENT_POLICY: UploadPolicy = Object.freeze({
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024,
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
  allowedMimes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  maxFilenameLength: 150,
  blockArchives: true
});

const DANGEROUS_EXTENSIONS = ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.js', '.ts', '.mjs', '.cjs', '.php', '.jsp', '.asp', '.aspx', '.cgi', '.dll', '.so', '.vbs', '.msi'];
const GENERIC_ARCHIVES = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'];

export interface ValidationResult {
  isValid: boolean;
  error?: UploadErrorCode;
  status?: number;
  message?: string;
  files?: File[];
}

export async function validateUploadRequest(formData: FormData, fieldName: string, policy: UploadPolicy): Promise<ValidationResult> {
  const files = formData.getAll(fieldName);
  if (!files || files.length === 0) {
    return { isValid: false, error: 'UPLOAD_FILE_REQUIRED', status: 400, message: 'File is required' };
  }

  if (files.length > policy.maxFiles) {
    return { isValid: false, error: 'UPLOAD_TOO_MANY_FILES', status: 413, message: 'Too many files' };
  }

  const validFiles: File[] = [];

  for (const item of files) {
    if (!(item instanceof File)) {
      return { isValid: false, error: 'UPLOAD_FILE_REQUIRED', status: 400, message: 'Invalid file object' };
    }

    const file = item as File;
    if (file.size === 0) {
      return { isValid: false, error: 'UPLOAD_FILE_EMPTY', status: 400, message: 'File is empty' };
    }

    if (file.size > policy.maxSize) {
      return { isValid: false, error: 'UPLOAD_TOO_LARGE', status: 413, message: 'File size exceeds limit' };
    }

    const fileName = file.name;
    if (fileName.length > policy.maxFilenameLength) {
      return { isValid: false, error: 'UPLOAD_FILENAME_TOO_LONG', status: 400, message: 'Filename too long' };
    }

    // Reject control chars, null bytes, unix/windows path separators, traversal
    if (/[\x00-\x1F\x7F]/.test(fileName)) {
      return { isValid: false, error: 'UPLOAD_FILENAME_INVALID', status: 400, message: 'Control characters not allowed in filename' };
    }
    if (fileName.includes('\0')) {
      return { isValid: false, error: 'UPLOAD_FILENAME_INVALID', status: 400, message: 'Null byte not allowed in filename' };
    }
    if (fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
      return { isValid: false, error: 'UPLOAD_FILENAME_INVALID', status: 400, message: 'Path separators and traversal not allowed in filename' };
    }

    const extMatch = fileName.match(/\.[0-9a-z]+$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '';

    if (!ext || !policy.allowedExtensions.includes(ext)) {
      return { isValid: false, error: 'UPLOAD_EXTENSION_NOT_ALLOWED', status: 415, message: 'Extension not allowed' };
    }

    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      return { isValid: false, error: 'UPLOAD_EXTENSION_NOT_ALLOWED', status: 415, message: 'Dangerous extension not allowed' };
    }

    if (policy.blockArchives && GENERIC_ARCHIVES.includes(ext)) {
      return { isValid: false, error: 'UPLOAD_EXTENSION_NOT_ALLOWED', status: 415, message: 'Archives not allowed' };
    }

    const mime = file.type;
    if (!policy.allowedMimes.includes(mime)) {
      return { isValid: false, error: 'UPLOAD_MIME_NOT_ALLOWED', status: 415, message: 'MIME type not allowed' };
    }

    // Consistency and Signature
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const firstBytes = buffer.subarray(0, 16);
    const hex = firstBytes.toString('hex').toUpperCase();

    if (ext === '.pdf' && (!mime.includes('pdf') || !firstBytes.toString().startsWith('%PDF-'))) {
      return { isValid: false, error: 'UPLOAD_TYPE_MISMATCH', status: 415, message: 'MIME and extension mismatch' };
    }
    if ((ext === '.jpg' || ext === '.jpeg') && (!mime.includes('jpeg') || !hex.startsWith('FFD8FF'))) {
      return { isValid: false, error: 'UPLOAD_TYPE_MISMATCH', status: 415, message: 'MIME and extension mismatch' };
    }
    if (ext === '.png' && (!mime.includes('png') || !hex.startsWith('89504E470D0A1A0A'))) {
      return { isValid: false, error: 'UPLOAD_TYPE_MISMATCH', status: 415, message: 'MIME and extension mismatch' };
    }
    if (ext === '.webp' && (!mime.includes('webp') || !(hex.startsWith('52494646') && hex.substring(16, 24) === '57454250'))) {
      return { isValid: false, error: 'UPLOAD_TYPE_MISMATCH', status: 415, message: 'MIME and extension mismatch' };
    }
    if (ext === '.xlsx' && policy.isXlsxAllowed) {
      if (!hex.startsWith('504B0304')) {
        return { isValid: false, error: 'UPLOAD_TYPE_MISMATCH', status: 415, message: 'Invalid XLSX signature' };
      }
    }
    if (ext === '.csv') {
      if (buffer.includes(0x00)) {
        return { isValid: false, error: 'UPLOAD_BINARY_CONTENT_REJECTED', status: 415, message: 'CSV cannot contain null bytes' };
      }
      // Extremely basic binary check - look for excessive non-printable chars
      let nonPrintableCount = 0;
      for (let i = 0; i < Math.min(buffer.length, 512); i++) {
        const byte = buffer[i];
        if (byte < 0x20 && byte !== 0x09 && byte !== 0x0A && byte !== 0x0D) {
          nonPrintableCount++;
        }
      }
      if (nonPrintableCount > 10) { // arbitrary small threshold
        return { isValid: false, error: 'UPLOAD_BINARY_CONTENT_REJECTED', status: 415, message: 'CSV appears to be binary' };
      }
    }

    validFiles.push(file);
  }

  return { isValid: true, files: validFiles };
}

export function handleUploadError(result: ValidationResult): NextResponse {
  return NextResponse.json(
    { error: result.error, message: result.message },
    { status: result.status || 400 }
  );
}
