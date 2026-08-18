const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const repoRoot = path.resolve(__dirname, '..', '..');
const outputDir = __dirname;
const markdownPath = path.join(outputDir, 'RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.md');
const htmlPath = path.join(outputDir, 'RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.html');
const pdfPath = path.join(outputDir, 'RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.pdf');
const checksumPath = path.join(outputDir, 'RENTipid-COMPLETE-SYSTEM-DOCUMENTATION.sha256');

const rel = (...parts) => path.join(repoRoot, ...parts);
const read = (file) => fs.readFileSync(rel(...file.split('/')), 'utf8').replace(/^\uFEFF/, '');

function readTextFile(absolute) {
  const bytes = fs.readFileSync(absolute);
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) return bytes.subarray(2).toString('utf16le');
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    const swapped = Buffer.alloc(bytes.length - 2);
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      swapped[index - 2] = bytes[index + 1];
      swapped[index - 1] = bytes[index];
    }
    return swapped.toString('utf16le');
  }
  return bytes.toString('utf8').replace(/^\uFEFF/, '');
}

function walk(dir, predicate = () => true) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', 'coverage', 'test-results', 'playwright-report'].includes(entry.name)) continue;
      result.push(...walk(full, predicate));
    } else if (predicate(full)) result.push(full);
  }
  return result.sort((a, b) => a.localeCompare(b));
}

function posixRelative(file) {
  return path.relative(repoRoot, file).replaceAll('\\', '/');
}

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return 'UNAVAILABLE';
  }
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
}

function shiftHeadings(markdown, amount = 1) {
  let inCode = false;
  return stripFrontmatter(markdown).split(/\r?\n/).map((line) => {
    if (line.startsWith('```')) {
      inCode = !inCode;
      return line;
    }
    if (inCode) return line;
    const match = /^(#{1,5})(\s+.*)$/.exec(line);
    if (!match) return line;
    return `${'#'.repeat(Math.min(6, match[1].length + amount))}${match[2]}`;
  }).join('\n');
}

function sourceSection(title, file, note = '') {
  const absolute = rel(...file.split('/'));
  if (!fs.existsSync(absolute)) {
    return `# ${title}\n\n> Source unavailable at generation time: \`${file}\`.\n`;
  }
  return [
    `# ${title}`,
    '',
    note ? `> ${note}` : '',
    note ? '' : '',
    `Source: \`${file}\``,
    '',
    shiftHeadings(readTextFile(absolute), 1),
    '',
  ].join('\n');
}

function markdownList(values) {
  return values.map((value) => `- \`${value}\``).join('\n');
}

function currentInventory() {
  const pages = walk(rel('src', 'app'), (file) => file.endsWith(`${path.sep}page.tsx`)).map(posixRelative);
  const rootApis = walk(rel('src', 'app', 'api'), (file) => file.endsWith(`${path.sep}route.ts`)).map(posixRelative);
  const azureRoutes = walk(rel('apps', 'api', 'src', 'routes'), (file) => file.endsWith('.ts') && !file.includes(`${path.sep}__tests__${path.sep}`)).map(posixRelative);
  const tests = walk(rel('tests'), (file) => /\.(test|spec)\.(ts|tsx|js)$/.test(file)).map(posixRelative);
  const migrations = fs.existsSync(rel('prisma', 'migrations'))
    ? fs.readdirSync(rel('prisma', 'migrations'), { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
    : [];
  const schema = read('prisma/schema.prisma');
  const models = [...schema.matchAll(/^model\s+(\w+)/gm)].map((match) => match[1]);
  const enums = [...schema.matchAll(/^enum\s+(\w+)/gm)].map((match) => match[1]);
  const components = walk(rel('src', 'components'), (file) => /\.(ts|tsx)$/.test(file)).map(posixRelative);
  const libraries = walk(rel('src', 'lib'), (file) => /\.(ts|tsx)$/.test(file)).map(posixRelative);
  return { pages, rootApis, azureRoutes, tests, migrations, models, enums, components, libraries };
}

function environmentNames() {
  const names = new Set();
  const templateFiles = ['.env.example', '.env.production.example', '.env.preview'];
  for (const file of templateFiles) {
    const absolute = rel(file);
    if (!fs.existsSync(absolute)) continue;
    for (const line of fs.readFileSync(absolute, 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z][A-Z0-9_]*)=/.exec(line.trim());
      if (match) names.add(match[1]);
    }
  }
  const sourceFiles = [
    ...walk(rel('src'), (file) => /\.(ts|tsx|js|mjs)$/.test(file)),
    ...walk(rel('apps'), (file) => /\.(ts|tsx|js|mjs)$/.test(file) && !file.includes(`${path.sep}dist${path.sep}`)),
  ];
  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) names.add(match[1]);
  }
  return [...names].sort();
}

