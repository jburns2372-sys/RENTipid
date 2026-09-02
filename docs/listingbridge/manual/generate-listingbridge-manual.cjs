const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

const OUT_DIR = __dirname;
const ASSET_DIR = path.join(OUT_DIR, 'assets');
const BASENAME = 'RENTipid_ListingBridge_v1.0_Complete_Reference_Manual';
const SOURCE_MD = path.join(OUT_DIR, `${BASENAME}_source.md`);
const PDF_PATH = path.join(OUT_DIR, `${BASENAME}.pdf`);

const today = new Date();
const publicationDate = today.toLocaleDateString('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const release = Object.freeze({
  title: 'RENTipid ListingBridge v1.0',
  subtitle: 'Complete User, Operations, Developer & Business Reference Manual',
  classification: 'Controlled Technical & Operational Reference',
  moduleVersion: '1.0',
  appSha: 'a8647df71aa9c610027054e2016fd73b53f3b238',
  freezeDocsCommit: '450e74435b95b1d8e7d431f46c3b1466204b4ab4',
  tag: 'listingbridge-v1.0.0-frozen',
  deployment: 'dpl_G4kvoqxoMUUnDMQZFBirfEwt5Ch3',
  url: 'https://www.rentipid.com.ph',
  migration: '20260831000000_add_listingbridge_import_job_foundation',
  lifecycle: 'G1-G13 PASS',
});

const featureFlags = [
  ['LISTINGBRIDGE_GLOBAL', 'Master ListingBridge kill switch and rollout gate.', 'false', 'No ListingBridge connectors are offered; manual listing creation remains available.', 'ListingBridge import entry points and connector evaluation are permitted subject to child flags.', 'All ListingBridge capabilities.', 'Frozen release flag. Change only through controlled rollout.'],
  ['LISTINGBRIDGE_FILE_IMPORT', 'Enables Tier 3 structured file import capability.', 'true', 'Structured file import is unavailable.', 'Structured file connectors can be evaluated when global flag also permits.', 'LISTINGBRIDGE_GLOBAL.', 'Do not confuse enabled capability with production-wide public rollout.'],
  ['LISTINGBRIDGE_URL_IMPORT', 'Enables Tier 4 public URL retrieval.', 'false', 'URL import is unavailable.', 'SSRF-guarded URL retrieval can run for approved connectors.', 'LISTINGBRIDGE_GLOBAL, retrieval policy, SSRF controls.', 'High caution due to external network exposure.'],
  ['LISTINGBRIDGE_API_CONNECTORS', 'Enables API or OAuth partner connectors.', 'false', 'OAuth/API connector paths are unavailable.', 'Approved server-side API connectors may be evaluated.', 'LISTINGBRIDGE_GLOBAL, connector credentials, compliance approval.', 'No live Airbnb, Agoda, or Booking.com connector exists in v1.0.'],
  ['LISTINGBRIDGE_MEDIA_IMPORT', 'Enables media retrieval, validation, hashing, and storage.', 'true', 'Imports can continue as text/detail-only where supported.', 'External media candidates may be ingested after validation.', 'Storage provider, media MIME validation, source retrieval.', 'Disable if storage or MIME validation anomaly is observed.'],
  ['LISTINGBRIDGE_AI_MAPPING', 'Enables bounded semantic mapping assistance.', 'true', 'Deterministic mapping and provider review continue without AI.', 'AI may suggest amenities, categories, summaries, and original descriptions from verified facts.', 'Unified AI adapter and read-only/draft-only tools.', 'AI output is advisory and never policy-authoritative.'],
  ['LISTINGBRIDGE_AVAILABILITY_IMPORT', 'Enables external availability/calendar import.', 'false', 'Availability data is not imported from external calendars.', 'Approved availability connector capability may be used.', 'LISTINGBRIDGE_GLOBAL and connector availability support.', 'Reservation write-back and continuous sync are not v1.0 scope.'],
];

const states = [
  ['CREATED', 'Durable job record exists.', 'AUTHORIZING or FETCHING.', 'Job should not remain idle for long.', 'Retry or cancel only through controlled support flow.'],
  ['AUTHORIZING', 'Provider rights or connector authorization is being verified.', 'FETCHING.', 'Repeated authorization failures may indicate user action or connector issue.', 'Ask provider to retry authorization; do not bypass rights confirmation.'],
  ['FETCHING', 'Connector or secure retrieval is obtaining source payload.', 'EXTRACTING.', 'Timeouts and connector errors are expected transient concerns.', 'Retry if retryable; security failures become final.'],
  ['EXTRACTING', 'Structured facts are being read from payload.', 'NORMALIZING.', 'Malformed payloads can produce missing fields.', 'Escalate only if repeated for known-good source.'],
  ['NORMALIZING', 'Facts are mapped into canonical contract.', 'PROCESSING_MEDIA or VALIDATING.', 'Unexpected confidence spikes or prohibited fields require review.', 'Inspect normalized field records and rejected fields.'],
  ['PROCESSING_MEDIA', 'Media candidates are downloaded, validated, deduped, and stored.', 'VALIDATING, NEEDS_REVIEW, or READY_FOR_DRAFT.', 'Storage, MIME, or partial failures.', 'Text import may survive partial media failure; missing required photo can block readiness.'],
  ['VALIDATING', 'Readiness, policy, location, duplicate, and field checks run.', 'NEEDS_REVIEW or READY_FOR_DRAFT.', 'Blocking fields must be resolved before draft.', 'Use field/resolution records to guide provider.'],
  ['NEEDS_REVIEW', 'Provider must inspect, correct, or confirm fields.', 'READY_FOR_DRAFT or VALIDATING.', 'Support should not edit provider assertions casually.', 'Provider correction is preferred.'],
  ['READY_FOR_DRAFT', 'Server-side readiness has no blockers.', 'CREATING_DRAFT.', 'If job regresses, review duplicate/location/media blockers.', 'Proceed to draft only after rights confirmation.'],
  ['CREATING_DRAFT', 'Draft creation through native Listing authority is underway.', 'COMPLETED or failure state.', 'Stuck jobs may have native draft already created.', 'Check created_listing_id before any retry.'],
  ['COMPLETED', 'Native RENTipid draft has been created and linked.', 'Terminal.', 'No further import mutation expected.', 'Provider continues normal listing editing workflow.'],
  ['FAILED_RETRYABLE', 'Transient failure occurred and may be retried.', 'Prior processing state, FAILED_FINAL, or CANCELLED.', 'Retry count and next_attempt_at matter.', 'Retry is bounded by max_retries=3.'],
  ['FAILED_FINAL', 'Non-retryable or exhausted failure.', 'Terminal.', 'Security, corrupt data, or repeated retry exhaustion.', 'Manual listing fallback; preserve audit evidence.'],
  ['CANCELLED', 'Provider or operator cancelled import.', 'Terminal.', 'No draft should be created from a cancelled job.', 'Manual fallback remains available.'],
];

const tables = {
  businessBenefits: [
    ['Capability', 'Business Value', 'Risk Control'],
    ['One-time import to draft', 'Shortens provider onboarding and reduces duplicate data entry.', 'Provider review and draft-only boundary prevent uncontrolled publication.'],
    ['Canonical contract', 'Creates reusable foundation for future source channels.', 'External source objects never write directly to Listing.'],
    ['Field confidence and provenance', 'Improves support visibility and user trust.', 'Ambiguous or missing data is surfaced rather than fabricated.'],
    ['Duplicate detection', 'Protects marketplace quality.', 'Exact matches block readiness; possible matches require review.'],
    ['Feature flags', 'Allows controlled rollout by capability.', 'Master kill switch disables import without harming manual listings.'],
    ['Security-first retrieval', 'Enables controlled external input.', 'SSRF, MIME, size, redirect, and rate controls fail closed.'],
  ],
  confidence: [
    ['State', 'Meaning', 'Provider action', 'Readiness impact'],
    ['VERIFIED', 'Confirmed by provider or deterministic trusted validation.', 'Review for accuracy; no action unless wrong.', 'Normally non-blocking.'],
    ['HIGH_CONFIDENCE', 'Imported and normalized with strong evidence.', 'Review and edit if needed.', 'Normally non-blocking.'],
    ['REVIEW_RECOMMENDED', 'Usable but uncertain or AI/system assisted.', 'Inspect and confirm or correct.', 'May warn; can block if required by context.'],
    ['CONFLICT', 'Contradictory, invalid, or inconsistent data was detected.', 'Choose the correct value or correct the field.', 'Blocks required fields and critical checks.'],
    ['MISSING', 'Required or useful information was not found.', 'Enter the missing information manually.', 'Blocks when required or readiness-critical.'],
    ['PROHIBITED', 'Source data is not allowed into listing content.', 'Do not reuse; provide allowed replacement content if needed.', 'Active prohibited content blocks.'],
  ],
  troubleshooting: [
    ['Symptom', 'Possible cause', 'User action', 'Escalate when'],
    ['Source unavailable', 'Connector disabled or feature flag off.', 'Use manual listing creation or retry later.', 'Expected source should be enabled for your account.'],
    ['Authorization rejected', 'Rights confirmation missing or connector authorization failed.', 'Confirm authority and media rights; reauthorize if prompted.', 'You believe authorization is valid but still blocked.'],
    ['Imported field missing', 'External source did not expose the field.', 'Enter the value manually during review.', 'The field repeatedly disappears after saving.'],
    ['Field says Please Review', 'Confidence is review-recommended or AI-assisted.', 'Inspect and confirm or edit the value.', 'The status does not change after correction.'],
    ['Conflict shown', 'Location, duplicate, or field validation conflict.', 'Resolve the highlighted field.', 'You cannot determine the correct value.'],
    ['Unsafe URL rejection', 'URL failed SSRF, protocol, DNS, redirect, or size policy.', 'Use another approved source or manual listing.', 'Never attempt to bypass URL safety.'],
    ['Media failure', 'Invalid MIME, too large, duplicate, retrieval failure, or storage issue.', 'Upload photos through the normal editor if needed.', 'Many unrelated imports fail media processing.'],
    ['Duplicate detected', 'Same source, nearby coordinates, or similar title/location.', 'Open existing draft/listing or clarify unique details.', 'System marks a clearly different property as exact match.'],
    ['Cannot reach draft readiness', 'Missing required field, unconfirmed rights, blocking duplicate, invalid media, or location conflict.', 'Complete each listed blocker.', 'Blockers persist after correction.'],
    ['Import retry', 'Transient network or upstream issue.', 'Retry if offered; otherwise use manual fallback.', 'Retry fails repeatedly.'],
    ['Session/authentication issue', 'Login expired or role not authorized.', 'Sign in again with provider account.', 'You are verified but still denied.'],
  ],
  supportTroubleshooting: [
    ['Issue', 'Diagnostic evidence', 'Operator response', 'Escalation'],
    ['Connector outage', 'connector failure metrics, health state DEGRADED/UNHEALTHY.', 'Disable affected connector capability if necessary; preserve manual fallback.', 'Engineering/SRE and partner owner.'],
    ['Repeated import failure', 'FAILED_RETRYABLE trend, retry_count near max_retries.', 'Classify error category; verify source is allowed and reachable.', 'Engineering if deterministic reproducible failure.'],
    ['SSRF/security block spike', 'listingbridge_ssrf_block_total >= 10 or SECURITY_BLOCKED audit events.', 'Investigate actor/source patterns; rate limit or suspend abusive account.', 'Security/SOC immediately.'],
    ['Worker interruption', 'Stale FETCHING/PROCESSING_MEDIA/CREATING_DRAFT with lock timestamps.', 'Resume from durable state; check created_listing_id before retry.', 'Engineering if state transition invalid.'],
    ['Media storage failure', 'MEDIA_PROCESSING_EXCEPTION, storage errors, media_failure metric.', 'Temporarily disable media import if systemic.', 'Storage/SRE.'],
    ['Duplicate anomaly', 'Unexpected EXACT_MATCH or widespread false positives.', 'Review signals: source hash, coordinate proximity, title/city similarity.', 'Product/Engineering for threshold tuning.'],
    ['Draft creation failure', 'DRAFT_READINESS_FAILED or LISTING_AUTHORITY_CREATION_FAILED.', 'Verify required fields, Category resolution, ListingService health.', 'Engineering if native service rejects valid payload.'],
    ['Database issue', '/api/health database not connected, Prisma errors.', 'Follow production DB incident process; avoid destructive rollback.', 'SRE/DBA.'],
    ['Runtime regression', 'Vercel runtime errors after deployment.', 'Use global kill switch; consider Vercel rollback.', 'Release manager.'],
  ],
  securityMatrix: [
    ['Threat', 'Control', 'Implementation component', 'Detection', 'Operator response'],
    ['SSRF to internal network', 'Protocol, DNS, IP range, redirect, and pinned-address validation.', 'SsrfProtectionService; SecureHttpRetrievalEngine.', 'SECURITY_BLOCKED audit; ssrf block metric.', 'Treat spikes as security incident.'],
    ['Credential leakage', 'Server-only credentials; sensitive header stripping and log redaction.', 'credential-boundary; secure retrieval; structured logger.', 'Redaction tests and audit review.', 'Rotate affected secret if exposure suspected.'],
    ['Prompt injection', 'External text delimited as untrusted and AI tools restricted.', 'SafeAiContextBuilder; AiToolGateway tools.', 'AI fallback/validation failures.', 'Inspect source payload and disable AI mapping if needed.'],
    ['Malicious media/file', 'MIME sniffing, size limits, content hashing.', 'MediaSecurityValidator; file-preflight.', 'media_failure metric and rejected asset rows.', 'Block source or guide provider to manual upload.'],
    ['Cross-tenant access', 'Server session re-resolution and provider_id ownership check.', 'Server actions; draft creation service.', 'OWNERSHIP_MISMATCH errors.', 'Security escalation if malicious.'],
    ['Duplicate draft creation', 'created_listing_id and idempotency guard.', 'ListingImportJob unique constraints; draft service.', 'Duplicate exact match signals.', 'Return existing draft; do not create new one manually.'],
  ],
  dbEntities: [
    ['Entity', 'Purpose', 'Key relationships', 'Lifecycle role', 'Important constraints'],
    ['ListingImportJob', 'Durable root import job and status state.', 'provider_id -> User; created_listing_id -> Listing.', 'Owns canonical payload, retry metadata, status, and draft linkage.', 'Unique idempotency_key and created_listing_id; indexes by provider/status/source.'],
    ['ListingImportSource', 'Per-source retrieval/provenance record.', 'job_id -> ListingImportJob.', 'Records connector, tier, source mode, version, hashes, and retrieval metadata.', 'Indexes source reference and identifier.'],
    ['ListingImportField', 'Field-level normalized value, confidence, and validation record.', 'job_id -> ListingImportJob; optional source_id -> ListingImportSource.', 'Supports provider review, readiness, and provenance.', 'Unique job_id+field_name; indexes confidence and blockers.'],
    ['ListingImportAsset', 'Media candidate, validation, storage, and hash record.', 'job_id -> ListingImportJob.', 'Tracks media success, rejection, duplicates, and storage path.', 'Unique job_id+source_reference_hash and job_id+content_sha256.'],
    ['ListingImportResolution', 'Provider/system resolution of a field.', 'job_id -> ListingImportJob; resolved_by_user_id -> User.', 'Persists corrections and rights confirmation.', 'Unique job_id+field_name; indexed by resolver/time.'],
    ['ListingImportAuditEvent', 'Append-only import audit trail.', 'job_id -> ListingImportJob; actor_user_id -> User; audit_log_id -> AuditLog.', 'Records lifecycle, authorization, security, correction, and draft events.', 'Indexed by job/time, actor/time, and central audit link.'],
  ],
};

