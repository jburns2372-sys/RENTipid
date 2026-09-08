import 'dotenv/config';
import { del, get, put } from '@vercel/blob';
import { prisma } from '../src/lib/prisma';
import { getPrivateBlobCredentialOptions } from '../src/lib/storage/vercel-blob-storage-adapter';

const privateToken = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
const privateStoreId = process.env.PRIVATE_BLOB_STORE_ID;
const oidcToken = process.env.VERCEL_OIDC_TOKEN;
const targetEnvironment = process.env.DOCUMENT_STORAGE_TARGET_ENVIRONMENT;
const expectedBranchId = process.env.EXPECTED_NEON_BRANCH_ID;
const expectedEndpointId = process.env.EXPECTED_NEON_ENDPOINT_ID;
const expectedDatabaseName = process.env.EXPECTED_DATABASE_NAME;
const databaseUrl = process.env.DATABASE_URL || '';

function isVercelBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (
      url.hostname === 'blob.vercel-storage.com' ||
      url.hostname.endsWith('.blob.vercel-storage.com')
    );
  } catch {
    return false;
  }
}

function databaseIdentity(value: string) {
  try {
    return new URL(value).pathname.split('/')[1] || '';
  } catch {
    return '';
  }
}

function endpointIdentity(value: string) {
  try {
    return new URL(value).hostname.split('.')[0].replace(/-pooler$/, '');
  } catch {
    return '';
  }
}

async function main() {
  if (targetEnvironment !== 'preview') {
    throw new Error('DOCUMENT_STORAGE_TARGET_ENVIRONMENT=preview is required');
  }
  if (expectedBranchId !== 'br-shiny-feather-ap9y6mlb') {
    throw new Error('EXPECTED_NEON_BRANCH_ID must target the named Preview branch');
  }
  if (expectedEndpointId !== 'ep-soft-pine-ap1b22e5') {
    throw new Error('EXPECTED_NEON_ENDPOINT_ID must target the named Preview endpoint');
  }
  if (expectedDatabaseName !== 'rentipid_production') {
    throw new Error('EXPECTED_DATABASE_NAME=rentipid_production is required');
  }
  if (!databaseUrl || databaseUrl.includes('neon.tech') === false) {
    throw new Error('A Neon Preview DATABASE_URL is required');
  }
  if (databaseIdentity(databaseUrl) !== expectedDatabaseName) {
    throw new Error('DATABASE_URL does not target the expected Preview database');
  }
  if (endpointIdentity(databaseUrl) !== expectedEndpointId) {
    throw new Error('DATABASE_URL does not target the expected Preview endpoint');
  }
  if (!privateToken && !(privateStoreId && oidcToken)) {
    throw new Error('Private Blob credentials are required');
  }

  const identityRows = await prisma.$queryRawUnsafe<Array<{ current_database: string }>>('SELECT current_database()::text AS current_database');
  if (identityRows[0]?.current_database !== expectedDatabaseName) {
    throw new Error('Connected database identity does not match the expected Preview database');
  }

  const documents = await prisma.listingDocument.findMany({
    select: { id: true, file_path: true, file_type: true },
  });
  const managed = documents.filter((document) => isVercelBlobUrl(document.file_path));
  let migrated = 0;
  let alreadyPrivate = 0;
  let failed = 0;

  for (const [index, document] of managed.entries()) {
    try {
      let existingPrivate = null;
      try {
        existingPrivate = await get(document.file_path, { access: 'private', ...getPrivateBlobCredentialOptions(), useCache: false });
      } catch {
        // A public legacy object is expected to reject a private-access probe.
      }
      if (existingPrivate?.statusCode === 200) {
        alreadyPrivate += 1;
        continue;
      }

      const source = await fetch(document.file_path, { cache: 'no-store', redirect: 'error' });
      if (!source.ok || !source.body) throw new Error('public source unavailable');
      const bytes = Buffer.from(await source.arrayBuffer());
      const pathname = `private/documents/${document.id}`;
      const replacement = await put(pathname, bytes, {
        access: 'private',
        addRandomSuffix: false,
        contentType: document.file_type,
        ...getPrivateBlobCredentialOptions(),
      });
      const verified = await get(replacement.pathname, { access: 'private', ...getPrivateBlobCredentialOptions(), useCache: false });
      if (!verified || verified.statusCode !== 200) throw new Error('private copy verification failed');
      const anonymous = await fetch(replacement.url, { cache: 'no-store' });
      if (anonymous.ok) throw new Error('private copy is anonymously accessible');

      await prisma.listingDocument.update({ where: { id: document.id }, data: { file_path: replacement.pathname } });
      await del(document.file_path, { token: process.env.BLOB_READ_WRITE_TOKEN || privateToken });
      migrated += 1;
    } catch {
      failed += 1;
      console.error(`Document migration failed at item ${index + 1}`);
    }
  }

  console.log(JSON.stringify({ total: documents.length, managed: managed.length, migrated, alreadyPrivate, failed }));
  if (failed > 0) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
