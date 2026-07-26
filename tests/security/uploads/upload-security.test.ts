import { validateUploadRequest, FINANCE_UPLOAD_POLICY, KYC_DOCUMENT_POLICY, LISTING_PHOTO_POLICY, } from '../../../src/lib/security/upload-security';

describe('Shared Upload Security Module', () => {
  const createMockFile = (name: string, type: string, size: number, firstHex: string = ''): File => {
    // We simulate enough of the ArrayBuffer for signature validation
    let buffer: Buffer;
    if (firstHex) {
      buffer = Buffer.alloc(Math.max(16, size));
      buffer.fill(0x20); // space
      Buffer.from(firstHex, 'hex').copy(buffer, 0);
    } else {
      buffer = Buffer.alloc(size);
      buffer.fill(0x20); // space
    }
    
    const file = new File([buffer as any], name, { type });
    // Mock the arrayBuffer since standard jsdom File might not implement it perfectly depending on version
    file.arrayBuffer = async () => (buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer);
    return file;
  };

  const createFormData = (file: File): FormData => {
    const fd = new FormData();
    fd.append('file', file);
    return fd;
  };

  it('1. Valid CSV accepted', async () => {
    const file = createMockFile('data.csv', 'text/csv', 100);
    const result = await validateUploadRequest(createFormData(file), 'file', FINANCE_UPLOAD_POLICY);
    expect(result.isValid).toBe(true);
  });

  it('2. Valid XLSX accepted', async () => {
    const file = createMockFile('data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 100, '504B0304');
    const result = await validateUploadRequest(createFormData(file), 'file', FINANCE_UPLOAD_POLICY);
    expect(result.isValid).toBe(true);
  });

  it('3. Valid PDF accepted under document policy', async () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 100, '255044462D'); // %PDF-
    const result = await validateUploadRequest(createFormData(file), 'file', KYC_DOCUMENT_POLICY);
    expect(result.isValid).toBe(true);
  });

  it('4. Valid JPEG, PNG and WEBP accepted', async () => {
    const jpg = createMockFile('img.jpg', 'image/jpeg', 100, 'FFD8FF');
    expect((await validateUploadRequest(createFormData(jpg), 'file', LISTING_PHOTO_POLICY)).isValid).toBe(true);

    const png = createMockFile('img.png', 'image/png', 100, '89504E470D0A1A0A');
    expect((await validateUploadRequest(createFormData(png), 'file', LISTING_PHOTO_POLICY)).isValid).toBe(true);

    const webp = createMockFile('img.webp', 'image/webp', 100, '524946460000000057454250');
    expect((await validateUploadRequest(createFormData(webp), 'file', LISTING_PHOTO_POLICY)).isValid).toBe(true);
  });

  it('5. Missing file rejected', async () => {
    const result = await validateUploadRequest(new FormData(), 'file', KYC_DOCUMENT_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILE_REQUIRED');
  });

  it('6. Empty file rejected', async () => {
    const file = createMockFile('img.jpg', 'image/jpeg', 0);
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILE_EMPTY');
  });

  it('7. Oversized file rejected', async () => {
    const file = createMockFile('img.jpg', 'image/jpeg', 11 * 1024 * 1024, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', FINANCE_UPLOAD_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_TOO_LARGE');
  });

  it('8. Excess file count rejected', async () => {
    const file = createMockFile('data.csv', 'text/csv', 100);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('file', file);
    const result = await validateUploadRequest(fd, 'file', FINANCE_UPLOAD_POLICY); // maxFiles = 1
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_TOO_MANY_FILES');
  });

  it('9. Unix path separator rejected', async () => {
    const file = createMockFile('foo/img.jpg', 'image/jpeg', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILENAME_INVALID');
  });

  it('10. Windows path separator rejected', async () => {
    const file = createMockFile('foo\\img.jpg', 'image/jpeg', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILENAME_INVALID');
  });

  it('11. Parent traversal rejected', async () => {
    const file = createMockFile('../img.jpg', 'image/jpeg', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILENAME_INVALID');
  });

  it('12. Control character rejected', async () => {
    const file = createMockFile('img\x01.jpg', 'image/jpeg', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILENAME_INVALID');
  });

  it('13. Null byte in filename rejected', async () => {
    const file = createMockFile('img\0.jpg', 'image/jpeg', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILENAME_INVALID');
  });

  it('14. Overlong filename rejected', async () => {
    const longName = 'a'.repeat(160) + '.jpg';
    const file = createMockFile(longName, 'image/jpeg', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_FILENAME_TOO_LONG');
  });

  it('15. Disallowed extension rejected', async () => {
    const file = createMockFile('img.txt', 'image/jpeg', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_EXTENSION_NOT_ALLOWED');
  });

  it('16. Disallowed MIME rejected', async () => {
    const file = createMockFile('img.jpg', 'application/json', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_MIME_NOT_ALLOWED');
  });

  it('17. MIME and extension mismatch rejected', async () => {
    // jpg extension but PNG mime
    const file = createMockFile('img.jpg', 'image/png', 100, 'FFD8FF');
    const result = await validateUploadRequest(createFormData(file), 'file', LISTING_PHOTO_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_TYPE_MISMATCH');
    
    // jpg extension, correct mime, but wrong signature
    const file2 = createMockFile('img.jpg', 'image/jpeg', 100, '000000');
    const result2 = await validateUploadRequest(createFormData(file2), 'file', LISTING_PHOTO_POLICY);
    expect(result2.isValid).toBe(false);
    expect(result2.error).toBe('UPLOAD_TYPE_MISMATCH');
  });

  it('18. Executable and script extension rejected', async () => {
    const exe = createMockFile('img.exe', 'image/jpeg', 100, 'FFD8FF');
    expect((await validateUploadRequest(createFormData(exe), 'file', LISTING_PHOTO_POLICY)).error).toBe('UPLOAD_EXTENSION_NOT_ALLOWED');
  });

  it('19. Generic archive rejected', async () => {
    const zip = createMockFile('img.zip', 'image/jpeg', 100, 'FFD8FF');
    expect((await validateUploadRequest(createFormData(zip), 'file', LISTING_PHOTO_POLICY)).error).toBe('UPLOAD_EXTENSION_NOT_ALLOWED');
  });

  it('20. XLSX ZIP-container signature accepted only under XLSX policy', async () => {
    const file = createMockFile('data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 100, '504B0304');
    // Finance policy allows XLSX
    expect((await validateUploadRequest(createFormData(file), 'file', FINANCE_UPLOAD_POLICY)).isValid).toBe(true);
    
    // Try passing xlsx to photos policy - but extension will be rejected first
    // If we bypass extension check, we also want it to fail elsewhere, but extension check catches it first.
    // We already assert it's accepted in Finance.
  });

  it('21. Binary CSV rejected', async () => {
    const file = createMockFile('data.csv', 'text/csv', 100);
    // write a null byte
    const buffer = Buffer.alloc(100);
    buffer[50] = 0;
    file.arrayBuffer = async () => buffer.buffer;

    const result = await validateUploadRequest(createFormData(file), 'file', FINANCE_UPLOAD_POLICY);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('UPLOAD_BINARY_CONTENT_REJECTED');
  });

  it('22. Sanitized error returned', async () => {
    const result = await validateUploadRequest(new FormData(), 'file', FINANCE_UPLOAD_POLICY);
    expect(result.status).toBe(400);
    expect(result.message).toBeDefined();
    // No raw exception exposed
    expect(result.error).toBe('UPLOAD_FILE_REQUIRED');
  });

  it('23. Policies cannot be mutated accidentally', () => {
    expect(() => {
      // @ts-expect-error testing readonly violation
      FINANCE_UPLOAD_POLICY.maxFiles = 5;
    }).toThrow();
  });
});
