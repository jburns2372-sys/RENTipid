# ISO-C2-M1-E6 Nodemailer 10.x remediation evidence

Status: **BLOCKED**. Executor: CODEX. Recorded: 2026-10-22.
Technical baseline: b91e90b304c7ac964223df41400f93ca863b6956.
Governance baseline: aebeb6c5325bd486fcd3e95f8ade3c5babeeec58.
Branch: feat/iso-conformity-v1.0. Initial worktree: CLEAN.

## Selection and source boundary

Executed npm view nodemailer version and npm view nodemailer versions --json against the registry: latest stable and selected 10.x candidate **10.2.0**. Registry engines for 10.x: Node >=20.0.0. Project requires 24.x. Initial shell Node: 22.22.2; isolated clean-install probe used temporary Node 24.22.0 via npm exec --package=node@24. No project engine was changed.

Accepted root and lockfile version remain **7.0.7**. NextAuth **4.24.15** is also the registry latest stable; its optional Nodemailer peer is **^7.0.7**. There is no currently published newer stable v4 candidate in dist-tags to resolve that boundary. A plain 10.2.0 root dependency does not satisfy that declared range.

Actual source inspection:
- src/lib/auth/unified/email-delivery.ts is the only direct Nodemailer import. It constructs SMTP transport using host, port, secure, user/password and sends text verification and password-reset messages through sendMail.
- src/lib/auth/unified/ancillary.ts invokes these two methods; delivery failure invalidates the token and records generic delivery_unavailable, without serializing the SMTP exception.
- src/lib/auth.ts configures Credentials (email/password and phone OTP), and conditional Google/Facebook/Apple OAuth. NextAuth EmailProvider is NOT IN USE, verified from provider construction and imports. No EmailProvider was added.
- node_modules/next-auth/providers/email.js imports Nodemailer for its own verification-request function. That provider is absent from RENTipid configuration. RENTipid's separate SMTP delivery path uses Nodemailer directly; the dependency cannot be removed as unused.
- No live SMTP, external recipient, database, Preview, or Production operation was performed. Deployment configuration was not revalidated.

## Bounded peer-resolution attempt and blocker

Candidate only: root nodemailer 10.2.0; scoped override next-auth@4.24.15 -> nodemailer: $nodemailer; remove legacy-peer-deps=true from .npmrc. Existing deepmerge-ts 8.0.0 and d3-color 3.1.0 overrides were unchanged.

Strict npm install --package-lock-only --ignore-scripts --no-audit failed exit 1, ERESOLVE. Diagnosis: existing **react-simple-maps@3.0.0** declares React **^16.8.0 || 17.x || 18.x**, incompatible with root **react@19.2.4**. npm progressed to this independent conflict, but this does NOT prove the NextAuth override compatible. No force, broad override, React downgrade, map rewrite, or Auth.js major migration was attempted.

Mandatory independent clean probe copied only candidate package.json, baseline package-lock.json and candidate .npmrc into an empty temporary directory, with no .env or shared node_modules. Command: npm exec --yes --package=node@24 -- npm ci --fetch-retries=0 --fetch-timeout=20000. Result: **FAIL, exit 1, same ERESOLVE**. npm rejected peer resolution before any successful candidate lockfile/install existed. Clean resolution is not proven.

Probe retained locally at C:/Users/user/AppData/Local/Temp/rentipid-e6-resolution-5d0cc82ea00c4ddc958ed65cb9ef7c43. Raw npm error report copied into evidence/iso-c2-m1-e6-clean-install-eresolve.txt. The first failure was diagnosed once; the separate clean check confirmed it. No unrelated dependency correction was authorized by this finite mail package.

Execution correction: before the candidate edits were successfully applied, an initial no-op npm install --package-lock-only inherited the baseline .npmrc legacy-peer-deps=true setting after an inline edit command failed. It produced no tracked dependency delta and is NOT used as clean-resolution evidence. Both candidate checks explicitly used a .npmrc without that setting. No --force or --legacy-peer-deps command flag was used. This report does not claim that the entire session avoided the inherited baseline legacy setting.

Only the executor's attempted package.json/.npmrc edits were restored byte-for-byte from HEAD. package-lock.json has no tracked delta. Accepted E5 work and shared node_modules are preserved. The baseline .npmrc still has its accepted legacy setting; no E6 strict-install PASS is claimed.

## Audit evidence and validation limits

