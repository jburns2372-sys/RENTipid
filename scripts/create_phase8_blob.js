const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const appsApiDir = path.join(rootDir, 'apps', 'api');

// Create directories
fs.mkdirSync(path.join(appsApiDir, 'src', 'services'), { recursive: true });
fs.mkdirSync(path.join(appsApiDir, 'src', 'routes'), { recursive: true });

// 1. blobService.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'services', 'blobService.ts'), [
  "import {",
  "  BlobServiceClient,",
  "  StorageSharedKeyCredential,",
  "  generateBlobSASQueryParameters,",
  "  BlobSASPermissions",
  "} from '@azure/storage-blob';",
  "",
  "const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || '';",
  "const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || '';",
  "",
  "const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);",
  "const blobServiceClient = new BlobServiceClient(",
  "  `https://${accountName}.blob.core.windows.net`,",
  "  sharedKeyCredential",
  ");",
  "",
  "export const generateUploadSasUrl = (containerName: string, blobName: string, minutesToExpire: number = 10): string => {",
  "  const containerClient = blobServiceClient.getContainerClient(containerName);",
  "  const blobClient = containerClient.getBlobClient(blobName);",
  "",
  "  const startsOn = new Date();",
  "  startsOn.setMinutes(startsOn.getMinutes() - 2); // Prevent clock skew issues",
  "",
  "  const expiresOn = new Date();",
  "  expiresOn.setMinutes(expiresOn.getMinutes() + minutesToExpire);",
  "",
  "  const sasToken = generateBlobSASQueryParameters({",
  "    containerName,",
  "    blobName,",
  "    permissions: BlobSASPermissions.parse('cw'), // create and write only",
  "    startsOn,",
  "    expiresOn",
  "  }, sharedKeyCredential).toString();",
  "",
  "  return `${blobClient.url}?${sasToken}`;",
  "};"
].join('\\n'));

// 2. documents.ts
fs.writeFileSync(path.join(appsApiDir, 'src', 'routes', 'documents.ts'), [
  "import { Router } from 'express';",
  "import { requireAuth } from '../middleware/auth';",
  "import { generateUploadSasUrl } from '../services/blobService';",
  "import crypto from 'crypto';",
  "",
  "const router = Router();",
  "",
  "const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];",
  "const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB",
  "",
  "router.post('/upload-url', requireAuth, (req, res) => {",
  "  try {",
  "    const { fileName, mimeType, fileSize, documentType } = req.body;",
  "",
  "    if (!req.user) {",
  "      return res.status(401).json({ error: 'Unauthorized' });",
  "    }",
  "",
  "    // 1. Validation Rules",
  "    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {",
  "      return res.status(400).json({ error: 'Unsupported file type. Use JPEG, PNG, or PDF.' });",
  "    }",
  "    if (fileSize > MAX_FILE_SIZE) {",
  "      return res.status(400).json({ error: 'File size exceeds 5MB limit.' });",
  "    }",
  "",
  "    // 2. Routing logic for private containers",
  "    const containerName = documentType === 'KYC' ? 'kyc-documents' : 'listing-media';",
  "    ",
  "    // Prevent directory traversal by sanitizing name and generating a UUID",
  "    const safeExtension = fileName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '');",
  "    const uniqueFileName = `${req.user.id}/${crypto.randomUUID()}.${safeExtension}`;",
  "",
  "    // 3. Generate SAS Url (Write-only)",
  "    const sasUrl = generateUploadSasUrl(containerName, uniqueFileName, 15);",
  "",
  "    res.status(200).json({",
  "      uploadUrl: sasUrl,",
  "      blobPath: `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${uniqueFileName}`",
  "    });",
  "  } catch (error: any) {",
  "    console.error('SAS Generation Error:', error);",
  "    res.status(500).json({ error: 'Failed to generate secure upload token' });",
  "  }",
  "});",
  "",
  "export default router;"
].join('\\n'));

// 3. Update package.json
const pkgPath = path.join(appsApiDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies['@azure/storage-blob'] = '^12.17.0';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

// 4. Mount in index.ts
const indexPath = path.join(appsApiDir, 'src', 'index.ts');
let indexContent = fs.readFileSync(indexPath, 'utf8');
if (!indexContent.includes('documentRoutes')) {
  indexContent = indexContent.replace(
    "import bookingRoutes from './routes/bookings';",
    "import bookingRoutes from './routes/bookings';\\nimport documentRoutes from './routes/documents';"
  );
  indexContent = indexContent.replace(
    "app.use('/bookings', bookingRoutes);",
    "app.use('/bookings', bookingRoutes);\\napp.use('/documents', documentRoutes);"
  );
  fs.writeFileSync(indexPath, indexContent);
}

console.log("Phase 8 Blob Storage integration scaffolded.");
