import { generateUploadSasUrl } from '../blobService';
import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('@azure/identity');
jest.mock('@azure/storage-blob');

describe('blobService', () => {
  const mockAccountName = 'testaccount';
  let originalEnv: NodeJS.ProcessEnv;
  let mockFetch: jest.SpyInstance | undefined;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, AZURE_STORAGE_ACCOUNT_NAME: mockAccountName };
    jest.clearAllMocks();

    (generateBlobSASQueryParameters as jest.Mock).mockReturnValue({
      toString: () => 'mock-sas-token'
    });
    
    (BlobSASPermissions.parse as jest.Mock).mockReturnValue('mock-permissions-object');
    
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-31T00:00:00Z'));
    
    if (typeof globalThis.fetch === 'function') {
      mockFetch = jest.spyOn(globalThis, 'fetch');
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
    if (mockFetch) {
      mockFetch.mockRestore();
    }
    jest.restoreAllMocks();
  });

  it('missing account name rejected', async () => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = '';
    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.toThrow('Storage account name is not configured');
    expect(DefaultAzureCredential).not.toHaveBeenCalled();
  });

  it('whitespace account name rejected', async () => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = '   ';
    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.toThrow('Storage account name is not configured');
  });

  it('account name shorter than 3 characters rejected', async () => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = 'ab';
    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.toThrow('Invalid storage account name');
  });

  it('account name longer than 24 characters rejected', async () => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = 'a'.repeat(25);
    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.toThrow('Invalid storage account name');
  });

  it('uppercase account name rejected', async () => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = 'TestAccount';
    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.toThrow('Invalid storage account name');
  });

  it('account name containing punctuation rejected', async () => {
    process.env.AZURE_STORAGE_ACCOUNT_NAME = 'test-account';
    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.toThrow('Invalid storage account name');
  });

  it('empty container name rejected', async () => {
    await expect(generateUploadSasUrl('', 'blob.txt')).rejects.toThrow('Container name is required');
  });

  it('whitespace container name rejected', async () => {
    await expect(generateUploadSasUrl('   ', 'blob.txt')).rejects.toThrow('Container name is required');
  });

  it('empty Blob name rejected', async () => {
    await expect(generateUploadSasUrl('container', '')).rejects.toThrow('Blob name is required');
  });

  it('whitespace Blob name rejected', async () => {
    await expect(generateUploadSasUrl('container', '   ')).rejects.toThrow('Blob name is required');
  });

  it('zero-minute lifetime rejected', async () => {
    await expect(generateUploadSasUrl('container', 'blob.txt', 0)).rejects.toThrow('Invalid lifetime');
  });

  it('negative lifetime rejected', async () => {
    await expect(generateUploadSasUrl('container', 'blob.txt', -5)).rejects.toThrow('Invalid lifetime');
  });

  it('lifetime above 15 rejected', async () => {
    await expect(generateUploadSasUrl('container', 'blob.txt', 16)).rejects.toThrow('Invalid lifetime');
  });

  it('fractional lifetime rejected', async () => {
    await expect(generateUploadSasUrl('container', 'blob.txt', 5.5)).rejects.toThrow('Invalid lifetime');
  });

  it('non-finite lifetime rejected', async () => {
    await expect(generateUploadSasUrl('container', 'blob.txt', Infinity)).rejects.toThrow('Invalid lifetime');
  });

  it('sanitizes Azure SDK errors and original Azure SDK error text is not exposed', async () => {
    (BlobServiceClient as unknown as jest.Mock).mockImplementation(() => ({
      getUserDelegationKey: jest.fn().mockRejectedValue(new Error('Sensitive Azure Error'))
    }));

    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.toThrow('Failed to generate secure upload token');
    await expect(generateUploadSasUrl('container', 'blob.txt')).rejects.not.toThrow('Sensitive Azure Error');
  });

  describe('successful generation', () => {
    let mockGetUserDelegationKey: jest.Mock;
    
    beforeEach(() => {
      mockGetUserDelegationKey = jest.fn().mockResolvedValue({});
      const mockGetBlobClient = jest.fn().mockReturnValue({ url: 'https://test.blob' });
      const mockGetContainerClient = jest.fn().mockReturnValue({ getBlobClient: mockGetBlobClient });
      
      (BlobServiceClient as unknown as jest.Mock).mockImplementation(() => ({
        getUserDelegationKey: mockGetUserDelegationKey,
        getContainerClient: mockGetContainerClient
      }));
    });

    it('generates a SAS token using user delegation with default 10-minute lifetime', async () => {
      const result = await generateUploadSasUrl('test-container', 'test-blob.txt');

      expect(DefaultAzureCredential).toHaveBeenCalled();
      expect(BlobServiceClient).toHaveBeenCalledWith(
        'https://' + mockAccountName + '.blob.core.windows.net',
        expect.any(DefaultAzureCredential)
      );

      expect(mockGetUserDelegationKey).toHaveBeenCalled();
      const [startsOn, expiresOn] = mockGetUserDelegationKey.mock.calls[0];
      
      expect(startsOn.getTime()).toBe(new Date('2026-07-30T23:58:00Z').getTime()); // Test time minus 2 mins
      expect(expiresOn.getTime()).toBe(new Date('2026-07-31T00:10:00Z').getTime()); // Test time plus 10 mins (default)
      
      expect(BlobSASPermissions.parse).toHaveBeenCalledTimes(1);
      expect(BlobSASPermissions.parse).toHaveBeenCalledWith('cw');

      expect(generateBlobSASQueryParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          containerName: 'test-container',
          blobName: 'test-blob.txt',
          permissions: 'mock-permissions-object',
          startsOn: startsOn,
          expiresOn: expiresOn
        }),
        expect.anything(),
        mockAccountName
      );

      expect(result).toBe('https://test.blob?mock-sas-token');
      
      if (mockFetch) {
        expect(mockFetch).not.toHaveBeenCalled();
      }
    });

    it('one-minute lifetime succeeds', async () => {
      await generateUploadSasUrl('test-container', 'test-blob.txt', 1);
      const [startsOn, expiresOn] = mockGetUserDelegationKey.mock.calls[0];
      
      expect(startsOn.getTime()).toBe(new Date('2026-07-30T23:58:00Z').getTime());
      expect(expiresOn.getTime()).toBe(new Date('2026-07-31T00:01:00Z').getTime());
    });

    it('fifteen-minute lifetime succeeds', async () => {
      await generateUploadSasUrl('test-container', 'test-blob.txt', 15);
      const [startsOn, expiresOn] = mockGetUserDelegationKey.mock.calls[0];
      
      expect(startsOn.getTime()).toBe(new Date('2026-07-30T23:58:00Z').getTime());
      expect(expiresOn.getTime()).toBe(new Date('2026-07-31T00:15:00Z').getTime());
    });
    
    it('no console statements and no global network request', async () => {
      const consoleSpyLog = jest.spyOn(console, 'log');
      const consoleSpyError = jest.spyOn(console, 'error');
      const consoleSpyWarn = jest.spyOn(console, 'warn');
      
      await generateUploadSasUrl('test-container', 'test-blob.txt', 10);
      
      expect(consoleSpyLog).not.toHaveBeenCalled();
      expect(consoleSpyError).not.toHaveBeenCalled();
      expect(consoleSpyWarn).not.toHaveBeenCalled();
      
      if (mockFetch) {
        expect(mockFetch).not.toHaveBeenCalled();
      }
    });
    
    it('proves no account-level SAS generator is imported or referenced', () => {
      const filePath = path.join(__dirname, '..', 'blobService.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('generateAccountSASQueryParameters');
    });
  });
});
