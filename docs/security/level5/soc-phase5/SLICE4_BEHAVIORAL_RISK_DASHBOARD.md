# SOC Phase 5 Slice 4: Behavioral-Risk Investigation Dashboard

## Overview

This document serves as the implementation record and evidence artifact for the Behavioral-Risk Investigation Dashboard (Slice 4) of SOC Phase 5.

## Implemented Components

1. **Server Page** (`src/app/dashboard/admin/security/intelligence/behavioral-risk/page.tsx`)
   - Protects the route using `requireSecurityPermission(SECURITY_PERMISSIONS.DASHBOARD_VIEW)`.
   - Renders the interactive client component as a container.

2. **Client UI** (`src/app/dashboard/admin/security/intelligence/behavioral-risk/behavioral-risk-investigation-client.tsx`)
   - Provides a read-only investigation form for retrieving behavioral risk data by `subjectRef`, `environment`, `lifecycle`, and `limit`.
   - Avoids stale request state by tracking in-flight fetches with an `AbortController`.
   - Summarizes the `latest` assessment and displays the `history` boundary as a table.
   - Fetches and renders detailed explainable signals when an individual assessment's "Details" button is clicked.
   - Properly sanitizes API error codes (401, 403, 404, 500) into safe, user-friendly client state.
   - Includes a persistent visual alert that the information is strictly advisory-only.

3. **Tests** (`tests/security/intelligence/behavioral-risk.dashboard.test.tsx`)
   - Full coverage for 11 critical behaviors, including required-field validation, stale state cancellation, and unauthorized boundary mapping.
   - Employs resilient `jsdom` React testing with comprehensive `findByText` async matchers.

## Boundary Constraints

As mandated by SOC Phase 5 Slice 4 boundaries:
- No existing SOC navigation or dashboard pages were altered.
- No automated enforcement or automated response occurs.
- The interface remains strictly advisory-only.
- The implementation does not interact with Prisma, raw SQL, or the underlying database models.

## Validation State

- **TypeScript Build**: Passing locally.
- **ESLint**: Passing locally.
- **Tests**: 11/11 passing in the `behavioral-risk.dashboard.test.tsx` suite.
