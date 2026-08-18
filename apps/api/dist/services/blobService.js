"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUploadSasUrl = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';
const sharedKeyCredential = new storage_blob_1.StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new storage_blob_1.BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential);
const generateUploadSasUrl = (containerName, blobName, minutesToExpire = 10) => {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    const startsOn = new Date();
    startsOn.setMinutes(startsOn.getMinutes() - 2); // Prevent clock skew issues
    const expiresOn = new Date();
    expiresOn.setMinutes(expiresOn.getMinutes() + minutesToExpire);
    const sasToken = (0, storage_blob_1.generateBlobSASQueryParameters)({
        containerName,
        blobName,
        permissions: storage_blob_1.BlobSASPermissions.parse('cw'), // create and write only
        startsOn,
        expiresOn
    }, sharedKeyCredential).toString();
    return `${blobClient.url}?${sasToken}`;
};
exports.generateUploadSasUrl = generateUploadSasUrl;
