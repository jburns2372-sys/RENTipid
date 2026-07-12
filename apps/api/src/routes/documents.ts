import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generateUploadSasUrl } from '../services/blobService';
import crypto from 'crypto';

const router = Router();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

router.post('/upload-url', requireAuth, (req, res) => {
  try {
    const { fileName, mimeType, fileSize, documentType } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Validation Rules
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: 'Unsupported file type. Use JPEG, PNG, or PDF.' });
    }
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 5MB limit.' });
    }

    // 2. Routing logic for private containers
    const containerName = documentType === 'KYC' ? 'kyc-documents' : 'listing-media';
    
    // Prevent directory traversal by sanitizing name and generating a UUID
    const safeExtension = fileName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '');
    const uniqueFileName = `${req.user.id}/${crypto.randomUUID()}.${safeExtension}`;

    // 3. Generate SAS Url (Write-only)
    const sasUrl = generateUploadSasUrl(containerName, uniqueFileName, 15);

    res.status(200).json({
      uploadUrl: sasUrl,
      blobPath: `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${uniqueFileName}`
    });
  } catch (error: any) {
    console.error('SAS Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate secure upload token' });
  }
});

export default router;