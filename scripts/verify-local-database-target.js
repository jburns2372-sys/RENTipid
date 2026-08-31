#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const OUTPUT_KEYS = [
  'DATABASE_URL_PRESENT',
  'HOST_CLASS',
  'DATABASE_CONNECTION',
  'DATABASE_IDENTITY_QUERY',
  'LOCAL_DATABASE_IDENTITY_MATCH',
  'PREVIEW_DATABASE_EXCLUDED',
  'PRODUCTION_DATABASE_EXCLUDED',
  'TARGET_ENVIRONMENT_CLASS',
  'LOCAL_DATABASE_TARGET_PROVEN',
];

const result = {
  DATABASE_URL_PRESENT: 'NO',
  HOST_CLASS: 'UNKNOWN',
  DATABASE_CONNECTION: 'FAIL',
  DATABASE_IDENTITY_QUERY: 'FAIL',
  LOCAL_DATABASE_IDENTITY_MATCH: 'NO',
  PREVIEW_DATABASE_EXCLUDED: 'NO',
  PRODUCTION_DATABASE_EXCLUDED: 'NO',
  TARGET_ENVIRONMENT_CLASS: 'UNKNOWN',
  LOCAL_DATABASE_TARGET_PROVEN: 'NO',
};

const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1']);
const remoteHostPattern =
  /(neon|azure|amazonaws|aws|rds|supabase|railway|render|vercel|cloud|digitalocean|heroku)/i;
const previewMarkerPattern = /(?:^|[_-])(preview|staging|branch|vercel)(?:$|[_-])/i;
const productionMarkerPattern = /(?:^|[_-])(prod|production|live)(?:$|[_-])/i;
const productionDatabaseNames = new Set(['rentipid_db']);
const establishedLocalDatabasePattern =
  /^(?:rentipid_test(?:_(?!prod(?:uction)?$)[a-z0-9_]+)?|rentipid_address(?:_(?!prod(?:uction)?$)[a-z0-9_]+)?)$/i;

function printAndExit(code) {
  for (const key of OUTPUT_KEYS) {
    console.log(`${key}: ${result[key]}`);
  }
  process.exit(code);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function repositoryComposeProvesLocalHostname(hostname) {
  const normalized = String(hostname || '').toLowerCase();
  if (!normalized) {
    return false;
  }

  let entries;
  try {
    entries = fs.readdirSync(process.cwd(), { withFileTypes: true });
  } catch {
    return false;
  }

  const composeFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^(?:docker-)?compose(?:[.-].*)?\.ya?ml$/i.test(name));

  const servicePattern = new RegExp(`^\\s{2,}${escapeRegExp(normalized)}:\\s*(?:#.*)?$`, 'im');
  const containerPattern = new RegExp(
    `^\\s*container_name:\\s*["']?${escapeRegExp(normalized)}["']?\\s*(?:#.*)?$`,
    'im',
  );

  return composeFiles.some((fileName) => {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), fileName), 'utf8').toLowerCase();
      return servicePattern.test(content) || containerPattern.test(content);
    } catch {
      return false;
    }
  });
}

function classifyHost(hostname) {
  const normalized = String(hostname || '').toLowerCase();

  if (loopbackHosts.has(normalized)) {
    return 'LOOPBACK';
  }

  if (remoteHostPattern.test(normalized)) {
    return 'REMOTE';
  }

  if (repositoryComposeProvesLocalHostname(normalized)) {
    return 'LOCAL_CONTAINER';
  }

  return 'UNKNOWN';
}

function hasPreviewMarker(hostname, databaseName) {
  return previewMarkerPattern.test(hostname) || previewMarkerPattern.test(databaseName);
}

function hasProductionMarker(hostname, databaseName) {
  return (
    productionMarkerPattern.test(hostname) ||
    productionMarkerPattern.test(databaseName) ||
    productionDatabaseNames.has(String(databaseName || '').toLowerCase())
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    printAndExit(1);
  }

  result.DATABASE_URL_PRESENT = 'YES';

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    printAndExit(1);
  }

  const hostname = parsed.hostname;
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  const hostClass = classifyHost(hostname);
  const localHostClass = hostClass === 'LOOPBACK' || hostClass === 'LOCAL_CONTAINER';
  const previewMarkerFound = hasPreviewMarker(hostname, databaseName);
  const productionMarkerFound = hasProductionMarker(hostname, databaseName);
  const previewExcluded = !previewMarkerFound && hostClass !== 'REMOTE';
  const productionExcluded = !productionMarkerFound && hostClass !== 'REMOTE';
  const expectedLocalName = establishedLocalDatabasePattern.test(databaseName);

  result.HOST_CLASS = hostClass;
  result.PREVIEW_DATABASE_EXCLUDED = previewExcluded ? 'YES' : 'NO';
  result.PRODUCTION_DATABASE_EXCLUDED = productionExcluded ? 'YES' : 'NO';

  if (previewMarkerFound) {
    result.TARGET_ENVIRONMENT_CLASS = 'PREVIEW';
  }

  if (productionMarkerFound) {
    result.TARGET_ENVIRONMENT_CLASS = 'PRODUCTION';
  }

  if (!localHostClass || !previewExcluded || !productionExcluded || !expectedLocalName) {
    printAndExit(1);
  }

  let Client;
  try {
    ({ Client } = require('pg'));
  } catch {
    printAndExit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    result.DATABASE_CONNECTION = 'PASS';

    const response = await client.query('SELECT current_database() AS database_name;');
    result.DATABASE_IDENTITY_QUERY = 'PASS';

    const connectedDatabaseName =
      response && response.rows && response.rows[0] ? String(response.rows[0].database_name || '') : '';

    const identityMatches = connectedDatabaseName === databaseName && expectedLocalName;
    result.LOCAL_DATABASE_IDENTITY_MATCH = identityMatches ? 'YES' : 'NO';

    const proven =
      localHostClass &&
      previewExcluded &&
      productionExcluded &&
      identityMatches &&
      result.DATABASE_CONNECTION === 'PASS' &&
      result.DATABASE_IDENTITY_QUERY === 'PASS';

    if (proven) {
      result.TARGET_ENVIRONMENT_CLASS = 'LOCAL';
      result.LOCAL_DATABASE_TARGET_PROVEN = 'YES';
      printAndExit(0);
    }

    result.TARGET_ENVIRONMENT_CLASS = 'UNKNOWN';
    result.LOCAL_DATABASE_TARGET_PROVEN = 'NO';
    printAndExit(1);
  } catch {
    printAndExit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch(() => {
  printAndExit(1);
});