const diagrams = [
  {
    id: 'workflow',
    caption: 'ListingBridge end-to-end provider workflow.',
    nodes: ['Provider Dashboard', 'Import Existing Listing', 'Source Selection', 'Rights Confirmation', 'Secure Import', 'Review and Correct', 'READY_FOR_DRAFT', 'Create RENTipid Draft', 'Native Listing Editor'],
  },
  {
    id: 'architecture',
    caption: 'High-level ListingBridge architecture.',
    nodes: ['External Source', 'Connector', 'Authorization + Secure Retrieval', 'Canonical Import Contract', 'Extraction / Normalization / Mapping', 'Validation / Confidence / Provenance', 'Media / Location / Duplicate Intelligence', 'Provider Review', 'Server Readiness', 'Draft Service', 'ListingService.createDraft', 'Native RENTipid Draft'],
    side: ['NextAuth', 'RBAC', 'AuditLog', 'Storage', 'Address/PSGC', 'AI runtime', 'Feature flags', 'PostgreSQL/Neon'],
  },
  {
    id: 'connector',
    caption: 'Connector architecture and control boundary.',
    nodes: ['Source Mode', 'Descriptor', 'Capabilities', 'Feature Flag Evaluation', 'Environment Approval', 'Compliance State', 'Health Check', 'Connector Method Contract'],
  },
  {
    id: 'job-lifecycle',
    caption: 'Durable import job lifecycle.',
    nodes: ['CREATED', 'AUTHORIZING', 'FETCHING', 'EXTRACTING', 'NORMALIZING', 'PROCESSING_MEDIA', 'VALIDATING', 'NEEDS_REVIEW', 'READY_FOR_DRAFT', 'CREATING_DRAFT', 'COMPLETED'],
    side: ['FAILED_RETRYABLE', 'FAILED_FINAL', 'CANCELLED'],
  },
  {
    id: 'draft-sequence',
    caption: 'Draft creation sequence.',
    nodes: ['Provider Browser', 'ListingBridge UI', 'Server Action/API', 'ListingImportRepository', 'Validation/Readiness', 'DraftCreationService', 'ListingService', 'Prisma/Postgres', 'Return real Listing ID', 'Listing Editor'],
  },
  {
    id: 'database',
    caption: 'Simplified ListingBridge database relationship diagram.',
    nodes: ['User Provider', 'ListingImportJob', 'ListingImportSource', 'ListingImportField', 'ListingImportAsset', 'ListingImportResolution', 'ListingImportAuditEvent', 'AuditLog', 'Listing Draft'],
  },
  {
    id: 'security',
    caption: 'Security defense-in-depth model.',
    nodes: ['Untrusted Input', 'Auth/RBAC', 'Feature Flags', 'SSRF/DNS/Redirect Guard', 'Rate/Timeout/Size Limits', 'Schema Validation', 'MIME/File Validation', 'AI Boundary', 'Audit/Telemetry', 'Draft-Only Listing Authority'],
  },
  {
    id: 'release',
    caption: 'Release lifecycle G1-G13.',
    nodes: ['G1 Code Complete', 'G2 Local Functional', 'G3 Local DB Migrated', 'G4 Seeded/Synced', 'G5 Local Acceptance', 'G6 Preview Migrated', 'G7 Preview Acceptance + OAT', 'G8 Production Ready', 'G9 Production Deploy', 'G10 Completed', 'G11 Accepted', 'G12 Closed', 'G13 Frozen'],
  },
  {
    id: 'flags',
    caption: 'Feature-flag and rollback model.',
    nodes: ['LISTINGBRIDGE_GLOBAL=false', 'URL_IMPORT=false', 'API_CONNECTORS=false', 'AVAILABILITY_IMPORT=false', 'Manual Listing Available', 'Existing Drafts Intact', 'No Destructive DB Rollback', 'Controlled Change Required'],
  },
];

const acceptance = [
  ...rangeRows('LB-CONF', 1, 8, ['Confidence states exist and are rendered consistently.', 'Verified/high-confidence fields remain non-blocking.', 'Review-recommended fields produce warnings.', 'Conflicts are visible and actionable.', 'Missing required fields block readiness.', 'Prohibited fields are excluded from active listing content.', 'Provider corrections update confidence to verified.', 'Review snapshots preserve field provenance.']),
  ...rangeRows('LB-FUNC', 1, 8, ['Import job creation persists durable state.', 'Manual listing creation remains independent.', 'Canonical contract validation succeeds for valid payloads.', 'Extraction and normalization produce mapped fields.', 'Provider rights confirmation is required.', 'Native draft creation uses ListingService authority.', 'Draft status remains Draft only.', 'Import flow can resume from durable state.']),
  ...rangeRows('LB-CONN', 1, 4, ['Connector descriptors validate contract shape.', 'Environment resolution distinguishes Preview from Production.', 'Internal test connector is available for controlled Preview testing.', 'Internal test connector is disabled in Production.']),
  ...rangeRows('LB-SEC', 1, 8, ['HTTPS-only default retrieval policy enforced.', 'Loopback/private/link-local addresses are blocked.', 'Cloud metadata endpoints are blocked.', 'DNS failure fails closed.', 'Redirect targets are revalidated.', 'Sensitive headers are stripped/redacted.', 'Response size, timeout, and content-type limits are enforced.', 'Ownership mismatch blocks cross-tenant access.']),
  ...rangeRows('LB-MEDIA', 1, 4, ['Valid JPEG/PNG/WEBP/GIF media is accepted.', 'Invalid MIME and executable-like content is rejected.', 'SHA-256 deduplication prevents duplicate media writes.', 'Partial media failures do not erase valid import details.']),
  ...rangeRows('LB-LOC', 1, 4, ['Philippine address normalization succeeds.', 'Coordinates outside Philippine bounds conflict for PH listings.', 'Missing city/address blocks readiness.', 'Address review state is surfaced to provider.']),
  ...rangeRows('LB-DUP', 1, 4, ['Previously imported same source is exact match.', 'Nearby same-provider coordinates are likely/exact duplicate signals.', 'Similar title and city produce possible-match review.', 'Unrelated listings return no match.']),
  ...rangeRows('LB-UX', 1, 4, ['Provider dashboard links to create and import listing.', 'Source selector and authorization step operate.', 'Provider correction UI saves edited fields.', 'Manual fallback link opens the native listing wizard.']),
  ...rangeRows('LB-AI', 1, 4, ['AI cannot fabricate missing required facts.', 'Invalid AI structured output fails safely.', 'AI cannot publish, approve, or bypass policy.', 'Core import works with AI disabled.']),
  ...rangeRows('LB-OBS', 1, 4, ['Metrics use bounded safe dimensions.', 'Health report summarizes flags, connector health, and import totals.', 'Alerts trigger for SSRF, draft failure, and connector failure thresholds.', 'Structured logging and redaction avoid secrets and PII dimensions.']),
];

function rangeRows(prefix, start, end, texts) {
  const rows = [];
  for (let i = start; i <= end; i++) {
    rows.push([`${prefix}-${String(i).padStart(3, '0')}`, texts[i - start] || `${prefix} acceptance criterion ${i}.`, 'PASS']);
  }
  return rows;
}

