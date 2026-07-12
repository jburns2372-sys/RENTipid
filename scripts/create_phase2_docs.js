const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '..', 'docs', 'azure-migration');
const adrDir = path.join(docsDir, 'adr');

if (!fs.existsSync(adrDir)) {
  fs.mkdirSync(adrDir, { recursive: true });
}

const archDoc = [
  "# Target Architecture",
  "",
  "## Current Architecture",
  "```mermaid",
  "graph TD",
  "    User-->Vercel[Vercel Next.js]",
  "    Vercel-->SQLite[(Local SQLite)]",
  "    Vercel-->VercelBlob[Vercel Blob Storage]",
  "    Vercel-->PayMongo[PayMongo Sandbox]",
  "```",
  "",
  "## Target Architecture",
  "```mermaid",
  "graph TD",
  "    User-->Vercel[Vercel Frontend]",
  "    Vercel-->AzAG[Azure API Gateway]",
  "    AzAG-->AzCA[Azure Container Apps API]",
  "    AzCA-->AzDB[(Azure PostgreSQL)]",
  "    AzCA-->AzBlob[Azure Blob Storage]",
  "    AzCA-->AzSB[Azure Service Bus]",
  "    AzCA-->PayMongo[PayMongo Production]",
  "```",
  "",
  "## Booking Flow",
  "```mermaid",
  "sequenceDiagram",
  "    participant User",
  "    participant Vercel",
  "    participant AzureAPI",
  "    participant DB",
  "    User->>Vercel: Request Booking",
  "    Vercel->>AzureAPI: POST /api/bookings",
  "    AzureAPI->>DB: Check Availability & Concurrency Lock",
  "    DB-->>AzureAPI: Lock Acquired",
  "    AzureAPI->>DB: Create Pending Booking Hold",
  "    AzureAPI-->>Vercel: 201 Created (Booking Hold)",
  "    Vercel-->>User: Proceed to Payment",
  "```"
].join('\n');

fs.writeFileSync(path.join(docsDir, '02-target-architecture.md'), archDoc);

const adrs = [
  { id: '01', title: 'Azure Container Apps Selection', desc: 'Azure Container Apps selected for serverless scaling, vnet integration, and native docker compatibility without k8s overhead.' },
  { id: '02', title: 'PostgreSQL Target', desc: 'Migrating from SQLite to Azure Database for PostgreSQL Flexible server to support multi-container concurrency.' },
  { id: '03', title: 'Blob Storage Design', desc: 'Using Azure Blob Storage with private containers and SAS tokens for secure KYC and listing image storage.' },
  { id: '04', title: 'Service Bus Design', desc: 'Using Azure Service Bus for reliable background tasks (e.g. notifications, booking expiry) to ensure exactly-once delivery guarantees.' },
  { id: '05', title: 'Authentication Strategy', desc: 'Retaining NextAuth v4 on Vercel frontend, while parsing NextAuth JWT natively on Azure API Gateway for secure backend RBAC.' },
  { id: '06', title: 'API Gateway Strategy', desc: 'Using Azure API Management (APIM) as a unified entry point to enforce rate-limiting, WAF rules, and routing.' },
  { id: '07', title: 'Payment Webhook Strategy', desc: 'PayMongo webhooks will route directly to an Azure endpoint, using idempotency keys to prevent duplicate financial ledgers.' },
  { id: '08', title: 'Booking Concurrency Strategy', desc: 'Using PostgreSQL row-level locking (SELECT FOR UPDATE) and transaction isolation to prevent double booking of active listings.' },
  { id: '09', title: 'Feature Flag Strategy', desc: 'Utilizing Azure App Configuration to manage central feature flags without requiring full redeployments.' },
  { id: '10', title: 'Emergency Freeze Enforcement', desc: 'Emergency freeze state will be a fast-read centralized flag in the database that short-circuits any financial POST request.' },
  { id: '11', title: 'Monitoring Strategy', desc: 'Implementing Azure Application Insights and Log Analytics, correlating frontend requests to backend operations using x-correlation-id headers.' },
  { id: '12', title: 'Infrastructure As Code Format', desc: 'Terraform (HCL) selected for IaC to ensure cloud-agnostic modularity and state consistency for Dev, Staging, and Prod.' },
  { id: '13', title: 'Region Selection', desc: 'Azure Southeast Asia (Singapore) selected to minimize latency for PayMongo and the expected user base.' },
  { id: '14', title: 'Disaster Recovery', desc: 'Configuring Geo-redundant backups for PostgreSQL and Blob Storage, targeting a secondary region for catastrophic failover.' },
  { id: '15', title: 'PWA and Capacitor Compatibility', desc: 'Implementing strict CORS policies on APIM and ensuring the frontend securely propagates JWT headers to avoid blocking mobile app requests.' }
];

adrs.forEach(adr => {
  const content = [
    "# ADR " + adr.id + ": " + adr.title,
    "",
    "## Context",
    "Rentipid is migrating to an Azure backend while maintaining Vercel frontend delivery.",
    "",
    "## Decision",
    adr.desc,
    "",
    "## Security Impact",
    "Enforces protected boundaries between the public internet and backend business logic.",
    "",
    "## Financial Impact",
    "Scales to zero (where supported) to minimize idle costs, standard Azure pricing applies.",
    "",
    "## Reversibility",
    "Medium. Reverting would require re-pointing DNS and re-architecting Next.js API routes back to serverless functions."
  ].join('\n');
  fs.writeFileSync(path.join(adrDir, adr.id + '-' + adr.title.toLowerCase().replace(/ /g, '-') + '.md'), content);
});

console.log("Phase 2 documents generated.");