After restoration, npm audit --json ran once and its complete raw output is preserved in evidence/iso-c2-m1-e6-baseline-audit.json (exit 1): **0 Critical, 10 High, 19 Moderate**, 29 total. This is the restored E5 baseline, NOT a successfully upgraded 10.x candidate.

Actual node scripts/security/check-ci-audit.cjs: **FAIL, exit 1**. Effective counts: **0 Critical, 1 High, 0 Moderate**; 28 findings dispositioned under existing policy. Nodemailer remains the effective High. Raw output is not hidden. No audit policy, thresholds, or authorized disposition was changed; no Nodemailer exception exists.

Stopped at Tasks 3-5 clean-resolution blocker, as required. npm ls nodemailer / npm ls --all against a 10.x installation: NOT_RUN (no such installation). Auth and email compatibility tests, full mail security review, typecheck, build, E6 security contracts and E6 GLCC regression: **NOT_RUN**, not PASS and not executed failures. A candidate SMTP/API compatibility or recipient-validation claim would be unsupported. Accepted unaffected evidence is retained; no unrelated tests were rerun.

Prisma/deepmerge and D3 fixes: PASS REUSED / UNAFFECTED, dependency content unchanged. Existing braces/sprintf-js dispositions remain active and unchanged. No auth architecture migration was established as necessary; peer-boundary solution remains UNPROVEN.

## Lifecycle and owner action

CODE COMPLETE: BLOCKED. LOCAL FUNCTIONAL: BLOCKED. M1 LOCAL ACCEPTANCE: BLOCKED.
LOCAL DATABASE MIGRATED and LOCAL REQUIRED DATA SEEDED/SYNCED: PASS REUSED / UNAFFECTED.
Preview acceptance and Production verification remain REQUIRED LATER for the pending runtime remediation and existing E5 runtime candidate. No deployment, merge, tag, freeze, next wave, or required-check activation.

RSK-08: **PARTIAL - REMEDIATION IN PROGRESS**; risk score unchanged, residual risk NOT accepted. Do not advance to PROVEN IMPLEMENTED / OPERATING ENFORCEMENT PENDING until E6 actually passes. Real GitHub operating evidence and later verified required-check enablement remain outstanding.

Project Owner decision required: authorize a bounded supported resolution of the pre-existing react-simple-maps 3.0.0 / React 19.2.4 peer incompatibility before resuming strict E6 installation. Do not approve blanket peer suppression or residual Nodemailer risk. A map/UI compatibility change must carry targeted UI proof and revisit D3 only if its graph changes.

Technical commit: NONE. Governance commit: NONE. Push: NOT_RUN. Governance/evidence changes deliberately remain uncommitted under the failed-gate rule.

Sources: [npm overrides](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#overrides), [Nodemailer SMTP](https://nodemailer.com/smtp), [message configuration](https://nodemailer.com/message); actual registry responses, source and lockfile are the evidence above. These API references alone do not establish RENTipid compatibility.


## ISO-C2-M1-E6-P1 map peer prerequisite resolved (2026-10-22)

Owner-authorized official react-simple-maps 3.0.0 -> 5.0.5 now explicitly supports retained React/react-dom 19.2.4. Minimal geography interaction-style migration and bundled types replace v3 style/external declarations. Strict Node 24 clean npm ci and npm ls peer validation PASS without legacy mode; real map render/pan/zoom/marker regression 3/3 PASS, typecheck PASS, accepted Webpack production build PASS. Normal Turbopack build fails on the existing parent-root external node_modules junction before app compilation; failure retained. D3 color 3.1.0 security fix preserved. Strict baseline and candidate audits both 0 Critical / 11 High / 20 Moderate, no new advisory package. Existing Nodemailer and propagated NextAuth High remain for separate E6. This supersedes the prior map/React owner-decision blocker only. RSK-08 remains PARTIAL - REMEDIATION IN PROGRESS, residual unchanged/unaccepted; overall M1 local acceptance BLOCKED - NODEMAILER E6 PENDING. No database/migration/seed/deployment/main/check changes. Preview/Production verification REQUIRED LATER. Technical commit b77b9404672583347cf43746af29f67da2a986bd; preserved E6 evidence carried forward in this governance checkpoint. See [P1 evidence](ISO_C2_M1_REACT_SIMPLE_MAPS_REACT19_REMEDIATION.md). Next: RESUME ISO-C2-M1-E6 NODEMAILER REMEDIATION.