function makeContent() {
  const c = [];
  const part = (title) => c.push({ type: 'part', title });
  const chapter = (num, title, terms, body) => c.push({ type: 'chapter', num, title, terms, body });
  const p = (text) => ({ type: 'p', text });
  const note = (kind, text) => ({ type: 'callout', kind, text });
  const list = (items) => ({ type: 'list', items });
  const table = (caption, rows, widths) => ({ type: 'table', caption, rows, widths });
  const fig = (id) => ({ type: 'figure', id });

  part('Part I - Executive & Business Reference');
  chapter(1, 'Executive Overview', ['ListingBridge', 'Draft', 'Governance', 'External sources'], [
    p('ListingBridge is RENTipid v1.0 functionality for importing an existing provider listing into a native RENTipid draft. It reduces repeated data entry while preserving RENTipid as the system of record. External sources are input channels only. RENTipid remains authoritative for identity, provider ownership, listing state, media storage, policy, publication eligibility, audit, and production records.'),
    p('The import is intentionally one-time. ListingBridge helps gather and normalize listing details, media candidates, location facts, pricing hints, and provenance, then routes the reviewed result through the existing native draft authority. It does not replace manual listing creation and it does not publish listings.'),
    note('IMPORTANT', 'ListingBridge itself does not publish, approve, or make a listing bookable. The output of v1.0 is a native RENTipid Listing with status Draft. Submission, review, approval, and publication remain separate existing RENTipid lifecycle steps.'),
    fig('workflow'),
    table('v1.0 achievement and non-scope summary', [
      ['Area', 'v1.0 achieves', 'v1.0 intentionally excludes'],
      ['Onboarding', 'Provider can import into a reviewable draft workflow.', 'Continuous OTA synchronization.'],
      ['External sources', 'Connector architecture, structured file capability, guarded URL capability, internal test connector for non-production validation.', 'Live Airbnb, Agoda, Booking.com, reservation write-back, or broad price write-back.'],
      ['Governance', 'Frozen release with G1-G13 evidence.', 'Informal post-freeze modification.'],
      ['Safety', 'Server authorization, SSRF controls, provenance, duplicate checks, and audit.', 'Security bypasses or client-only draft authority.'],
    ], [0.25, 0.37, 0.38]),
  ]);
  chapter(2, 'Business Capability & Value', ['Business value', 'Provider onboarding', 'Duplicate protection', 'Future scope'], [
    p('The business capability is controlled external-data ingestion for providers. It improves onboarding efficiency by allowing providers to begin from known listing facts, while still requiring provider review and RENTipid policy controls before any draft enters the normal listing lifecycle.'),
    table('Business benefits table', tables.businessBenefits, [0.25, 0.38, 0.37]),
    note('BUSINESS NOTE', 'The connector framework creates future extensibility, but v1.0 does not include active commercial OTA integrations or bidirectional channel management.'),
    p('Future connector potential should prioritize authorized API/OAuth or approved partner integrations, followed by PMS/channel-manager feeds and structured files. Unrestricted scraping should not be used to bypass access controls, terms, security review, or provider authorization.'),
  ]);
  chapter(3, 'Implemented Scope & Limitations', ['Scope', 'Source mode hierarchy', 'Internal Test Connector', 'Production flags'], [
    p('ListingBridge v1.0 implements the import foundation, canonical data contract, durable job model, provider review, corrections, media/location/duplicate intelligence, AI-assisted mapping boundary, observability, and native draft creation integration. The implementation is additive and frozen at application SHA ' + release.appSha + '.'),
    table('Source mode hierarchy and frozen availability', [
      ['Tier', 'Mode', 'Architecture support', 'v1.0 production posture'],
      ['Tier 1', 'Authorized API/OAuth', 'Connector interface supports server-side API/OAuth authorization.', 'No live partner connector; API_CONNECTORS=false.'],
      ['Tier 2', 'PMS/channel manager', 'Tier is modeled for managed partner feeds.', 'Future scope.'],
      ['Tier 3', 'Structured file', 'Structured file import capability is implemented in architecture and tests.', 'FILE_IMPORT=true, but GLOBAL=false blocks production rollout.'],
      ['Tier 4', 'Permitted public URL', 'Secure URL retrieval capability is implemented with SSRF protection.', 'URL_IMPORT=false.'],
      ['Tier 5', 'Manual setup', 'Fallback to native manual listing wizard.', 'Available independently of ListingBridge.'],
    ], [0.14, 0.22, 0.34, 0.30]),
    note('WARNING', 'Do not imply Airbnb, Agoda, or Booking.com are live integrations. They are future roadmap only and are not included in ListingBridge v1.0 frozen release.'),
    p('The Internal Test Connector is deterministic and intended for development, automated tests, Preview, and controlled OAT validation only. Its descriptor is approved for LOCAL, TEST, and PREVIEW, but has PRODUCTION: DISABLED and INTERNAL_ONLY feature status.'),
  ]);

  part('Part II - Provider / End-User Manual');
  chapter(4, 'User Roles & Prerequisites', ['Provider', 'Authentication', 'Rights Confirmation', 'Draft'], [
    p('A provider must be authenticated and must have authority to create listings for the property or rental item being imported. ListingBridge is not a substitute for ownership, management rights, KYC, policy review, or publication approval.'),
    list(['Use a verified provider account where required by RENTipid policy.', 'Confirm you own or manage the property, are authorized to submit the information, can reuse submitted media, and accept accuracy responsibility.', 'Understand that imported information becomes a draft only after review and server-side readiness validation.', 'Continue through the normal Listing Editor and separate submission flow when the draft is ready.']),
  ]);
  chapter(5, 'Getting Started', ['Provider Dashboard', 'Import Existing Listing', 'Manual fallback'], [
    p('Providers enter ListingBridge from the provider listing workflow. The implemented route is /dashboard/provider/listings/import. Manual listing creation remains available at /dashboard/provider/listings/new.'),
    list(['Open Provider Dashboard.', 'Choose Import Existing Listing.', 'Select an available source. In Production v1.0, ListingBridge global rollout is disabled; controlled Preview/OAT used the Internal Test Connector.', 'Continue to authorization.', 'Confirm listing authority, media rights, and accuracy responsibility.', 'Begin secure import.', 'If the source is unavailable or unsuitable, use Create New Listing Directly to open the standard manual wizard.']),
  ]);
  chapter(6, 'Complete ListingBridge User Workflow', ['User workflow', 'READY_FOR_DRAFT', 'DRAFT_CREATED'], [
    p('The user workflow is intentionally review-first. Imported source values are not silently published and should be treated as a starting point for provider confirmation.'),
    table('Provider workflow procedure', [
      ['Step', 'Action', 'Result'],
      ['1', 'Open Provider Dashboard.', 'Listing actions are shown.'],
      ['2', 'Choose Import Existing Listing.', 'ListingBridge import page opens.'],
      ['3', 'Select available source.', 'Source card is selected.'],
      ['4', 'Continue to authorization.', 'Rights confirmation stage opens.'],
      ['5', 'Confirm authority and media rights.', 'Required legal/accuracy attestation is captured.'],
      ['6', 'Begin secure import.', 'Server action creates a durable import job.'],
      ['7', 'Import, extraction, normalization.', 'Canonical contract and field records are prepared.'],
      ['8', 'Review imported information.', 'Fields display values and confidence states.'],
      ['9', 'Understand confidence states.', 'Provider can distinguish verified, review, conflict, missing, and prohibited values.'],
      ['10', 'Review provenance.', 'Source hashes and field records preserve traceability.'],
      ['11', 'Correct a field.', 'Save Correction persists a provider resolution.'],
      ['12', 'Resolve conflicts/missing info.', 'Blocking reasons are removed when valid.'],
      ['13', 'Confirm readiness.', 'Server readiness requires no blockers.'],
      ['14', 'Proceed to draft.', 'READY_FOR_DRAFT screen appears.'],
      ['15', 'Create RENTipid Draft.', 'Native ListingService.createDraft is invoked server-side.'],
      ['16', 'Open draft in Listing Editor.', 'Real Listing.id route opens.'],
      ['17', 'Continue normal workflow.', 'Provider edits photos, pricing, terms, and details as needed.'],
      ['18', 'Submit for review separately.', 'Publication is not automatic.'],
    ], [0.08, 0.34, 0.58]),
  ]);
  chapter(7, 'Understanding Field Status & Confidence', ['Confidence', 'VERIFIED', 'MISSING', 'PROHIBITED'], [
    table('Field status and confidence reference', tables.confidence, [0.20, 0.30, 0.30, 0.20]),
  ]);
  chapter(8, 'Reviewing & Correcting Imported Data', ['Provider correction', 'Provenance', 'Audit'], [
    p('The review screen distinguishes imported values from provider-modified values. Editable fields allow a provider to open an edit dialog, enter a correction, and save the correction. The server action validates ownership against the persisted import job before saving the resolution.'),
    p('A saved correction creates or updates ListingImportResolution with resolution_type PROVIDER_OVERRIDE and updates ListingImportField with the corrected normalized value, VERIFIED confidence, provider_modified=true, and validation_state=VALIDATED. This produces a durable correction trail tied to the authenticated provider.'),
    note('NOTE', 'Prohibited fields cannot be accepted into listing content. Providers must supply allowed replacement text or omit that content.'),
  ]);
  chapter(9, 'Photos, Media & Location', ['Media', 'Location', 'PSGC', 'Photos'], [
    p('Imported media candidates are supplemental. ListingBridge validates media before storage using byte-level MIME sniffing, size limits, and SHA-256 hashing. Duplicates within the same job reuse the existing stored asset path and are marked SKIPPED_DUPLICATE. Invalid media is rejected without necessarily failing the whole import.'),
    p('Location data is normalized through the RENTipid address normalizer and checked against Philippine bounds when coordinates are provided. Coordinates outside 4.5 to 21.5 latitude or 116.0 to 127.0 longitude conflict with Philippine listings and can block readiness. Providers must review uncertain or conflicting location data.'),
  ]);
  chapter(10, 'Duplicate Listings', ['Duplicate detection', 'Idempotency', 'Duplicate'], [
    p('Duplicate checks protect providers and the marketplace from repeated drafts for the same property. The implemented detector considers same source reference, same provider and address/city with title similarity, coordinate proximity within 50 meters, and similar title in the same city for different providers.'),
    table('Duplicate match levels', [
      ['Level', 'Threshold / signal basis', 'Effect'],
      ['EXACT_MATCH', 'Max signal score >= 0.95, including same source reference or near-coordinate same-provider match.', 'Blocks draft readiness.'],
      ['LIKELY_MATCH', 'Max signal score >= 0.75.', 'Requires review.'],
      ['POSSIBLE_MATCH', 'Max signal score >= 0.50.', 'Requires review.'],
      ['NO_MATCH', 'No meaningful duplicate signals.', 'No duplicate blocker.'],
    ], [0.22, 0.48, 0.30]),
    p('Repeat Create Draft does not create duplicate drafts. If ListingImportJob.created_listing_id is already set, the draft service returns the existing Listing.id idempotently.'),
  ]);
  chapter(11, 'User Troubleshooting', ['Troubleshooting', 'Support'], [
    table('User troubleshooting table', tables.troubleshooting, [0.21, 0.27, 0.27, 0.25]),
  ]);

  part('Part III - Operations & Support Manual');
  chapter(12, 'Operating Model', ['Operations', 'Support', 'Audit'], [
    p('The frozen production posture is safe-by-default: LISTINGBRIDGE_GLOBAL=false. Operators should treat ListingBridge as a controlled import subsystem that can be disabled without affecting native manual listing creation or existing listings.'),
    list(['Monitor feature flag posture, connector health, import job state, retries, security blocks, media failures, draft creation failures, and audit events.', 'Support boundaries: guide providers through review and manual fallback; do not fabricate missing facts or bypass security.', 'Expected roles include support operators, administrators, SRE/on-call, security operations, release manager, and engineering maintainer.']),
  ]);
  chapter(13, 'Feature Flags', ['Feature Flags', 'Kill Switch', 'Rollback'], [
    p('Frozen Production feature flags are recorded in the freeze manifest. LISTINGBRIDGE_GLOBAL=false is the master kill-switch and safe rollout state. It blocks connector evaluation and the import entry point while preserving manual listing creation.'),
    table('Feature flag reference', [['Key', 'Purpose', 'Frozen Production Value', 'Effect when OFF', 'Effect when ON', 'Dependencies', 'Operational caution'], ...featureFlags], [0.16, 0.17, 0.10, 0.18, 0.18, 0.11, 0.10]),
  ]);
  chapter(14, 'Job Lifecycle & Support Diagnostics', ['Import Job', 'Job states', 'Retries'], [
    table('Durable state transition reference', [['State', 'Meaning', 'Expected transition', 'Operator concern', 'Recovery / escalation notes'], ...states], [0.17, 0.23, 0.17, 0.22, 0.21]),
    fig('job-lifecycle'),
  ]);
  chapter(15, 'Monitoring & Observability', ['Metrics', 'Health endpoint', 'Observability'], [
    p('Implemented observability includes a ListingBridgeHealthDiagnosticsService, connector health snapshots, durable job timestamps, retry fields, structured logs, alert evaluation, and a metrics collector with safe dimensions. The production health endpoint is /api/health and production verification recorded HTTP 200 with database connected.'),
    table('Implemented metric and signal reference', [
      ['Metric / signal', 'Purpose'],
      ['listingbridge_import_started_total', 'Counts import starts.'],
      ['listingbridge_import_completed_total', 'Counts completed imports.'],
      ['listingbridge_import_failed_total', 'Counts failed imports.'],
      ['listingbridge_connector_failure_total', 'Tracks connector-level failures.'],
      ['listingbridge_ssrf_block_total', 'Tracks blocked SSRF/security retrieval attempts.'],
      ['listingbridge_rate_limit_total', 'Tracks retrieval rate limiting.'],
      ['listingbridge_media_failure_total', 'Tracks media processing failures.'],
      ['listingbridge_duplicate_detected_total', 'Tracks duplicate detection results.'],
      ['listingbridge_review_required_total', 'Tracks jobs requiring provider review.'],
      ['listingbridge_ai_fallback_total', 'Tracks AI-disabled or fail-closed fallback.'],
      ['listingbridge_draft_created_total', 'Counts native draft creations.'],
      ['listingbridge_draft_creation_failure_total', 'Counts draft creation failures.'],
    ], [0.40, 0.60]),
    note('IMPORTANT', 'Metrics use bounded dimensions only: environment, connectorId, resultClass, stage, failureCategory, and aiEnabled. Raw URLs, user IDs, titles, tokens, and customer PII must not be dimensions.'),
  ]);
  chapter(16, 'Incident Response', ['Incident response', 'SSRF', 'Escalation'], [
    table('Incident response escalation matrix', [
      ['Incident', 'Immediate action', 'Escalate to'],
      ['Connector outage', 'Check connector health, upstream status, and flags; keep manual fallback available.', 'SRE and connector owner.'],
      ['External-source failure', 'Classify retryable vs final; preserve user-facing message.', 'Engineering if reproducible.'],
      ['Repeated import failure', 'Review status, last_error_code, retry_count, and source mode.', 'Engineering/SRE.'],
      ['SSRF/security block spike', 'Treat as security event; review actor/source patterns; rate limit or suspend if abusive.', 'SOC/Security.'],
      ['Worker interruption', 'Resume from durable state; never create a draft without checking created_listing_id.', 'Engineering.'],
      ['Media processing failure', 'Check storage and MIME failures; consider MEDIA_IMPORT=false for systemic issue.', 'SRE/Storage owner.'],
      ['Duplicate anomalies', 'Inspect duplicate signals and thresholds.', 'Product and Engineering.'],
      ['Draft creation failure', 'Check readiness blockers, category resolution, and native ListingService constraints.', 'Engineering.'],
      ['Database issue', 'Use standard DB incident process; avoid destructive schema rollback.', 'SRE/DBA.'],
      ['Runtime regression', 'Set GLOBAL=false; consider Vercel rollback to known-good release.', 'Release manager.'],
    ], [0.24, 0.50, 0.26]),
  ]);
  chapter(17, 'Rollback & Kill Switch', ['Rollback', 'Kill Switch', 'Vercel'], [
    p('Feature rollback for the frozen release is LISTINGBRIDGE_GLOBAL=false. Subsystem rollback flags include LISTINGBRIDGE_URL_IMPORT=false, LISTINGBRIDGE_API_CONNECTORS=false, and LISTINGBRIDGE_AVAILABILITY_IMPORT=false.'),
    list(['Manual listing creation remains available and independent.', 'Existing listings and drafts remain intact.', 'No destructive schema rollback is expected because the ListingBridge migration is additive.', 'Use Vercel application rollback where appropriate for runtime regressions.', 'Use forward-fix for additive DB migration issues through reviewed change control.', 'Never run unreviewed production commands or expose secrets in support notes.']),
    fig('flags'),
  ]);

  part('Part IV - Developer / Engineering Reference');
  chapter(18, 'Architecture Overview', ['Architecture', 'Canonical Contract', 'ListingService'], [
    fig('architecture'),
    p('ListingBridge is implemented as an additive Next.js/TypeScript subsystem under src/lib/listingbridge plus provider UI under src/components/listings/listingbridge and server actions under src/app/dashboard/provider/listings/import/actions.ts. The native draft authority remains apps/api/src/services/listingService.ts through ListingService.createDraft.'),
  ]);
  chapter(19, 'Reused Authorities', ['NextAuth', 'RBAC', 'AuditLog', 'AddressService', 'StorageService'], [
    table('Verified reused authorities', [
      ['Authority', 'Repository path', 'ListingBridge use'],
      ['Authentication', 'src/lib/auth.ts; src/app/api/auth/[...nextauth]/route.ts', 'NextAuth v4 server session validation.'],
      ['Provider identity', 'prisma/schema.prisma: User, UserProfile, BusinessProfile', 'Associates import jobs and drafts to provider_id.'],
      ['RBAC', 'src/lib/permissions.ts; src/lib/security/permissions.ts', 'Provider/admin access enforcement.'],
      ['Draft authority', 'apps/api/src/services/listingService.ts', 'ListingService.createDraft creates native Draft listing.'],
      ['Publication authority', 'Existing Listing.status and listing service lifecycle', 'Publication remains outside ListingBridge.'],
      ['Policy', 'src/lib/listingbridge/normalization/prohibited-filter.ts and existing prohibited item authorities', 'Prohibited source data is filtered and marked.'],
      ['Location', 'src/lib/address/AddressService.ts; src/lib/address/normalizer.ts', 'Address normalization and Philippine location handling.'],
      ['Storage', 'src/lib/listingbridge/media/media-storage.ts; src/lib/security/upload-security.ts', 'Validated media storage and upload-security reuse.'],
      ['AI', 'src/lib/listingbridge/ai/*; src/lib/ai/tools/AiToolGateway.ts', 'Read-only and draft-only bounded tools.'],
      ['Audit', 'src/lib/audit.ts; ListingImportAuditEvent', 'Lifecycle and security event trail.'],
      ['Feature flags', 'SystemSetting; src/lib/listingbridge/connectors/feature-flags.ts', 'Runtime capability gates.'],
      ['Database', 'PostgreSQL/Neon/Prisma', 'Durable import records and native Listing records.'],
    ], [0.22, 0.32, 0.46]),
  ]);
  chapter(20, 'Connector Architecture', ['Connector', 'Internal Test Connector', 'Environment'], [
    p('The canonical connector contract is ListingBridgeConnector in src/lib/listingbridge/connectors/types.ts. It declares config, identifySource(), getCapabilities(), authorize(), fetchListing(), fetchMedia(), fetchAvailability(), normalize(), validateResponse(), and healthCheck().'),
    fig('connector'),
    table('Connector control fields', [
      ['Control', 'Purpose'],
      ['Capability declaration', 'Advertises listing facts, media, availability, structured file, URL retrieval, API/OAuth, rights confirmation, and AI-assisted mapping support.'],
      ['Environment status', 'LOCAL, TEST, PREVIEW, and PRODUCTION each declare APPROVED/DISABLED/REVIEW_REQUIRED/BLOCKED.'],
      ['Feature flags', 'Required global and capability flags are evaluated before availability.'],
      ['Authorization type', 'NONE, rights confirmation, server-side API key/OAuth, signed URL, file upload, public URL, or manual input.'],
      ['Retry and timeout policy', 'Per-connector bounded attempts, delays, redirects, and response size.'],
      ['Compliance and health', 'Compliance must be approved and health cannot be disabled/unhealthy for availability.'],
    ], [0.28, 0.72]),
    note('DEVELOPER NOTE', 'The Internal Test Connector id is internal.test.fixture. It is deterministic, version 1.0.0, TIER_3_FILE, INTERNAL_ONLY, PREVIEW-approved, and Production-disabled.'),
  ]);
  chapter(21, 'Canonical Import Contract', ['Canonical Contract', 'Provenance'], [
    p('The canonical import contract lives in src/lib/listingbridge/types/canonical-contract.ts with schemaVersion rentipid.listingbridge.v1. It is parsed through a Zod schema before persistence or downstream use.'),
    table('Canonical contract groups', [
      ['Group', 'Purpose'],
      ['source', 'Connector id, tier, source reference hash/label, authorization method, extraction timestamp.'],
      ['identity', 'Provider id, optional import job id, idempotency key.'],
      ['property', 'Title, description, category suggestion, condition, property type.'],
      ['location', 'Raw address, city, province, country, postal code, latitude, longitude, PSGC code.'],
      ['capacity', 'Quantity, max guests, bedrooms, bathrooms.'],
      ['rooms', 'Room names, types, bed counts, sleeps values.'],
      ['amenities[]', 'Canonical amenity terms.'],
      ['rules', 'General rules, duration limits, pickup/delivery flags, delivery fee.'],
      ['pricingHints', 'Hourly/daily/weekly/monthly rates, deposit, replacement value, PHP currency.'],
      ['availability', 'Availability dates, source calendar hash, provider confirmation flag.'],
      ['media[]', 'Source reference hash, label, caption, cover flag, order, MIME, content hash, confidence.'],
      ['provenance', 'Raw payload hash, AI assisted flag, AI non-authority, model version, fact count, corrections, rejected fields.'],
      ['fieldConfidence', 'Per-field confidence state, score, authority, provenance, review and confirmation markers.'],
      ['unresolvedFields[]', 'Blocking or optional gaps with expected correction source.'],
    ], [0.25, 0.75]),
    p('External source objects never write directly to Listing. They are normalized into this contract, reviewed, validated, then mapped to the native draft payload only after readiness.'),
  ]);
  chapter(22, 'Data Mapping, Provenance & Confidence', ['Mapping', 'Provenance', 'AI Mapping'], [
    p('The normalization pipeline uses deterministic aliases in StructuredFactExtractor, taxonomy mapping for property and amenities, prohibited data filtering, commercial/rule classification, conflict detection, optional bounded AI suggestions, and Zod validation. Source values are hashed and attached to provenance rather than exposing sensitive source data.'),
    p('Provider corrections become ListingImportResolution records and update field records with provider_modified=true. AI-assisted values remain advisory and reviewable; contract validation explicitly marks aiOutputAuthoritative=false.'),
  ]);
  chapter(23, 'Database Model', ['Database', 'Prisma', 'Migration'], [
    fig('database'),
    table('ListingBridge additive entities', tables.dbEntities, [0.17, 0.22, 0.21, 0.20, 0.20]),
  ]);
  chapter(24, 'Migrations & Production Database History', ['Migration', 'Baseline', 'Neon'], [
    p('The canonical release migration is ' + release.migration + '. It is additive: it creates four enums and six new ListingBridge tables plus indexes and foreign keys to User, Listing, and AuditLog.'),
    p('Frozen production migration count is 60. During the controlled G9 deployment, 59 historical production migrations were baselined before the ListingBridge migration. This reconciliation was required so Prisma migrate status could become clean without replaying already-applied historical production changes.'),
    note('WARNING', 'This history is not an instruction for casual manual database manipulation. Future schema changes require reviewed migration/change-control procedures and appropriate environment isolation.'),
  ]);
  chapter(25, 'Import Repository & Durable Jobs', ['ListingImportRepository', 'Durability', 'Retries'], [
    p('ListingImportRepository creates or returns jobs by idempotency key, attaches source records, upserts field provenance, validates state transitions, stores canonical payloads, increments retry count for retryable failures, and records status-change audit events. Durable state includes provider_id, source connector/tier, hashes, status, retries, lock metadata, errors, timestamps, and optional created_listing_id.'),
  ]);
  chapter(26, 'Readiness & Draft Creation', ['Draft creation', 'ListingService', 'OAT'], [
    p('Final implementation corrected the browser flow exposed during OAT. Earlier OAT found a client-only mock draft id that caused a draft editor 404. The frozen implementation uses Server Actions and real database persistence.'),
    p('The browser can initiate the action and submit the current review snapshot, but it cannot create a native draft by itself. createNativeDraftAction re-resolves the authenticated session, fetches the persisted import job, verifies job.provider_id equals session.user.id, checks idempotent reuse of created_listing_id, then delegates to ListingBridgeDraftCreationService. The service recalculates readiness, maps the reviewed canonical snapshot to a native payload, invokes ListingService.createDraft, records created_listing_id, writes DRAFT_COMMITTED audit evidence, and returns the actual Listing.id.'),
    note('IMPORTANT', 'Repeat creation is idempotent. If created_listing_id is already present and belongs to the provider, the existing draft id is returned instead of creating another Listing. The resulting Listing.status is Draft and is not automatically published.'),
    fig('draft-sequence'),
  ]);
  chapter(27, 'Security Architecture', ['Security', 'SSRF', 'MIME', 'Prompt injection'], [
    fig('security'),
    p('All external content is treated as untrusted. The secure retrieval layer defaults to HTTPS, rejects embedded credentials, blocks local and cloud metadata hostnames, resolves DNS, rejects unsafe IPv4/IPv6 ranges, pins the request to a prevalidated address, revalidates redirect targets, strips sensitive headers on cross-origin redirects, enforces timeout caps, enforces response-size caps, restricts content types, rate limits retrieval, and writes security audit events on block.'),
    p('Blocked ranges include unspecified IPv4, private IPv4 10/8, 172.16/12, 192.168/16, carrier-grade NAT 100.64/10, loopback 127/8, link-local 169.254/16, AWS/GCP/Azure/Alibaba metadata addresses captured in code, IPv6 loopback, link-local, and unique-local ranges.'),
    p('File and media controls include MIME and magic-byte validation, size constraints, content hashing, duplicate detection, and storage through RENTipid-managed paths. AI controls include safe context construction, prohibited-field stripping, explicit untrusted-source delimiters, structured output validation, and tool allowlists. Authorization is re-resolved server-side for corrections, rights confirmation, and draft creation.'),
  ]);
  chapter(28, 'AI Operating Boundary', ['AI', 'AiToolGateway', 'Deterministic policy'], [
    table('AI boundary', [
      ['AI may assist with', 'AI may not do'],
      ['Semantic amenity mapping.', 'Make ownership decisions.'],
      ['Property category suggestions.', 'Approve KYC or publication.'],
      ['Structured fact extraction support.', 'Override policy, duplicate, or security controls.'],
      ['Missing-field identification.', 'Fabricate missing factual data.'],
      ['Conflict explanations and summaries.', 'Browse unrestricted external sources.'],
      ['Original description drafting from verified facts.', 'Mutate databases directly or create published listings.'],
    ], [0.50, 0.50]),
    p('Deterministic policy authority remains final. If AI is disabled through LISTINGBRIDGE_AI_MAPPING=false or if AI output fails validation, the import continues through deterministic mapping and provider review where possible.'),
  ]);
  chapter(29, 'Media, Location & Duplicate Intelligence', ['Media', 'Location', 'Duplicate thresholds'], [
    p('Media validation accepts image/jpeg, image/png, image/webp, and image/gif with a default max size of 10 MB and minimum size of 100 bytes. MIME sniffing checks JPEG, PNG, GIF, and WEBP magic bytes and validates declared MIME compatibility.'),
    p('Duplicate detection uses same source reference, coordinate proximity under 50 meters, same-provider city with title similarity >= 0.7, and different-provider same-city title similarity >= 0.85. Match levels are exact at scores >= 0.95, likely at >= 0.75, possible at >= 0.50. Exact matches block readiness; likely and possible matches require review.'),
  ]);
  chapter(30, 'Idempotency & Recovery', ['Idempotency', 'Recovery'], [
    p('Job idempotency is enforced by ListingImportJob.idempotency_key. Media dedupe uses content_sha256 and per-job unique constraints. Draft idempotency uses ListingImportJob.created_listing_id and returns an existing draft if present. Retryable failures increment retry_count and move to FAILED_FINAL when retry_count reaches max_retries, which defaults to 3.'),
  ]);
  chapter(31, 'API / Server Action / UI Integration', ['Server Actions', 'ListingBridgeWizard', 'UI'], [
    p('The provider import route is src/app/dashboard/provider/listings/import/page.tsx. It renders src/components/listings/listingbridge/ListingBridgeWizard.tsx and uses src/lib/listingbridge/ui/actions.ts to discover available connectors. Browser interactions call Server Actions in src/app/dashboard/provider/listings/import/actions.ts.'),
    table('UI and server responsibilities', [
      ['Component', 'Responsibility'],
      ['ListingBridgeWizard', 'Source selection, rights confirmation UI, review table, corrections, draft-ready screen, editor link.'],
      ['startImportAction', 'Authenticates user, creates durable job, runs test connector path in controlled environments, stores canonical payload and field records.'],
      ['saveCorrectionAction', 'Authenticates user, verifies ownership, persists field resolution and verified field state.'],
      ['confirmRightsAction', 'Authenticates user, verifies ownership, persists rights confirmation and authorization audit event.'],
      ['createNativeDraftAction', 'Authenticates user, verifies ownership and idempotency, delegates to draft creation service.'],
      ['ListingBridgeDraftCreationService', 'Rebuilds/evaluates readiness, maps payload, invokes ListingService.createDraft, completes job.'],
    ], [0.33, 0.67]),
    fig('draft-sequence'),
  ]);
  chapter(32, 'Testing & Acceptance', ['Testing', 'Acceptance', 'OAT'], [
    p('Controlled OAT defect repair evidence records ListingBridge Test Suite 32/32 suites passing and 212/212 tests passing. Local and Preview acceptance records carry 52/52 mandatory acceptance criteria PASS. Acceptance categories include functional behavior, mapping/data quality, authorization/rights, security, media/location, duplicate/idempotency, AI, UX/resilience, audit, and regression.'),
    table('Acceptance summary matrix', [
      ['Category', 'IDs', 'Count', 'Status'],
      ['Confidence & Review', 'LB-CONF-001 to LB-CONF-008', '8', 'PASS'],
      ['Core Functionality', 'LB-FUNC-001 to LB-FUNC-008', '8', 'PASS'],
      ['Connectors & Registry', 'LB-CONN-001 to LB-CONN-004', '4', 'PASS'],
      ['Security & SSRF', 'LB-SEC-001 to LB-SEC-008', '8', 'PASS'],
      ['Media Intelligence', 'LB-MEDIA-001 to LB-MEDIA-004', '4', 'PASS'],
      ['Location & PSGC', 'LB-LOC-001 to LB-LOC-004', '4', 'PASS'],
      ['Duplicate Intelligence', 'LB-DUP-001 to LB-DUP-004', '4', 'PASS'],
      ['UX & Provider Actions', 'LB-UX-001 to LB-UX-004', '4', 'PASS'],
      ['Unified AI & Fallback', 'LB-AI-001 to LB-AI-004', '4', 'PASS'],
      ['Observability & Health', 'LB-OBS-001 to LB-OBS-004', '4', 'PASS'],
    ], [0.30, 0.38, 0.12, 0.20]),
  ]);
  chapter(33, 'Release Lifecycle G1-G13', ['G1-G13', 'No-substitution rule', 'OAT'], [
    fig('release'),
    table('Release gate record', [
      ['Gate', 'Purpose', 'Final status', 'Important evidence'],
      ['G1 CODE COMPLETE', 'Final code complete and independently repaired after OAT findings.', 'PASS', 'OAT defect repair evidence and 32/32 suites.'],
      ['G2 LOCAL FUNCTIONAL', 'Application and import functions operate locally.', 'PASS', 'Local functional evidence.'],
      ['G3 LOCAL DATABASE MIGRATED', 'Local DB has migration objects.', 'PASS', 'Local database migrated evidence.'],
      ['G4 LOCAL REQUIRED DATA SEEDED/SYNCED', 'Feature flags and required data synced.', 'PASS', 'Seed/sync evidence.'],
      ['G5 LOCAL ACCEPTANCE PASS', 'Mandatory local acceptance verified.', 'PASS', '52/52 acceptance criteria.'],
      ['G6 PREVIEW MIGRATED', 'Preview database migration applied.', 'PASS', 'Preview migration evidence.'],
      ['G7 PREVIEW ACCEPTANCE PASS', 'Automated Preview plus human OAT.', 'PASS', 'Preview acceptance and Owner OAT.'],
      ['G8 PRODUCTION-READY', 'Release readiness and rollback posture.', 'PASS', 'Production readiness evidence.'],
      ['G9 PRODUCTION DEPLOYMENT/VERIFICATION', 'Production deployed and verified.', 'PASS', 'Deployment dpl_G4kvoqxoMUUnDMQZFBirfEwt5Ch3.'],
      ['G10 COMPLETED', 'Technical completion.', 'PASS', 'Completion record.'],
      ['G11 ACCEPTED', 'Owner business acceptance.', 'PASS', 'Owner acceptance record.'],
      ['G12 CLOSED', 'Module closure.', 'PASS', 'Closure record.'],
      ['G13 VERSION FROZEN', 'Immutable release baseline.', 'PASS', 'Freeze record and tag.'],
    ], [0.15, 0.28, 0.12, 0.45]),
    note('IMPORTANT', 'No-substitution rule: build is not local functional; local functional is not acceptance; Preview deployment is not Preview acceptance; automated Preview is not Owner OAT; production-ready is not production deployment; deployment is not accepted; closed is not frozen.'),
  ]);
  chapter(34, 'Deployment & Frozen Release Record', ['Deployment', 'Version Freeze', 'Release Tag'], [
    table('Frozen release identifiers', [
      ['Identifier', 'Value'],
      ['Application SHA', release.appSha],
      ['Production deployment', release.deployment],
      ['Production URL', release.url],
      ['Release tag', release.tag],
      ['Freeze docs commit', release.freezeDocsCommit],
      ['Canonical migration', release.migration],
      ['Release state', 'VERSION FROZEN'],
    ], [0.35, 0.65]),
    p('The application SHA identifies the deployed and accepted application release. Documentation and evidence commits after that point preserve audit history and do not replace the accepted application SHA. Any change after freeze requires controlled change and a new lifecycle sequence.'),
  ]);

  part('Part V - Business Governance & Future Roadmap');
  chapter(35, 'Governance & Change Control', ['Governance', 'Controlled Change', 'Freeze'], [
    p('ListingBridge v1.0 is frozen. No informal modification to source code, tests, schema, production configuration, feature flags, deployment state, or release evidence is permitted as an in-place change to the baseline.'),
    list(['Open a controlled change request.', 'Assess user, operational, security, database, and business impact.', 'Reopen relevant gates and produce new evidence.', 'Version the changed module rather than mutating the frozen record.', 'Maintain owner acceptance and release-management traceability.']),
  ]);
  chapter(36, 'Future OTA Connector Strategy', ['OTA', 'Airbnb', 'Agoda', 'Booking.com', 'PMS'], [
    note('BUSINESS NOTE', 'Airbnb, Agoda, Booking.com, PMS/channel-manager production connectors, continuous channel synchronization, reservation write-back, and broad price write-back are NOT INCLUDED IN LISTINGBRIDGE v1.0 FROZEN RELEASE.'),
    p('The preferred future strategy is authorized API/OAuth or approved partner integration -> Connector Adapter -> existing ListingBridge canonical pipeline -> Provider Review -> Native RENTipid Draft. Future work should not bypass access controls, provider authorization, KYC, publication review, SSRF controls, or security/legal review.'),
  ]);

  part('Part VI - Reference Appendices');
  chapter('A', 'Complete Terminology / Glossary', ['Glossary', 'Terminology'], [
    table('Glossary', glossaryRows(), [0.28, 0.72]),
  ]);
  chapter('B', 'Feature Flag Reference', ['Feature Flags'], [
    table('Complete feature flag reference', [['Key', 'Purpose', 'Frozen Production Value', 'Operational Effect', 'Dependencies', 'Change-Control Note'], ...featureFlags.map(f => [f[0], f[1], f[2], `${f[3]} / ${f[4]}`, f[5], f[6]])], [0.16, 0.18, 0.10, 0.27, 0.14, 0.15]),
  ]);
  chapter('C', 'Import Job State Reference', ['Job states'], [
    table('Complete import job state transition table', [['State', 'Meaning', 'Expected transition', 'Operator concern', 'Recovery / escalation notes'], ...states], [0.17, 0.23, 0.17, 0.22, 0.21]),
  ]);
  chapter('D', 'Acceptance Test Catalogue', ['Acceptance catalogue'], [
    table('All 52 frozen mandatory acceptance IDs', [['Acceptance ID', 'Scenario', 'Status'], ...acceptance], [0.24, 0.56, 0.20]),
  ]);
  chapter('E', 'Support Troubleshooting Matrix', ['Support troubleshooting'], [
    table('Detailed operator support table', tables.supportTroubleshooting, [0.24, 0.27, 0.29, 0.20]),
  ]);
  chapter('F', 'Security Control Matrix', ['Security matrix'], [
    table('Security control matrix', tables.securityMatrix, [0.18, 0.24, 0.23, 0.18, 0.17]),
  ]);
  chapter('G', 'File / Component Reference', ['File reference', 'Components'], [
    table('Developer file and component quick reference', fileReferenceRows(), [0.30, 0.36, 0.34]),
  ]);
  chapter('H', 'Database Entity Reference', ['Database'], [
    table('Database entity reference', tables.dbEntities, [0.17, 0.22, 0.21, 0.20, 0.20]),
  ]);
  chapter('I', 'Release / Evidence Reference', ['Evidence', 'Release'], [
    table('Release and evidence reference', [
      ['Item', 'Value'],
      ['Application SHA', release.appSha],
      ['Freeze docs commit', release.freezeDocsCommit],
      ['Release tag', release.tag],
      ['Preview deployment', 'dpl_37GAd7SmgPunNayBcsvxuR6214kt'],
      ['Production deployment', release.deployment],
      ['Production URL', release.url],
      ['Canonical migration', release.migration],
      ['Local acceptance', '52/52 PASS'],
      ['Preview automated acceptance', '52/52 PASS'],
      ['Owner OAT', 'PASS'],
      ['Owner business acceptance', 'PASS'],
      ['Evidence root', 'docs/listingbridge/evidence/ListingBridge-v1.0/'],
      ['Evidence directories', '00-baseline through 15-freeze, including architecture, code complete, local/preview acceptance, OAT, production readiness, deployment, completion, acceptance, closure, and freeze.'],
    ], [0.30, 0.70]),
  ]);
  chapter('J', 'Quick Reference Cards', ['Quick reference'], [
    table('Provider user quick reference', [
      ['Do', 'Remember'],
      ['Use Import Existing Listing when available.', 'You must confirm authority and media rights.'],
      ['Review every imported field.', 'Please Review means inspect before relying on it.'],
      ['Correct missing or conflicting fields.', 'ListingBridge creates only Draft listings.'],
      ['Open the draft in Listing Editor.', 'Submit for review separately when ready.'],
    ], [0.50, 0.50]),
    table('Support operator quick reference', [
      ['Check', 'Action'],
      ['Feature flags', 'GLOBAL=false disables import safely.'],
      ['Job status', 'Use status, retry_count, last_error_code, and audit events.'],
      ['Security blocks', 'Do not bypass; escalate SSRF spikes.'],
      ['Draft issues', 'Check created_listing_id before retry.'],
    ], [0.45, 0.55]),
    table('Developer quick reference', [
      ['Area', 'Primary path'],
      ['Types/contracts', 'src/lib/listingbridge/types/'],
      ['Connectors', 'src/lib/listingbridge/connectors/'],
      ['Repository', 'src/lib/listingbridge/repository/listing-import-repository.ts'],
      ['Draft creation', 'src/lib/listingbridge/draft/draft-creation-service.ts'],
      ['UI', 'src/components/listings/listingbridge/ListingBridgeWizard.tsx'],
    ], [0.45, 0.55]),
    table('Business owner quick reference', [
      ['Decision point', 'v1.0 answer'],
      ['Is it live OTA sync?', 'No. One-time controlled import to Draft.'],
      ['Can it publish?', 'No. Existing approval lifecycle remains authoritative.'],
      ['Can it be disabled?', 'Yes. GLOBAL=false.'],
      ['Are future connectors possible?', 'Yes, through controlled change and approved integrations.'],
    ], [0.45, 0.55]),
  ]);
  return c;
}