function dependencyRows() {
  const packages = [
    ['Frontend/root', 'package.json'],
    ['Azure API', 'apps/api/package.json'],
    ['Azure worker', 'apps/worker/package.json'],
  ];
  const rows = [];
  for (const [surface, file] of packages) {
    const absolute = rel(...file.split('/'));
    if (!fs.existsSync(absolute)) continue;
    const pkg = JSON.parse(fs.readFileSync(absolute, 'utf8'));
    for (const [name, version] of Object.entries({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) })) {
      rows.push(`| ${surface} | \`${name}\` | \`${version}\` |`);
    }
  }
  return rows.sort().join('\n');
}

function diagramAtlas() {
  const titles = [
    'System context', 'User and role ecosystem', 'Vercel and Azure architecture direction', 'Repository runtime transition',
    'Renter journey', 'Provider journey', 'Listing lifecycle', 'Booking lifecycle', 'Agreement lifecycle',
    'Payment webhook reconciliation', 'Deposit, refund, and payout', 'Inspection, claim, and dispute',
    'KYC and business verification', 'SOC event to response', 'Detection and alert flow',
    'Incident approval, execution, and rollback', 'Emergency freeze', 'AI and Digital Human architecture',
    'AI tool gateway', 'AI support-case lifecycle', 'Database domain map', 'API integration map',
    'PWA and Capacitor architecture', 'Monitoring, backup, and recovery', 'Phase and freeze timeline',
  ];
  return titles.map((title, index) => {
    const number = String(index + 1).padStart(2, '0');
    const files = fs.readdirSync(rel('docs', 'final-documentation', '09-DIAGRAMS', 'rendered-png'));
    const file = files.find((name) => name.startsWith(`${number}-`));
    return [
      `## Diagram ${number} — ${title}`,
      '',
      file ? `![${title}](../final-documentation/09-DIAGRAMS/rendered-png/${file})` : `> Rendered diagram ${number} not found.`,
      '',
    ].join('\n');
  }).join('\n');
}

