# Production Cloud Storage Migration Guide

Currently, RENTipid relies on the `LocalStorageAdapter` which writes files directly to the server's disk (e.g., `public/uploads` for public images and `private-uploads/` for private, authenticated files like KYC).

In a production environment (like Vercel or horizontally scaled servers), the local filesystem is ephemeral. You **must** migrate to a Cloud Storage provider (AWS S3, Cloudflare R2, or Supabase Storage).

## 1. Select a Provider
Configure your `.env` to define the active provider:
```env
STORAGE_PROVIDER="r2" # or "s3", "supabase"
STORAGE_BUCKET_NAME="rentipid-prod"
STORAGE_ACCESS_KEY="your_access_key"
STORAGE_SECRET_KEY="your_secret_key"
STORAGE_REGION="auto"
```

## 2. Implement the Adapter
The placeholder adapters are located in `src/lib/storage/`. 
To activate one (e.g. R2):
1. Install the AWS SDK: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. Open `src/lib/storage/r2-storage-adapter.ts`.
3. Implement the `uploadFile`, `deleteFile`, and `getSignedUrl` methods using the S3 client pointed to the R2 endpoint.

## 3. Update the Storage Service Factory
In `src/lib/storage/storage-service.ts`, uncomment the imports for your chosen adapter and remove the `throw` placeholders in the switch statement.

## 4. Security Rules for Cloud Storage
- **Public Files (Listing Photos)**: Should be uploaded with `public-read` ACL (or bucket policy) so they can be served directly from a CDN domain.
- **Private Files (KYC, Evidence, Contracts)**: Must be uploaded as `private`. To view them, the system will use the `getSignedUrl` method to generate a temporary expiring URL.