function glossaryRows() {
  return [
    ['ListingBridge', 'RENTipid subsystem for importing external listing facts into a native draft after review.'],
    ['Provider', 'Authenticated RENTipid user or business profile authorized to create listings.'],
    ['Listing', 'Native RENTipid marketplace record controlled by existing listing lifecycle.'],
    ['Draft', 'Unpublished Listing.status created before submission/review/publication.'],
    ['Import Job', 'Durable ListingImportJob record tracking source, status, payload, retry, and draft linkage.'],
    ['Connector', 'Adapter implementing ListingBridgeConnector methods for a source mode.'],
    ['Canonical Import Contract', 'rentipid.listingbridge.v1 normalized data shape used before draft mapping.'],
    ['Provenance', 'Field/source evidence including hashes, timestamps, and authority.'],
    ['Confidence', 'Field status used for review and readiness.'],
    ['VERIFIED', 'Provider or deterministic trusted confirmation.'],
    ['HIGH_CONFIDENCE', 'Strong imported/normalized confidence.'],
    ['REVIEW_RECOMMENDED', 'Needs provider inspection.'],
    ['CONFLICT', 'Contradictory or invalid data requiring resolution.'],
    ['MISSING', 'Expected information not found.'],
    ['PROHIBITED', 'Data excluded by policy/security rules.'],
    ['Authorization', 'Server-side confirmation of actor rights or connector access.'],
    ['Rights Confirmation', 'Provider attestation of property authority, media rights, and accuracy responsibility.'],
    ['RBAC', 'Role-based access control.'],
    ['SSRF', 'Server-side request forgery; blocked by URL/DNS/IP/redirect policy.'],
    ['Idempotency', 'Repeat-safe behavior returning existing job or draft rather than duplicating.'],
    ['Duplicate Detection', 'Signals that identify same or similar existing listings/imports.'],
    ['Feature Flag', 'SystemSetting runtime switch controlling ListingBridge capabilities.'],
    ['Kill Switch', 'LISTINGBRIDGE_GLOBAL=false production-safe disable state.'],
    ['OAT', 'Owner Operational Acceptance Test.'],
    ['Preview', 'Non-production Vercel deployment/database used for acceptance.'],
    ['Production', 'Live rentipid.com.ph deployment and database.'],
    ['Migration', 'Prisma schema change applied through migration history.'],
    ['Baseline', 'Controlled known-good state before applying release migration.'],
    ['Freeze', 'Immutable accepted version state requiring controlled change for modification.'],
    ['Controlled Change', 'Formal post-freeze change process with impact assessment and evidence.'],
    ['AI Mapping', 'Bounded semantic assistance for taxonomy and review support.'],
    ['Draft-Only Boundary', 'Rule that ListingBridge creates only Draft listings.'],
    ['PMS', 'Property management system or channel manager source.'],
    ['OTA', 'Online travel agency such as Airbnb, Agoda, or Booking.com.'],
    ['API', 'Programmatic source interface.'],
    ['OAuth', 'Authorization flow for delegated API access.'],
    ['MIME', 'Media/content type identifier verified against bytes.'],
    ['PSGC', 'Philippine Standard Geographic Code hierarchy.'],
    ['Audit Event', 'Durable evidence of lifecycle, security, correction, or draft action.'],
    ['Trace ID', 'Correlation identifier for logs, metrics, and support investigation.'],
    ['ListingService', 'Native RENTipid listing authority containing createDraft lifecycle.'],
  ];
}

