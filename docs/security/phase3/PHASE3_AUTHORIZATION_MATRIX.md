# Phase 3 Authorization Matrix

## Permissions
- `security.rules.view`
- `security.rules.create`
- `security.rules.initialize`
- `security.rules.validate`
- `security.rules.activate`

## Role-Based Enforcement
- **Super Admin**: GRANTED (`security.rules.initialize`)
- **Admin**: DENIED
- **Finance Admin**: DENIED
- **Compliance Admin**: DENIED
- **Renter**: DENIED
- **Individual Provider**: DENIED
- **Business Provider**: DENIED

## Account-State Enforcement
- **Verified**: GRANTED (if Super Admin)
- **Pending**: DENIED
- **Suspended**: DENIED
- **Blacklisted**: DENIED
- **Missing database user**: DENIED
- **Stale JWT role**: DENIED (DB-authoritative fallback used)
- **Stale JWT status**: DENIED (DB-authoritative fallback used)
- **Stale session version**: DENIED

## Key Boundary Confirmations
- `security.rules.initialize` is exclusively assigned to Super Admin.
- Database User role and status serve as the single authoritative source of truth.
- Any client-supplied actor, role, status, and permission assertions are strictly ignored.
- Rule activation (e.g., transition from DRAFT to ACTIVE) is **not** performed by Gate 3G initialization.