function buildMarkdown() {
  const inventory = currentInventory();
  const head = git('rev-parse', 'HEAD');
  const branch = git('branch', '--show-current');
  const dirtyLines = git('status', '--short').split(/\r?\n/).filter(Boolean);
  const rootPackage = JSON.parse(read('package.json'));

  const front = `# RENTipid Complete System Documentation

## Document Control

| Field | Value |
| --- | --- |
| Document | Complete, systematic, comprehensive RENTipid system documentation |
| Edition | 2.0 — current repository reconciliation edition |
| Generated | 13 August 2026 |
| Repository | RENTipid |
| Branch | \`${branch}\` |
| Inspected HEAD | \`${head}\` |
| Worktree | DIRTY — ${dirtyLines.length} reported status entries; pre-existing and generated changes preserved |
| Architecture direction | Vercel frontend with Azure backend/services; partially split implementation |
| External verification | Not performed; cloud, production database, DNS, payment, insurer, KYC, AI, and media-provider state not inferred |
| Payment activation | NOT AUTHORIZED; Phase 19 remains COMPLETE/NO-GO/FROZEN |
| Database production migration | Pending separate Owner decision |
| Classification | RENTipid internal engineering, product, operations, security, privacy, and training reference |

## Purpose and Audience

This volume documents the complete RENTipid platform: product scope, actors, user journeys, modules, screens, APIs, services, database, integrations, configuration, security, privacy, SOC, AI, insurance, deployment, operations, recovery, testing, governance, training, limitations, and handover. It is intended for the Owner, product and engineering teams, renters, providers, administrators, finance, compliance, SOC, privacy personnel, operators, testers, and future maintainers.

The document consolidates previously frozen manuals and registers but does not promote historical plans, local definitions, route shells, mocks, readiness screens, or infrastructure-as-code into proof of a live production service. Current code is authoritative for implementation; accepted closure records are authoritative for historical status; explicitly reserved Owner decisions remain reserved.

## How This Edition Is Organized

1. Current-state executive reconciliation and system map.
2. The complete 248-chapter master manual.
3. Role-specific user, operator, technical, security, developer, phase, and training manuals.
4. Full current AI/Digital Human and Insurance module documentation.
5. Privacy and profile-management controlled supplements.
6. Complete working registers and direct current inventories.
7. Twenty-five architecture and workflow diagrams.
8. Source, validation, limitations, and handover guidance.

# Volume I — Current-State Executive Reconciliation

## Current Implementation Baseline

| Metric | Current count |
| --- | ---: |
| Next.js page routes | ${inventory.pages.length} |
| Root Next.js API route handlers | ${inventory.rootApis.length} |
| Azure API route source files | ${inventory.azureRoutes.length} |
| Prisma models | ${inventory.models.length} |
| Prisma enums | ${inventory.enums.length} |
| Prisma migration directories | ${inventory.migrations.length} |
| Test/spec files under \`tests\` | ${inventory.tests.length} |
| Source components | ${inventory.components.length} |
| Source library files | ${inventory.libraries.length} |
| Next.js | \`${rootPackage.dependencies.next}\` |
| React | \`${rootPackage.dependencies.react}\` |
| Prisma client | \`${rootPackage.dependencies['@prisma/client']}\` |

## System Mission

RENTipid is a multi-role rental marketplace that coordinates discovery, provider onboarding, listings, availability, booking, agreements, turnover, inspection, payments, deposits, finance records, claims, disputes, insurance foundations, reviews, notifications, marketing, privacy, autonomous support, administration, and a security operations center. The system emphasizes ownership, state-machine integrity, evidence, separation of duties, deterministic financial and policy boundaries, reversible security response, and controlled release governance.

## Principal Actors

| Actor | Primary scope | Prohibited inference |
| --- | --- | --- |
| Guest | Public discovery, guidance, legal/privacy, registration/login | No private or administrative authority |
| Renter | Own profile, bookings, agreements, inspections, claims, receipts, reviews | No provider/admin/finance/SOC mutation |
| Individual Provider | Own listings, bookings, turnover, claims, ledger/payout views | No publication/compliance/finance override |
| Business Provider | Business-scoped marketplace and marketing workflows | No inherited admin authority |
| Admin | Categories, bookings, disputes, support, UAT, marketing, AI settings/logs | No automatic finance/compliance/SOC-supervisor authority |
| Finance Admin | Payments, reconciliation, refunds, deposits, payouts, settlement evidence | No live-money activation outside approved gate |
| Compliance Admin | KYC, documents, listing compliance, policy evidence | Minimum necessary access only |
| SOC Analyst | Event/alert triage, cases, evidence, response requests | Cannot self-approve or exceed grants |
| SOC Supervisor | Approval, grants, execution/rollback oversight | Separation of duties remains mandatory |
| Super Admin | Broad platform controls and visibility | Cannot bypass dual control, NO-GO, privacy, or reserved Owner decisions |

## Architecture and Runtime Truth

The accepted target is a Next.js/Vercel frontend with extracted Azure API and worker services, PostgreSQL/Prisma, Blob Storage, Key Vault/managed identity, Application Insights, Azure AI Search/OpenAI where activated, and provider-neutral external adapters. The repository remains partially split: root App Router APIs coexist with \`apps/api\` and \`apps/worker\`. Each handler must be classified before change or retirement.

No local artifact proves that Azure resources are provisioned, migrations are applied to production, DNS/traffic has cut over, or external provider accounts are active. Terraform describes desired state only.

## Material Changes Since Master Manual 1.1

| Area | Older July manual state | Current reconciliation |
| --- | --- | --- |
| Repository baseline | HEAD \`5804d4c...\`, 31 July 2026 | HEAD \`${head}\`, 13 August 2026 |
| Profile management | Read-only with edit limitation | A later profile/admin-profile program records phases 0–15 completed, accepted, closed, and frozen; field governance and APIs/UI exist. |
| Privacy | General privacy workflows | Privacy Module v1 records 22 mandatory controls proven, 10 approved deferrals, 34 out of scope, manual retention, production automated deletion disabled, DPO registration pending, and no deployment. |
| Insurance | General model direction | TRU-01 is a provider-neutral technical foundation closed/frozen/safely shelved; live insurer, issuance, claims, money movement, and production activation remain disabled. |
| AI/Digital Human | High-level boundaries | A detailed v1 foundation and closure record exists, but current frontend chat route returns 410, inference/media paths are mock/simulated, real provider is pending, and important shared-core files are untracked. |
| Database | 79 models in older registry | Current schema contains ${inventory.models.length} models and ${inventory.enums.length} enums across ${inventory.migrations.length} migrations. |
| Routes/tests | 163 pages / 142 test files in older registry | Current direct inventory finds ${inventory.pages.length} pages, ${inventory.rootApis.length} root API handlers, and ${inventory.tests.length} test/spec files. Counts are inventory facts, not pass status. |

## Non-Negotiable Current Boundaries

- Live payment activation remains prohibited unless a new exact authorization changes Phase 19's NO-GO freeze.
- Production migration, deployment, traffic, and DNS actions require separate authority and external evidence.
- Insurance is a non-live shelved foundation; no policy promise, premium, insurer, or coverage is live.
- Digital Human is not a live media provider in the inspected workspace.
- Automated privacy retention/deletion is deferred; the approved v1 process is manual and governed.
- A route, model, tool, Terraform resource, test file, or historical PASS is not by itself proof of live end-to-end operation.
- The working tree is dirty. Existing changes belong to their authors and are not silently absorbed into a release.

## Major Module Map

| Domain | Core capability |
| --- | --- |
| Foundation | Next.js shell, TypeScript, design system, environment/configuration, health, logging |
| Identity | Registration, login, sessions, MFA/password recovery, profiles, roles, addresses |
| Provider and KYC | Individual/business onboarding, documents, verification, activation |
| Marketplace | Categories, listings, media, prohibited items, search, discovery, availability |
| Rental | Booking, pricing, agreements, turnover, return, cancellation, history |
| Money | Checkout, provider gateway events, webhook integrity, ledger, deposits, refunds, payouts, reconciliation |
| Trust | Insurance foundation, inspection evidence, claims, disputes, reviews/reputation |
| Communication | Notifications, support tickets, feedback/issues, AI Help and Digital Human foundation |
| Marketing | Campaigns, posts, provider opt-in, promotion assets, social connections |
| Administration | Admin, Finance, Compliance, Super Admin, UAT/beta/readiness controls |
| Security/SOC | Events, detection, alerts, cases, evidence, playbooks, approvals, response, rollback, simulation, intelligence |
| Privacy | Public notices, consent/cookies, DSR, deletion requests, processor/cross-border records, retention governance |
| Mobile | PWA/responsive foundation and Capacitor packaging direction |
| Delivery | Vercel/Azure topology, IaC, CI/CD, migration controls, monitoring, backup/recovery, freeze governance |

## End-to-End Journey Map

The intended renter journey is registration → profile/KYC → discovery → booking → payment gate → agreement → handover/inspection → rental → return → review, with claim/dispute/insurance branches. The provider journey is registration → business/profile/KYC → listing → compliance/publication → booking fulfillment → turnover/return → earnings/payout evidence. Administrative, finance, compliance, privacy, AI-support, and SOC processes surround these journeys and must not bypass domain ownership or state authority.

`;

  const sections = [];
  sections.push(front);
  sections.push(sourceSection('Volume II — Complete Master Manual (248 Chapters)', 'docs/final-documentation/01-MASTER-MANUAL/RENTipid_COMPLETE_MASTER_MANUAL.md', 'Historical consolidated manual 1.1. Its July 2026 counts and limitations are preserved as evidence; Volume I supplies the current reconciliation.'));

  const manuals = [
    ['Volume III — User Manual', 'docs/final-documentation/02-USER-MANUALS/RENTipid_USER_MANUAL.md'],
    ['Volume IV — Operations Manual', 'docs/final-documentation/03-OPERATIONS-MANUALS/RENTipid_OPERATIONS_MANUAL.md'],
    ['Volume V — Technical Reference', 'docs/final-documentation/04-TECHNICAL-MANUALS/RENTipid_TECHNICAL_REFERENCE.md'],
    ['Volume VI — Security, SOC, and Privacy Manual', 'docs/final-documentation/05-SECURITY-SOC-PRIVACY/RENTipid_SECURITY_SOC_PRIVACY_MANUAL.md'],
    ['Volume VII — Developer Handover Manual', 'docs/final-documentation/06-DEVELOPER-HANDOVER/RENTipid_DEVELOPER_HANDOVER_MANUAL.md'],
    ['Volume VIII — Phase Completion and Freeze Register', 'docs/final-documentation/07-PHASE-HISTORY-AND-FREEZE/RENTipid_PHASE_COMPLETION_AND_FREEZE_REGISTER.md'],
    ['Volume IX — Role Training and Quick Guides', 'docs/final-documentation/10-TRAINING-AND-QUICK-GUIDES/RENTipid_ROLE_TRAINING_AND_QUICK_GUIDES.md'],
    ['Volume X — Data, API, and Workflow Reference', 'docs/final-documentation/06-DATA-API/RENTipid_DATA_API_AND_WORKFLOW_REFERENCE.md'],
    ['Volume XI — Technical Architecture and Configuration', 'docs/final-documentation/07-ARCHITECTURE/RENTipid_TECHNICAL_ARCHITECTURE_AND_CONFIGURATION.md'],
    ['Volume XII — Deployment, Operations, and Recovery', 'docs/final-documentation/08-OPERATIONS/RENTipid_DEPLOYMENT_OPERATIONS_AND_RECOVERY.md'],
  ];
  for (const [title, file] of manuals) sections.push(sourceSection(title, file, 'Canonical role or discipline-specific manual from the frozen documentation set.'));

  sections.push(sourceSection('Volume XIII — Unified Autonomous AI Customer Service and Digital Human', 'docs/unified-ai-customer-service/SYSTEMATIC_DOCUMENTATION.md', 'Current as-built module edition, including explicit runtime and integration limitations.'));
  sections.push(sourceSection('Volume XIV — Insurance Module', 'docs/insurance/RENTipid-Insurance-Module-Full-Documentation.md', 'Closed/frozen/safely shelved technical foundation; live insurance remains disabled.'));

  const privacySources = [
    ['Privacy v1 Final Closure Certificate', 'docs/final-documentation/privacy-module/RENTIPID_PRIVACY_MODULE_V1_FINAL_CLOSURE_CERTIFICATE.md'],
    ['Privacy v1 Scope Decision', 'docs/final-documentation/privacy-module/FINAL_PRIVACY_V1_SCOPE_DECISION.md'],
    ['Privacy v1 Registry', 'docs/final-documentation/privacy-module/FINAL_PRIVACY_V1_REGISTRY.md'],
    ['Privacy Implementation Report', 'docs/final-documentation/privacy-module/IMPLEMENTATION_REPORT.md'],
    ['Data Classification Register', 'docs/final-documentation/privacy-module/DATA_CLASSIFICATION_REGISTER.md'],
    ['Personal Data Inventory', 'docs/final-documentation/privacy-module/PERSONAL_DATA_INVENTORY.md'],
    ['Processor and Recipient Registry', 'docs/final-documentation/privacy-module/DATA_RECIPIENT_AND_PROCESSOR_REGISTRY.md'],
    ['Cross-Border Assessment', 'docs/final-documentation/privacy-module/CROSS_BORDER_PROCESSING_ASSESSMENT.md'],
    ['Cookie and Tracker Registry', 'docs/final-documentation/privacy-module/COOKIE_AND_TRACKER_REGISTRY.md'],
    ['Data-Subject Rights Matrix', 'docs/final-documentation/privacy-module/DATA_SUBJECT_RIGHTS_MATRIX.md'],
    ['Data-Subject Request Runbook', 'docs/final-documentation/privacy-module/DATA_SUBJECT_REQUEST_RUNBOOK.md'],
    ['Manual Retention and Disposal Runbook', 'docs/final-documentation/privacy-module/MANUAL_RETENTION_AND_DISPOSAL_RUNBOOK.md'],
    ['AI and Automated Processing Registry', 'docs/final-documentation/privacy-module/AI_AND_AUTOMATED_PROCESSING_REGISTRY.md'],
  ];
  sections.push('# Volume XV — Privacy Module v1\n\n> Accepted v1 scope with conditions and approved deferrals. Automated production deletion remains disabled.\n');
  for (const [title, file] of privacySources) sections.push(sourceSection(title, file));

  const profileSources = [
    ['Profile Phase Ledger', 'docs/final-documentation/user-profile-admin-profile-management/PHASE_LEDGER.md'],
    ['Profile Field Governance Matrix', 'docs/final-documentation/user-profile-admin-profile-management/FIELD_GOVERNANCE_MATRIX.md'],
    ['Profile Freeze Manifest', 'docs/final-documentation/user-profile-admin-profile-management/FREEZE_MANIFEST.md'],
    ['Profile Test Execution Registry', 'docs/final-documentation/user-profile-admin-profile-management/TEST_EXECUTION_REGISTRY.md'],
  ];
  sections.push('# Volume XVI — User and Admin Profile Management\n\n> Later module records supersede the older master manual\'s read-only profile limitation for their accepted frozen scope.\n');
  for (const [title, file] of profileSources) sections.push(sourceSection(title, file));

  const registers = [
    'RENTipid_SOURCE_AUTHORITY_AND_CONFLICT_REGISTER.md',
    'RENTipid_MODULE_AND_FEATURE_REGISTRY.md',
    'RENTipid_REPOSITORY_EVIDENCE_REGISTRY.md',
    'RENTipid_PHASE_AND_SUBPHASE_REGISTRY.md',
    'RENTipid_ROUTE_AND_SCREEN_REGISTRY.md',
    'RENTipid_ROLE_AND_PERMISSION_REGISTRY.md',
    'RENTipid_DATABASE_AND_DATA_OWNERSHIP_REGISTRY.md',
    'RENTipid_API_AND_SERVICE_REGISTRY.md',
    'RENTipid_INTEGRATION_AND_EXTERNAL_PROVIDER_REGISTRY.md',
    'RENTipid_CONFIGURATION_AND_ENVIRONMENT_REGISTRY.md',
    'RENTipid_WORKFLOW_AND_STATE_TRANSITION_REGISTRY.md',
    'RENTipid_AUDIT_AND_SECURITY_EVENT_REGISTRY.md',
    'RENTipid_SECURITY_CONTROL_REGISTRY.md',
    'RENTipid_TEST_AND_VALIDATION_EVIDENCE_REGISTRY.md',
    'RENTipid_DEPLOYMENT_AND_RUNTIME_REGISTRY.md',
    'RENTipid_KNOWN_GAP_AND_LIMITATION_REGISTRY.md',
    'RENTipid_DOCUMENTATION_TRACEABILITY_REGISTRY.md',
    'RENTipid_STATUS_TERMINOLOGY_AND_CLASSIFICATION_REGISTRY.md',
  ];
  sections.push('# Volume XVII — Complete Frozen Working Registers\n\n> These are the full controlled working registers, not only summaries. Their historical counts are preserved and should be read with the current direct inventories in Volume XVIII.\n');
  for (const filename of registers) {
    const file = filename.includes('SOURCE_AUTHORITY')
      ? `docs/final-documentation/11-EVIDENCE-AND-VALIDATION/${filename}`
      : `docs/final-documentation/00-WORKING-REGISTRIES/${filename}`;
    sections.push(sourceSection(filename.replace(/^RENTipid_|\.md$/g, '').replaceAll('_', ' '), file));
  }

  sections.push(`# Volume XVIII — Direct Current Repository Inventories

## Current Page Routes (${inventory.pages.length})

${markdownList(inventory.pages)}

## Current Root API Route Handlers (${inventory.rootApis.length})

${markdownList(inventory.rootApis)}

## Current Azure API Route Files (${inventory.azureRoutes.length})

${markdownList(inventory.azureRoutes)}

## Current Prisma Models (${inventory.models.length})

${markdownList(inventory.models)}

## Current Prisma Enums (${inventory.enums.length})

${markdownList(inventory.enums)}

## Current Migration Directories (${inventory.migrations.length})

${markdownList(inventory.migrations)}

## Current Test and Specification Files (${inventory.tests.length})

${markdownList(inventory.tests)}

## Configuration Names

Values are intentionally excluded. Names are discovered from safe environment templates and code references.

${markdownList(environmentNames())}

## Dependency Inventory

| Surface | Package | Declared version |
| --- | --- | --- |
${dependencyRows()}

## Worktree Status at Generation

This is evidence of repository state, not an instruction to commit or discard changes.

\`\`\`text
${dirtyLines.join('\n')}
\`\`\`
`);

  sections.push(`# Volume XIX — Architecture and Workflow Diagram Atlas

The following 25 diagrams are the canonical visual set produced by the earlier documentation program and validated as rendered PNG/SVG artifacts. Diagrams explain relationships and flows; implementation and governance evidence remain authoritative.

${diagramAtlas()}`);

  sections.push(`# Volume XX — Validation, Use, and Handover

## Documentation Validation Scope

This build validates document assembly, source presence, diagram loading, internal contents links, layout overflow, PDF structure, tagging, bookmarks, page objects, and SHA-256 integrity. It does not rerun application, database, payment, provider, cloud, browser-journey, security, or production acceptance suites.

## How to Determine Whether a Capability Is Live

1. Identify the exact route, API, service, model, and integration.
2. Check current code, not only a historical manual.
3. Check the accepted phase/freeze record for governance status.
4. Check environment configuration without exposing values.
5. Verify target infrastructure and external provider state under explicit authority.
6. Run the relevant local/preview acceptance with safe database guards.
7. Confirm monitoring, rollback, and operational ownership.
8. For payments, insurance, KYC, AI, privacy automation, or security response, confirm the separate activation gate.

## Reopen and Change-Control Checklist

- Exact approved requirement and Owner/authorized approver.
- Current source authority and affected frozen records.
- Actors, permissions, ownership, and separation of duties.
- Data classification, privacy, retention, processor, and cross-border impact.
- State-machine, transaction, idempotency, and reconciliation impact.
- API/schema/migration compatibility.
- Security threat analysis, logging, and incident response.
- Environment/provider/infrastructure authorization.
- Targeted and regression tests with exact evidence.
- Deployment, rollback, recovery, monitoring, and documentation updates.
- New commit/tag/manifest only after acceptance.

## Final System Statement

RENTipid is extensively modeled and documented across marketplace, rental, trust, finance, administration, privacy, AI, insurance, mobile, delivery, and SOC domains. Its strongest characteristics are explicit ownership, state and evidence records, separation of duties, fail-closed high-risk foundations, reversible security response, and disciplined governance vocabulary.

The complete and accurate posture is not “everything is live.” The repository is a partially split implementation with a large accepted/frozen body of local engineering work, several non-live or shelved integrations, reserved production decisions, a live-payment prohibition, and current dirty-worktree changes. This manual preserves both capability and limitation so future decisions can be made from evidence rather than inference.
`);

  return sections.join('\n\n<!-- pagebreak -->\n\n');
}