function fileReferenceRows() {
  return [
    ['Canonical contract', 'Defines rentipid.listingbridge.v1 schema, confidence states, source identity, media, provenance.', 'src/lib/listingbridge/types/canonical-contract.ts'],
    ['Job state types', 'Lists job/asset/resolution/audit states and legal transitions.', 'src/lib/listingbridge/types/job-state.ts'],
    ['Connector interface', 'Defines ListingBridgeConnector method contract.', 'src/lib/listingbridge/connectors/types.ts'],
    ['Connector descriptor', 'Defines capability, environment, compliance, health, timeout, retry, and feature controls.', 'src/lib/listingbridge/connectors/descriptor.ts'],
    ['Connector registry', 'Registers, filters, and evaluates connector availability.', 'src/lib/listingbridge/connectors/registry.ts'],
    ['Feature flags', 'Maps capabilities to SystemSetting flags and manual-flow independence.', 'src/lib/listingbridge/connectors/feature-flags.ts'],
    ['Environment resolver', 'Distinguishes VERCEL_ENV Preview/Production and fails closed.', 'src/lib/listingbridge/connectors/environment.ts'],
    ['Internal test connector', 'Deterministic fixture connector disabled in Production.', 'src/lib/listingbridge/connectors/test-connector.ts'],
    ['Seed settings', 'Idempotently seeds required ListingBridge SystemSetting rows.', 'src/lib/listingbridge/connectors/seed.ts'],
    ['SSRF service', 'Validates URLs, hostnames, DNS, IP ranges, and redirects.', 'src/lib/listingbridge/security/ssrf-protection.ts'],
    ['Secure retrieval', 'Pinned-address HTTP retrieval with header stripping, content limits, audit, and rate limiting.', 'src/lib/listingbridge/retrieval/secure-http-retrieval.ts'],
    ['Retrieval policy', 'Default and hard retrieval limits.', 'src/lib/listingbridge/retrieval/policy.ts'],
    ['Rate control', 'Database-backed retrieval rate limit helper.', 'src/lib/listingbridge/retrieval/rate-control.ts'],
    ['Extraction', 'Alias-based structured fact extraction.', 'src/lib/listingbridge/extraction/structured-extractor.ts'],
    ['Normalization pipeline', 'Maps facts, filters prohibited data, detects conflicts, optional AI assistance.', 'src/lib/listingbridge/normalization/pipeline.ts'],
    ['Review snapshot', 'Builds provider review model and readiness summary.', 'src/lib/listingbridge/review/review-snapshot-engine.ts'],
    ['Readiness engine', 'Evaluates rights, duplicate, location, media, status, and field blockers.', 'src/lib/listingbridge/review/draft-readiness-engine.ts'],
    ['Provider corrections', 'Applies validated provider corrections.', 'src/lib/listingbridge/review/provider-correction-service.ts'],
    ['Import repository', 'Durable job/source/field/status persistence.', 'src/lib/listingbridge/repository/listing-import-repository.ts'],
    ['Draft service', 'Server-side draft creation and idempotency.', 'src/lib/listingbridge/draft/draft-creation-service.ts'],
    ['Draft mapper', 'Maps review snapshot to native draft payload.', 'src/lib/listingbridge/draft/draft-payload-mapper.ts'],
    ['Media security', 'MIME sniffing, size limits, and hash generation.', 'src/lib/listingbridge/media/media-security.ts'],
    ['Media pipeline', 'Media candidate retrieval, validation, storage, and duplicate handling.', 'src/lib/listingbridge/media/media-ingestion-pipeline.ts'],
    ['Location intelligence', 'Address normalization and Philippine bounds checks.', 'src/lib/listingbridge/location/location-intelligence.ts'],
    ['Duplicate detector', 'Exact/likely/possible duplicate signal logic.', 'src/lib/listingbridge/duplicates/duplicate-detector.ts'],
    ['AI tools', 'Read-only and draft-only ListingBridge AI tools.', 'src/lib/listingbridge/ai/tools.ts'],
    ['Safe AI context', 'Filters prohibited fields and delimits untrusted source data.', 'src/lib/listingbridge/ai/safe-context-builder.ts'],
    ['AI service', 'Review summary, missing fields, conflict explanation, mapping, description draft.', 'src/lib/listingbridge/ai/listingbridge-ai-service.ts'],
    ['Metrics', 'Bounded-dimension metrics collector.', 'src/lib/listingbridge/observability/metrics.ts'],
    ['Health', 'ListingBridge health diagnostics service.', 'src/lib/listingbridge/observability/health.ts'],
    ['Alerts', 'SSRF, draft failure, and connector outage alert conditions.', 'src/lib/listingbridge/observability/alerts.ts'],
    ['Provider import route', 'Renders ListingBridge import page.', 'src/app/dashboard/provider/listings/import/page.tsx'],
    ['Provider server actions', 'Start import, save correction, confirm rights, create native draft.', 'src/app/dashboard/provider/listings/import/actions.ts'],
    ['Wizard UI', 'Client source selection, review, correction, draft handoff.', 'src/components/listings/listingbridge/ListingBridgeWizard.tsx'],
    ['Prisma schema', 'ListingBridge models and enums.', 'prisma/schema.prisma'],
    ['Migration SQL', 'Canonical additive ListingBridge migration.', 'prisma/migrations/20260831000000_add_listingbridge_import_job_foundation/migration.sql'],
  ];
}

