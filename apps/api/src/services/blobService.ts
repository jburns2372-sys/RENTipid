import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

export const generateUploadSasUrl = (containerName: string, blobName: string, minutesToExpire: number = 10): string => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  const startsOn = new Date();
  startsOn.setMinutes(startsOn.getMinutes() - 2); // Prevent clock skew issues

  const expiresOn = new Date();
  expiresOn.setMinutes(expiresOn.getMinutes() + minutesToExpire);

  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse('cw'), // create and write only
    startsOn,
    expiresOn
  }, sharedKeyCredential).toString();

  return `${blobClient.url}?${sasToken}`;
};