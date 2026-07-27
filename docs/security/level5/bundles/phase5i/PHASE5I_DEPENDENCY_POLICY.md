# Phase 5I - Dependency and Supply Chain Policy

## 1. Approved Package Managers
- `npm` is the only approved package manager for this repository.
- `yarn`, `pnpm`, or others must not be used to prevent lockfile conflicts.

## 2. Lockfile Requirements
- A single `package-lock.json` must be present and authoritative.
- In CI, `npm ci` must be used to ensure frozen lockfile installation.
- Lockfiles must never be manually deleted or bypassed.

## 3. Dependency Review Ownership
- All dependency additions or major upgrades must be reviewed by the security team.
- Pull requests that add dependencies require an extra approval gate.

## 4. Critical and High Vulnerability Handling
- Critical and High vulnerabilities must be patched immediately when a non-breaking, narrowly scoped patch is available.
- If a fix is breaking, an exception must be logged with mitigating controls until a refactor is complete.

## 5. Emergency Dependency Update Procedure
- In case of an exploited 0-day, emergency updates can bypass standard QA if they are limited to the affected package.
- `npm audit fix --force` remains prohibited; updates must be targeted.

## 6. Major-Version Upgrade Review
- Major upgrades (e.g., Next.js 14 -> 15) must be isolated to their own feature branches and tested against the full suite.

## 7. Package Deprecation Handling
- Deprecated packages must be flagged and scheduled for replacement within 90 days.

## 8. Typosquatting Review
- All new dependencies must be checked for typosquatting (e.g., `electorn` vs `electron`).

## 9. Dependency Confusion Protection
- Internal packages must be clearly scoped (e.g., `@organization/package`).
- The `.npmrc` must enforce that scoped packages resolve only to the internal registry.

## 10. Package Lifecycle-Script Review
- Dependencies with `postinstall` or similar scripts must be audited for malicious behavior before adoption.
- In CI, `npm ci --ignore-scripts` should be used where practical.

## 11. Direct Git Dependency Rules
- Direct Git dependencies are prohibited unless pointing to a verified immutable commit SHA.

## 12. Unmaintained Package Escalation
- Packages with no updates in 24 months must be reviewed for fork or replacement.

## 13. Exception Expiry
- Vulnerability exceptions expire after 30 days and must be re-reviewed.

## 14. Production Release Blocking Rules
- Any unhandled Critical or High runtime vulnerability with an available patch blocks release.