async function ensureAssets() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  for (const d of diagrams) {
    const svg = makeSvg(d);
    fs.writeFileSync(path.join(ASSET_DIR, `${d.id}.svg`), svg, 'utf8');
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSET_DIR, `${d.id}.png`));
  }
}

function makeSvg(diagram) {
  const w = 920;
  const rowH = 54;
  const h = Math.max(260, 92 + diagram.nodes.length * rowH + (diagram.side ? 70 : 0));
  const mainX = 150;
  const mainW = 430;
  const sideX = 640;
  const colors = { accent: '#1d4ed8', border: '#334155', fill: '#eff6ff', side: '#f8fafc', text: '#0f172a' };
  let out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `<rect width="${w}" height="${h}" fill="white"/>`,
    `<text x="40" y="34" font-family="Arial" font-size="20" font-weight="700" fill="${colors.text}">${escapeXml(diagram.caption)}</text>`];
  diagram.nodes.forEach((n, i) => {
    const y = 66 + i * rowH;
    out.push(`<rect x="${mainX}" y="${y}" width="${mainW}" height="34" rx="5" fill="${colors.fill}" stroke="${colors.border}" stroke-width="1.2"/>`);
    out.push(`<text x="${mainX + mainW / 2}" y="${y + 22}" text-anchor="middle" font-family="Arial" font-size="13" fill="${colors.text}">${escapeXml(n)}</text>`);
    if (i < diagram.nodes.length - 1) {
      out.push(`<line x1="${mainX + mainW / 2}" y1="${y + 34}" x2="${mainX + mainW / 2}" y2="${y + rowH}" stroke="${colors.accent}" stroke-width="2" marker-end="url(#arrow)"/>`);
    }
  });
  if (diagram.side) {
    out.push(`<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="${colors.accent}"/></marker></defs>`);
    out.push(`<rect x="${sideX}" y="66" width="230" height="${Math.max(160, diagram.side.length * 28 + 26)}" rx="5" fill="${colors.side}" stroke="#94a3b8"/>`);
    out.push(`<text x="${sideX + 12}" y="90" font-family="Arial" font-size="13" font-weight="700" fill="${colors.text}">Supporting systems</text>`);
    diagram.side.forEach((s, i) => out.push(`<text x="${sideX + 18}" y="${116 + i * 24}" font-family="Arial" font-size="12" fill="${colors.text}">- ${escapeXml(s)}</text>`));
  } else {
    out.push(`<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L6,3 z" fill="${colors.accent}"/></marker></defs>`);
  }
  out.push('</svg>');
  return out.join('\n');
}

