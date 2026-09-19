# RENTipid Unified Login Preview Checkpoint

## Checkpoint status

- Checkpoint purpose: source and evidence preservation only
- Checkpoint date: 2026-09-18
- Verification completed: 2026-09-19 (Asia/Shanghai)
- Branch: `successor/rc-candidate`
- Reviewed source HEAD before this evidence commit: `92328c85c8ff28011b8bdf4907939a560cedd09e`
- Release state: not production accepted and not frozen
- Production deployment performed by this checkpoint: no
- Production configuration changed by this checkpoint: no

## Preserved implementation

- Apple OAuth callback remediation is present. Apple retains `form_post`, PKCE, state, and nonce checks. HTTPS transient OAuth cookies are `HttpOnly`, `SameSite=None`, and secure. No OAuth validation bypass was introduced.
- Unified provider identity linking is present. One permanent RENTipid User ID may own multiple provider identities identified by provider plus provider subject.
- Same-email OAuth matches do not silently authorize linking. They require explicit authenticated account linking.
- Provider identities already owned by another User are blocked from linking.
- Connected Login Methods / Account Security UI and API support are present.
- Google and Apple can be explicitly linked to the same authenticated User ID.
- Facebook source support is implemented.
- Root-level scratch TypeScript utilities are excluded from the application TypeScript build by `tsconfig.json`; no scratch utility was deleted or added by this checkpoint.

## Required commit lineage

- Apple transient-cookie remediation: `41610f9b536fd49a2457ceee87380612d00f8aea`
- Apple consent-cookie and safe rejection audit remediation: `7fdea00`
- Controlled unified login identity linking: `9b21e5d0203e610cfca8d2b5e27ef20174a50389`
- Root-level scratch TypeScript build remediation: `92328c85c8ff28011b8bdf4907939a560cedd09e`

All listed commits are ancestors of the reviewed source HEAD. None was rewritten or amended.

## Local verification

- Typecheck: PASS (`npm run typecheck`)
- Auth regression suites: PASS (5 suites, 63 tests)
  - `tests/auth/apple-oauth-cookie-policy.test.ts`
  - `tests/auth/connected-login-methods.test.ts`
  - `tests/auth/ancillary-email-password-flows.test.ts`
  - `tests/auth/profile-display-email.test.ts`
  - `tests/auth/unified-auth-routes.test.ts`
- Canonical build: PASS (`npm run build`)
  - Original build blocker: Windows Prisma generated-engine EPERM file lock (`query_engine-windows.dll.node`)
  - Resolution: Stale local RENTipid Next.js dev server process tree (PID 38212) holding the Prisma engine DLL handle was identified and terminated; stale temporary engine artifacts were cleared from `node_modules/.prisma/client`; Prisma client was regenerated cleanly (`prisma generate`); full canonical Next.js production build succeeded (`npm run build`).
- Uncommitted-change secret scan before checkpoint creation: no leakage found.

## Preview runtime observation

Read-only checks returned HTTP 200 on 2026-09-18 UTC / 2026-09-19 Asia/Shanghai:

- Health: `{"status":"ready","database":"connected"}`
- Active provider IDs, in registry order: `credentials`, `phone-otp`, `google`, `facebook`, `apple`
- Five-provider Preview target: active in the provider registry
- Facebook source support: implemented
- Facebook Preview runtime provider: active
- Facebook OAuth redirect acceptance: completed
- Facebook identity collision reconciliation: COMPLETED (Owner-authorized atomic reassignment of single Facebook AuthProviderIdentity row from historical Class 1 empty auth shell to canonical user owning Google and Apple)
- Three-provider unified identity mapping on canonical user: Google (connected), Apple (connected), Facebook (connected)

## Production non-interference

Read-only Vercel inspection and runtime checks confirmed:

- Production deployment: `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`
- Production runtime/source SHA: `d84854264447b7e2c5f521ebf88da31d22d7c066`
- Deployment status: READY
- Production provider IDs: `credentials`, `phone-otp`, `google`, `facebook`
- Production Apple enabled: no
- Production deployment changed by this task: no
- Production runtime SHA changed by this task: no

## Non-freeze declaration

This document is a restore/checkpoint record only. It does not mark the Preview work as production accepted, completed, closed, or frozen. It does not authorize a Production deployment or Production Apple activation.
