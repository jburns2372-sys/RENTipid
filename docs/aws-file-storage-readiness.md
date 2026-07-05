# AWS File Storage Readiness

RENTipid handles two distinct classes of files: Public and Private.

## Current State (Local Storage)
For the Phase 19B Live Payment Pilot (Option A Deployment), files are stored directly on the EC2 instance's local EBS volume.
- **Public Uploads:** Stored in `/public/uploads/` (Listing photos, profile pictures).
- **Private Uploads:** Stored in `/private-uploads/` (KYC documents, finance proof, damage claims).

**Critical Rule:** Private files must NEVER be served directly via Nginx or a public URL. They are only accessible via authenticated Next.js API routes (e.g., `/api/documents/[id]`).

## Target State (S3 Storage)
For Option B (Hardened Production), all file storage must migrate to Amazon S3.

**S3 Configuration Plan:**
1. Create two separate S3 buckets: `rentipid-public` and `rentipid-private`.
2. `rentipid-public`: Allow public read access (or route through CloudFront).
3. `rentipid-private`: Block all public access. Files are accessed via presigned URLs generated securely by the Next.js backend for authenticated/authorized users only.
4. Update `.env.production` to `STORAGE_PROVIDER=s3` and inject S3 credentials.

## Storage Backup Requirement
While in local storage mode, the `public/uploads` and `private-uploads` directories must be backed up daily via an automated cron job syncing the folders to an external S3 bucket, preventing data loss if the EC2 instance terminates.