function escapeXml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));
}

function buildMarkdown(content) {
  const lines = [
    '---',
    `title: "${release.title} ${release.subtitle}"`,
    `date: "${publicationDate}"`,
    '---',
    '',
    `# ${release.title}`,
    '',
    `## ${release.subtitle}`,
    '',
    `**Document classification:** ${release.classification}`,
    '',
    '## Document Control',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Document | RENTipid ListingBridge v1.0 Complete Reference Manual |`,
    `| Module Version | ${release.moduleVersion} |`,
    `| Application Release SHA | ${release.appSha} |`,
    `| Release Tag | ${release.tag} |`,
    `| Production Deployment | ${release.deployment} |`,
    `| Production URL | ${release.url} |`,
    `| Release State | VERSION FROZEN |`,
    `| Change Control | Controlled change required after freeze |`,
    `| Publication date | ${publicationDate} |`,
    '',
    '## Intended Audiences',
    '',
    'Users/providers, operators/support/administrators, developers/maintainers, and business owners/product owners.',
    '',
    '## How To Use This Manual',
    '',
    'Use Parts I and V for business/governance context, Part II for provider use, Part III for operations, Part IV for engineering details, and Part VI for quick references.',
    '',
  ];
  for (const item of content) {
    if (item.type === 'part') {
      lines.push('', `# ${item.title}`, '');
      continue;
    }
    lines.push('', `## Chapter ${item.num} - ${item.title}`, '');
    for (const b of item.body) {
      if (b.type === 'p') lines.push(b.text, '');
      if (b.type === 'callout') lines.push(`> **${b.kind}:** ${b.text}`, '');
      if (b.type === 'list') lines.push(...b.items.map(x => `- ${x}`), '');
      if (b.type === 'figure') {
        const d = diagrams.find(x => x.id === b.id);
        lines.push(`![${d.caption}](assets/${d.id}.png)`, '');
      }
      if (b.type === 'table') {
        lines.push(`**Table: ${b.caption}**`, '');
        lines.push(markdownTable(b.rows), '');
      }
    }
  }
  lines.push('', '# Alphabetical Index', '', 'The final PDF includes generated page-numbered index entries. This editable source preserves the same subject terms for regeneration.', '');
  return lines.join('\n');
}

function markdownTable(rows) {
  const cols = rows[0].length;
  const header = `| ${rows[0].join(' | ')} |`;
  const sep = `| ${Array.from({ length: cols }, () => '---').join(' | ')} |`;
  const body = rows.slice(1).map(r => `| ${r.map(v => String(v).replace(/\|/g, '\\|')).join(' | ')} |`);
  return [header, sep, ...body].join('\n');
}