const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const slugCounts = new Map();
function slugify(value) {
  const base = value.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
  const count = slugCounts.get(base) || 0;
  slugCounts.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function inlineMarkdown(value) {
  const chunks = String(value).split(/(`[^`]+`)/g);
  return chunks.map((chunk) => {
    if (chunk.startsWith('`') && chunk.endsWith('`')) return `<code>${escapeHtml(chunk.slice(1, -1))}</code>`;
    return escapeHtml(chunk)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }).join('');
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const headings = [];
  const output = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];
  const flushParagraph = () => { if (paragraph.length) { output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`); paragraph = []; } };
  const closeList = () => { if (listType) { output.push(`</${listType}>`); listType = null; } };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith('```')) {
      flushParagraph(); closeList();
      if (!inCode) { inCode = true; codeLanguage = line.slice(3).trim(); codeLines = []; }
      else { output.push(`<pre data-language="${escapeHtml(codeLanguage)}"><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`); inCode = false; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }
    if (line.trim() === '<!-- pagebreak -->') { flushParagraph(); closeList(); output.push('<div class="page-break"></div>'); continue; }
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph(); closeList();
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const id = slugify(title);
      headings.push({ level, title: title.replace(/`/g, ''), id });
      output.push(`<h${level}${level === 1 ? ' class="chapter"' : ''} id="${id}">${inlineMarkdown(title)}</h${level}>`);
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) { flushParagraph(); closeList(); output.push('<hr>'); continue; }
    if (line.includes('|') && index + 1 < lines.length && /^\s*\|?\s*:?-+/.test(lines[index + 1])) {
      flushParagraph(); closeList();
      const tableLines = [line]; index += 2;
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) { tableLines.push(lines[index]); index += 1; }
      index -= 1;
      const splitRow = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
      const rows = tableLines.map(splitRow);
      output.push('<table><thead><tr>'); rows[0].forEach((cell) => output.push(`<th>${inlineMarkdown(cell)}</th>`)); output.push('</tr></thead><tbody>');
      rows.slice(1).forEach((row) => { output.push('<tr>'); row.forEach((cell) => output.push(`<td>${inlineMarkdown(cell)}</td>`)); output.push('</tr>'); });
      output.push('</tbody></table>'); continue;
    }
    const unordered = /^\s*[-*]\s+(.+)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (unordered || ordered) {
      flushParagraph(); const nextType = unordered ? 'ul' : 'ol';
      if (listType !== nextType) { closeList(); listType = nextType; output.push(`<${listType}>`); }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`); continue;
    }
    if (line.startsWith('> ')) { flushParagraph(); closeList(); output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`); continue; }
    if (!line.trim()) { flushParagraph(); closeList(); continue; }
    paragraph.push(line.trim());
  }
  flushParagraph(); closeList();
  return { body: output.join('\n'), headings };
}

function buildHtml(markdown) {
  slugCounts.clear();
  const parsed = parseMarkdown(markdown);
  const toc = parsed.headings.filter(({ level }) => level <= 2).map(({ level, title, id }) => `<li class="toc-level-${level}"><a href="#${id}">${inlineMarkdown(title)}</a></li>`).join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RENTipid Complete System Documentation</title><style>
  :root{--ink:#172033;--muted:#586174;--blue:#155eef;--navy:#071b35;--cyan:#0e7490;--line:#d8deea;--pale:#f4f7fb}
  *{box-sizing:border-box}html{font-size:10pt}body{margin:0;color:var(--ink);font-family:"Segoe UI",Arial,sans-serif;line-height:1.46;background:white}
  .cover{min-height:250mm;padding:31mm 21mm 23mm;color:white;background:linear-gradient(145deg,#061225 0%,#0b315e 56%,#08788a 100%);display:flex;flex-direction:column;justify-content:space-between;page-break-after:always}
  .brand{text-transform:uppercase;letter-spacing:.25em;font-size:10pt;color:#a5e6f2;font-weight:700}.cover h1{font-size:33pt;line-height:1.06;margin:18mm 0 7mm;color:white;letter-spacing:-.03em;max-width:170mm}.subtitle{font-size:15pt;line-height:1.4;max-width:155mm;color:#dcecff}.badge{display:inline-block;border:1px solid rgba(255,255,255,.42);border-radius:999px;padding:2.5mm 5mm;font-size:9pt;letter-spacing:.07em;text-transform:uppercase}.cover-grid{display:grid;grid-template-columns:1fr 1fr;gap:7mm;border-top:1px solid rgba(255,255,255,.25);padding-top:8mm;color:#dcecff;font-size:9pt}.cover-grid strong{color:white;display:block;margin-bottom:1mm}
  .toc{page-break-after:always}.toc h1{page-break-before:auto}.toc ol{list-style:none;padding:0;columns:2;column-gap:12mm}.toc li{break-inside:avoid;border-bottom:1px dotted #c5cede;padding:1.2mm 0}.toc-level-1{font-weight:700;margin-top:2mm}.toc-level-2{padding-left:5mm!important;color:var(--muted);font-size:8.6pt}.toc a{color:inherit;text-decoration:none}
  h1.chapter{page-break-before:always;font-size:22pt;line-height:1.15;color:var(--navy);margin:0 0 8mm;padding-bottom:3mm;border-bottom:2px solid var(--blue)}h2{font-size:14.5pt;color:#123b66;margin:8mm 0 3mm;page-break-after:avoid}h3{font-size:11.5pt;color:#14536f;margin:5.5mm 0 2mm;page-break-after:avoid}h4,h5,h6{font-size:10pt;margin:4mm 0 1.5mm;page-break-after:avoid}p{margin:0 0 3mm;orphans:3;widows:3}ul,ol{margin:1mm 0 4mm 5mm;padding-left:5mm}li{margin:1mm 0}a{color:var(--blue);text-decoration:none}code{font-family:Consolas,"Courier New",monospace;font-size:.87em;color:#9d174d;background:#f8edf3;padding:.15em .35em;border-radius:3px;overflow-wrap:anywhere}pre{background:#101827;color:#edf3ff;padding:4mm;border-radius:5px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:8pt;page-break-inside:avoid}pre code{color:inherit;background:none;padding:0}blockquote{margin:4mm 0;padding:3mm 4mm;border-left:4px solid var(--blue);background:#edf4ff;color:#193b68;page-break-inside:avoid}table{width:100%;border-collapse:collapse;margin:3mm 0 6mm;font-size:7.8pt;table-layout:auto}thead{display:table-header-group}th{background:var(--navy);color:white;text-align:left;font-weight:650}th,td{border:1px solid var(--line);padding:1.8mm 2.1mm;vertical-align:top;overflow-wrap:anywhere}tbody tr:nth-child(even){background:var(--pale)}tr{page-break-inside:avoid}hr{border:0;border-top:1px solid var(--line);margin:7mm 0}img{display:block;max-width:100%;max-height:205mm;margin:5mm auto 7mm;object-fit:contain;page-break-inside:avoid}.page-break{page-break-before:always}@media print{.cover,table,th,blockquote{print-color-adjust:exact;-webkit-print-color-adjust:exact}a{color:inherit}}
  </style></head><body><section class="cover"><div><div class="brand">RENTipid · Complete Platform Reference</div><h1>Complete System Documentation</h1><div class="subtitle">Product · Users · Modules · Architecture · Data · APIs · Security · Privacy · AI · Insurance · Operations · Governance</div><div style="margin-top:12mm"><span class="badge">Systematic comprehensive edition · repository reconciled</span></div></div><div class="cover-grid"><div><strong>Edition</strong>2.0 · 13 August 2026</div><div><strong>Repository snapshot</strong>${git('rev-parse','--short=12','HEAD')}</div><div><strong>Architecture</strong>Vercel frontend · Azure backend/services direction</div><div><strong>Classification</strong>Internal system, operations, and engineering reference</div></div></section><section class="toc"><h1>Contents</h1><ol>${toc}</ol></section><main>${parsed.body}</main></body></html>`;
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const markdown = buildMarkdown();
  fs.writeFileSync(markdownPath, markdown, 'utf8');
  const html = buildHtml(markdown);
  fs.writeFileSync(htmlPath, html, 'utf8');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`file:///${htmlPath.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, displayHeaderFooter: true, margin: { top: '18mm', right: '14mm', bottom: '18mm', left: '14mm' }, headerTemplate: '<div style="font-size:7px;color:#738096;width:100%;padding:0 14mm;text-align:right">RENTipid · Complete System Documentation · Edition 2.0</div>', footerTemplate: '<div style="font-size:7px;color:#738096;width:100%;padding:0 14mm;display:flex;justify-content:space-between"><span>Repository-reconciled edition · 13 August 2026</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>', tagged: true, outline: true });
  } finally { await browser.close(); }
  const hash = crypto.createHash('sha256').update(fs.readFileSync(pdfPath)).digest('hex').toUpperCase();
  fs.writeFileSync(checksumPath, `${hash}  ${path.basename(pdfPath)}\n`, 'utf8');
  console.log(JSON.stringify({ markdownPath, htmlPath, pdfPath, checksumPath, bytes: fs.statSync(pdfPath).size, sha256: hash }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