class PdfRenderer {
  constructor(refs = {}) {
    this.refs = refs;
    this.headings = [];
    this.figures = [];
    this.tables = [];
    this.index = new Map();
    this.mainStartIndex = null;
    this.figureNo = 0;
    this.tableNo = 0;
    this.content = makeContent();
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 64, bottom: 64, left: 50, right: 50 },
      bufferPages: true,
      autoFirstPage: false,
      info: {
        Title: `${release.title} ${release.subtitle}`,
        Author: 'RENTipid',
        Subject: 'ListingBridge v1.0 complete reference manual',
        Keywords: 'RENTipid, ListingBridge, operations, developer, business, user manual',
      },
    });
    this.pageKind = [];
  }

  async render(filePath) {
    const chunks = [];
    this.doc.on('data', c => chunks.push(c));
    const done = new Promise(resolve => this.doc.on('end', resolve));
    this.cover();
    this.frontMatter();
    this.renderContent();
    this.renderIndex();
    this.addHeadersFooters();
    const pageCount = this.doc.bufferedPageRange().count;
    this.doc.end();
    await done;
    fs.writeFileSync(filePath, Buffer.concat(chunks));
    return {
      headings: this.headings,
      figures: this.figures,
      tables: this.tables,
      index: mapToObj(this.index),
      mainStartIndex: this.mainStartIndex,
      pageCount,
    };
  }

  addPage(kind = 'main') {
    this.doc.addPage();
    this.pageKind[this.currentPageIndex()] = kind;
  }

  currentPageIndex() {
    return this.doc.bufferedPageRange().count - 1;
  }

  usableWidth() {
    return this.doc.page.width - this.doc.page.margins.left - this.doc.page.margins.right;
  }

  bottomY() {
    return this.doc.page.height - this.doc.page.margins.bottom;
  }

  ensure(h) {
    if (this.doc.y + h > this.bottomY()) this.addPage(this.pageKind[this.currentPageIndex()] || 'main');
  }

  cover() {
    this.addPage('cover');
    const d = this.doc;
    d.rect(0, 0, d.page.width, d.page.height).fill('#f8fafc');
    d.rect(0, 0, 22, d.page.height).fill('#1d4ed8');
    d.fillColor('#0f172a').font('Helvetica-Bold').fontSize(30).text('RENTipid ListingBridge v1.0', 70, 150, { width: 450 });
    d.fontSize(21).text('Complete User, Operations, Developer & Business Reference Manual', 70, 230, { width: 450, lineGap: 4 });
    d.moveDown(2);
    d.font('Helvetica').fontSize(12).fillColor('#334155').text('Implementation, User Guidance, Operations, Architecture, Security, Deployment and Governance Reference', 70, 330, { width: 430, lineGap: 3 });
    d.roundedRect(70, 430, 420, 150, 6).stroke('#94a3b8');
    d.font('Helvetica-Bold').fontSize(11).fillColor('#1d4ed8').text(release.classification, 92, 454);
    d.font('Helvetica').fontSize(10).fillColor('#0f172a')
      .text(`Module Version: ${release.moduleVersion}`, 92, 484)
      .text(`Release Tag: ${release.tag}`, 92, 504)
      .text(`Application SHA: ${release.appSha}`, 92, 524, { width: 370 })
      .text(`Publication Date: ${publicationDate}`, 92, 554);
    d.fillColor('#64748b').fontSize(9).text('Prepared from frozen release source and evidence ledger. No application, test, Prisma, deployment, production, or feature-flag state is modified by this manual.', 70, 700, { width: 450 });
  }

  frontMatter() {
    this.addPage('front');
    this.h1('Document Control', false);
    this.drawTable('Document control', [
      ['Field', 'Value'],
      ['Document', 'RENTipid ListingBridge v1.0 Complete Reference Manual'],
      ['Module Version', release.moduleVersion],
      ['Application Release SHA', release.appSha],
      ['Release Tag', release.tag],
      ['Production Deployment', release.deployment],
      ['Production URL', release.url],
      ['Release State', 'VERSION FROZEN'],
      ['Change Control', 'Controlled change required after freeze'],
      ['Publication date', publicationDate],
    ], [0.34, 0.66]);
    this.h1('Intended Audiences', false);
    this.para('This manual serves four audiences in one coherent document: RENTipid users and property providers; RENTipid operators, support, and administrators; developers, engineers, and maintainers; and business owners, management, and product owners.');
    this.h1('How To Use This Manual', false);
    this.para('Part I explains business purpose and implemented scope. Part II is the provider manual. Part III is the operations and support manual. Part IV is the developer reference. Part V covers governance and roadmap. Part VI contains appendices, reference tables, and quick cards.');
    this.h1('Document Conventions', false);
    this.drawTable('Document conventions', [
      ['Convention', 'Meaning'],
      ['NOTE', 'Useful clarification.'],
      ['IMPORTANT', 'Required behavior or release invariant.'],
      ['WARNING', 'Risk that can affect security, data integrity, or release governance.'],
      ['OPERATOR ACTION', 'Support or operational action.'],
      ['DEVELOPER NOTE', 'Implementation-specific detail.'],
      ['BUSINESS NOTE', 'Owner or management decision context.'],
    ], [0.28, 0.72]);
    this.addPage('front');
    this.h1('Table of Contents', false);
    this.renderTocLike(this.content.filter(x => x.type === 'part' || x.type === 'chapter'), 'heading');
    this.addPage('front');
    this.h1('List of Figures', false);
    this.renderFigureList();
    this.h1('List of Tables', false);
    this.renderTableList();
    this.addPage('front');
    this.h1('Quick Audience Navigation', false);
    this.drawTable('Quick audience navigation', [
      ['Audience', 'Start with', 'Most useful appendices'],
      ['Provider / user', 'Chapters 4-11', 'A, E, J'],
      ['Operator / support / admin', 'Chapters 12-17', 'B, C, E, F, I, J'],
      ['Developer / maintainer', 'Chapters 18-34', 'G, H, D, F'],
      ['Business owner / product owner', 'Chapters 1-3 and 35-36', 'I, J'],
    ], [0.28, 0.34, 0.38]);
  }

  renderContent() {
    for (const item of this.content) {
      if (item.type === 'part') {
        this.addPage('main');
        if (this.mainStartIndex == null) this.mainStartIndex = this.currentPageIndex();
        this.markHeading(item.title, 1);
        this.doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(23).text(item.title, { width: this.usableWidth() });
        this.doc.moveDown(1);
        continue;
      }
      this.addPage('main');
      this.markHeading(`Chapter ${item.num} - ${item.title}`, 2);
      this.addIndexTerms(item.terms || []);
      this.doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(18).text(`Chapter ${item.num} - ${item.title}`, { width: this.usableWidth() });
      this.doc.moveDown(0.7);
      for (const b of item.body) this.renderBlock(b);
    }
  }

  renderBlock(b) {
    if (b.type === 'p') return this.para(b.text);
    if (b.type === 'callout') return this.callout(b.kind, b.text);
    if (b.type === 'list') return this.bullets(b.items);
    if (b.type === 'table') return this.drawTable(b.caption, b.rows, b.widths);
    if (b.type === 'figure') return this.drawFigure(b.id);
  }

  renderIndex() {
    this.addPage('index');
    this.h1('Alphabetical Index', false);
    const terms = Object.keys(this.refs.index || {}).length ? Object.keys(this.refs.index).sort() : Array.from(this.index.keys()).sort();
    const rows = [['Subject', 'Page(s)']];
    for (const term of terms) {
      const pages = this.refs.index?.[term] || [];
      rows.push([term, pages.map(p => this.formatPage(p)).join(', ') || 'pending']);
    }
    this.drawTable('Alphabetical subject index', rows, [0.44, 0.56]);
  }

  h1(text, record = true) {
    this.ensure(40);
    if (record) this.markHeading(text, 2);
    this.doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(18).text(text, { width: this.usableWidth() });
    this.doc.moveDown(0.5);
  }

  para(text) {
    this.ensure(36);
    this.doc.fillColor('#1e293b').font('Helvetica').fontSize(10.2).text(text, { width: this.usableWidth(), align: 'justify', lineGap: 2 });
    this.doc.moveDown(0.55);
  }

  bullets(items) {
    for (const item of items) {
      this.ensure(26);
      this.doc.fillColor('#1e293b').font('Helvetica').fontSize(10.1).text('- ', { continued: true });
      this.doc.text(item, { width: this.usableWidth() - 12, lineGap: 2 });
    }
    this.doc.moveDown(0.45);
  }

  callout(kind, text) {
    this.ensure(64);
    const x = this.doc.page.margins.left;
    const y = this.doc.y;
    const w = this.usableWidth();
    const h = Math.max(52, this.doc.heightOfString(text, { width: w - 28, lineGap: 2 }) + 28);
    this.doc.roundedRect(x, y, w, h, 5).fillAndStroke('#f8fafc', '#1d4ed8');
    this.doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(9.5).text(kind, x + 12, y + 10);
    this.doc.fillColor('#0f172a').font('Helvetica').fontSize(9.7).text(text, x + 12, y + 25, { width: w - 24, lineGap: 2 });
    this.doc.y = y + h + 12;
  }

  drawFigure(id) {
    const d = diagrams.find(x => x.id === id);
    if (!d) return;
    const rows = d.nodes.length + (d.side ? Math.ceil(d.side.length / 2) : 0);
    const h = Math.min(520, Math.max(220, 54 + rows * 35));
    this.ensure(h + 50);
    this.figureNo++;
    const figNo = this.figureNo;
    const page = this.currentPageIndex();
    this.figures.push({ no: figNo, caption: d.caption, page });
    const x = this.doc.page.margins.left;
    const y = this.doc.y;
    const w = this.usableWidth();
    this.doc.roundedRect(x, y, w, h, 5).stroke('#cbd5e1');
    this.doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(`Figure ${figNo}. ${d.caption}`, x + 12, y + 12, { width: w - 24 });
    const boxW = d.side ? w * 0.58 : w * 0.72;
    const bx = x + (d.side ? 24 : (w - boxW) / 2);
    let cy = y + 44;
    d.nodes.forEach((n, i) => {
      const bh = 22;
      this.doc.roundedRect(bx, cy, boxW, bh, 4).fillAndStroke('#eff6ff', '#334155');
      this.doc.fillColor('#0f172a').font('Helvetica').fontSize(8.5).text(n, bx + 6, cy + 6, { width: boxW - 12, align: 'center' });
      if (i < d.nodes.length - 1) {
        this.doc.moveTo(bx + boxW / 2, cy + bh).lineTo(bx + boxW / 2, cy + 34).stroke('#1d4ed8');
        this.doc.polygon([bx + boxW / 2 - 3, cy + 34], [bx + boxW / 2 + 3, cy + 34], [bx + boxW / 2, cy + 39]).fill('#1d4ed8');
      }
      cy += 38;
    });
    if (d.side) {
      const sx = x + w * 0.66;
      const sy = y + 50;
      const sw = w * 0.30;
      const sh = Math.min(h - 70, 34 + d.side.length * 18);
      this.doc.roundedRect(sx, sy, sw, sh, 4).fillAndStroke('#f8fafc', '#94a3b8');
      this.doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5).text('Supporting systems', sx + 8, sy + 10, { width: sw - 16 });
      d.side.forEach((s, i) => this.doc.fillColor('#334155').font('Helvetica').fontSize(8).text(`- ${s}`, sx + 10, sy + 28 + i * 15, { width: sw - 16 }));
    }
    this.doc.y = y + h + 14;
  }

  drawTable(caption, rows, widths) {
    this.tableNo++;
    const tNo = this.tableNo;
    const page = this.currentPageIndex();
    this.tables.push({ no: tNo, caption, page });
    this.ensure(42);
    this.doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(9.5).text(`Table ${tNo}. ${caption}`, { width: this.usableWidth() });
    this.doc.moveDown(0.25);
    const x = this.doc.page.margins.left;
    const w = this.usableWidth();
    const colW = widths.map(fr => fr * w);
    const header = rows[0];
    const drawHeader = () => {
      const y = this.doc.y;
      const h = this.rowHeight(header, colW, true);
      this.doc.rect(x, y, w, h).fill('#1d4ed8');
      let cx = x;
      header.forEach((cell, i) => {
        this.doc.fillColor('white').font('Helvetica-Bold').fontSize(7.8).text(String(cell), cx + 4, y + 5, { width: colW[i] - 8 });
        cx += colW[i];
      });
      this.doc.y = y + h;
    };
    drawHeader();
    for (const row of rows.slice(1)) {
      let h = this.rowHeight(row, colW, false);
      if (h > this.bottomY() - this.doc.page.margins.top - 40) h = this.bottomY() - this.doc.page.margins.top - 40;
      if (this.doc.y + h > this.bottomY()) {
        this.addPage(this.pageKind[this.currentPageIndex()] || 'main');
        drawHeader();
      }
      const y = this.doc.y;
      this.doc.rect(x, y, w, h).fill('#ffffff');
      let cx = x;
      row.forEach((cell, i) => {
        this.doc.rect(cx, y, colW[i], h).stroke('#cbd5e1');
        this.doc.fillColor('#1e293b').font('Helvetica').fontSize(7.5).text(String(cell), cx + 4, y + 5, { width: colW[i] - 8, height: h - 8, ellipsis: true });
        cx += colW[i];
      });
      this.doc.y = y + h;
    }
    this.doc.moveDown(0.8);
  }

  rowHeight(row, colW, header) {
    const fontSize = header ? 7.8 : 7.5;
    this.doc.font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
    const heights = row.map((cell, i) => this.doc.heightOfString(String(cell), { width: colW[i] - 8 }) + 10);
    return Math.min(82, Math.max(header ? 24 : 26, ...heights));
  }

  markHeading(title, level) {
    this.headings.push({ title, level, page: this.currentPageIndex() });
  }

  addIndexTerms(terms) {
    const page = this.currentPageIndex();
    for (const term of terms) {
      if (!this.index.has(term)) this.index.set(term, []);
      const pages = this.index.get(term);
      if (!pages.includes(page)) pages.push(page);
    }
  }

  renderTocLike(items, kind) {
    const refs = kind === 'heading' ? this.refs.headings || [] : [];
    for (const item of items) {
      const title = item.type === 'part' ? item.title : `Chapter ${item.num} - ${item.title}`;
      const match = refs.find(h => h.title === title);
      this.ensure(18);
      const x = this.doc.page.margins.left + (item.type === 'chapter' ? 16 : 0);
      const y = this.doc.y;
      const pageText = match ? this.formatPage(match.page) : 'pending';
      this.doc.font(item.type === 'part' ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.2).fillColor('#0f172a').text(title, x, y, { width: this.usableWidth() - (item.type === 'chapter' ? 16 : 0) - 52, continued: false });
      this.doc.text(pageText, this.doc.page.width - this.doc.page.margins.right - 48, y, { width: 48, align: 'right' });
      this.doc.y = Math.max(this.doc.y, y + 15);
    }
  }

  renderFigureList() {
    const refs = this.refs.figures || [];
    if (!refs.length) {
      this.para('Figure list will be generated after final pagination.');
      return;
    }
    for (const f of refs) this.tocLine(`Figure ${f.no}. ${f.caption}`, this.formatPage(f.page));
  }

  renderTableList() {
    const refs = this.refs.tables || [];
    if (!refs.length) {
      this.para('Table list will be generated after final pagination.');
      return;
    }
    for (const t of refs) this.tocLine(`Table ${t.no}. ${t.caption}`, this.formatPage(t.page));
  }

  tocLine(left, right) {
    this.ensure(16);
    const y = this.doc.y;
    this.doc.font('Helvetica').fontSize(8.7).fillColor('#0f172a').text(left, this.doc.page.margins.left, y, { width: this.usableWidth() - 55 });
    this.doc.text(right, this.doc.page.width - this.doc.page.margins.right - 48, y, { width: 48, align: 'right' });
    this.doc.y = Math.max(this.doc.y, y + 14);
  }

  formatPage(pageIndex) {
    if (pageIndex == null) return 'pending';
    const mainStart = this.mainStartIndex ?? this.refs.mainStartIndex;
    if (mainStart == null || pageIndex < mainStart) return roman(Math.max(1, pageIndex)).toLowerCase();
    return String(pageIndex - mainStart + 1);
  }

  addHeadersFooters() {
    const range = this.doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      this.doc.switchToPage(i);
      if (i === 0) continue;
      const pageNo = this.formatPage(i);
      const yHeader = 30;
      const yFooter = this.doc.page.height - this.doc.page.margins.bottom - 22;
      this.doc.font('Helvetica').fontSize(8).fillColor('#64748b')
        .text('RENTipid ListingBridge v1.0', this.doc.page.margins.left, yHeader, { width: 220, lineBreak: false })
        .text('Version 1.0', this.doc.page.width - this.doc.page.margins.right - 110, yHeader, { width: 110, align: 'right', lineBreak: false });
      this.doc.moveTo(this.doc.page.margins.left, yHeader + 14).lineTo(this.doc.page.width - this.doc.page.margins.right, yHeader + 14).stroke('#e2e8f0');
      this.doc.moveTo(this.doc.page.margins.left, yFooter - 8).lineTo(this.doc.page.width - this.doc.page.margins.right, yFooter - 8).stroke('#e2e8f0');
      this.doc.font('Helvetica').fontSize(8).fillColor('#64748b')
        .text(release.classification, this.doc.page.margins.left, yFooter, { width: 280, lineBreak: false })
        .text(pageNo, this.doc.page.width / 2 - 20, yFooter, { width: 40, align: 'center', lineBreak: false })
        .text(release.moduleVersion, this.doc.page.width - this.doc.page.margins.right - 80, yFooter, { width: 80, align: 'right', lineBreak: false });
    }
  }
}

function roman(num) {
  const vals = [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];
  let n = num, out = '';
  for (const [sym, val] of vals) while (n >= val) { out += sym; n -= val; }
  return out;
}

function mapToObj(map) {
  return Object.fromEntries([...map.entries()].map(([k, v]) => [k, v]));
}

async function main() {
  await ensureAssets();
  const content = makeContent();
  fs.writeFileSync(SOURCE_MD, buildMarkdown(content), 'utf8');
  let refs = {};
  let result;
  const temp = path.join(OUT_DIR, `${BASENAME}.draft.pdf`);
  for (let i = 0; i < 3; i++) {
    const renderer = new PdfRenderer(refs);
    result = await renderer.render(i === 2 ? PDF_PATH : temp);
    refs = result;
  }
  if (fs.existsSync(temp)) fs.unlinkSync(temp);
  fs.writeFileSync(path.join(OUT_DIR, `${BASENAME}_pdf_metadata.json`), JSON.stringify(result, null, 2), 'utf8');
  console.log(JSON.stringify({ pdf: PDF_PATH, markdown: SOURCE_MD, pageCount: result.pageCount, figures: result.figures.length, tables: result.tables.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
