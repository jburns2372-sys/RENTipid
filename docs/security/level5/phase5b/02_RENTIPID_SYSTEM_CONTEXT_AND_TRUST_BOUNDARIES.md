# RENTIPID SYSTEM CONTEXT AND TRUST BOUNDARIES

## 1. System Context Diagram

```mermaid
flowchart TD
    User([Public User Device]) -->|HTTPS / API| Edge(CDN / Edge Firewall)
    SOC([SOC Analyst Device]) -->|HTTPS| Edge
    Admin([Administrative Device]) -->|HTTPS| Edge

    Edge --> Frontend(Next.js Frontend / Client)
    Frontend --> Backend(Next.js API Routes / Backend)

    Backend --> DB[(PostgreSQL Database)]
    Backend --> PayMongo((PayMongo Payment Gateway))
    Backend --> FileStore[(Cloud Storage / Uploads)]
    Backend --> AI((Future AI Service))

    PayMongo -->|Webhook / HTTPS| Backend
```

## 2. Trust Boundaries

### TB-001: Public Internet to Application Edge
- **Boundary ID:** TB-001
- **Source zone:** Public internet, Public user devices
- **Destination zone:** CDN or edge layer
- **Assets crossing:** User session requests, public listings
- **Identities involved:** Unauthenticated users, authenticated tenants/providers
- **Data classifications involved:** PUBLIC, INTERNAL, CONFIDENTIAL
- **Protocol or interaction type:** HTTPS
- **Authentication control:** Edge-level TLS termination
- **Authorization control:** WAF rules (planned)
- **Integrity control:** TLS
- **Confidentiality control:** TLS
- **Replay or idempotency control:** WAF rate limiting (planned)
- **Logging control:** Edge access logs
- **Failure behavior:** Drop connection
- **Existing evidence IDs:** N/A
- **Related gap IDs:** GAP-008
- **Related risk IDs:** RSK-016
- **Evidence classification:** NOT_EVIDENCED
- **Target Phase 5 control:** Phase 5H

### TB-002: Application Frontend to Backend API
- **Boundary ID:** TB-002
- **Source zone:** Frontend application
- **Destination zone:** Server-side application and API routes
- **Assets crossing:** User commands, SOC analytics, listing data
- **Identities involved:** Authenticated users, SOC_ANALYST, ADMIN
- **Data classifications involved:** CONFIDENTIAL, SECURITY_SENSITIVE, HIGHLY_CONFIDENTIAL
- **Protocol or interaction type:** HTTPS / REST API
- **Authentication control:** NextAuth session cookie validation
- **Authorization control:** Proxy route restrictions, `requireSecurityPermission` checks
- **Integrity control:** Payload validation via Zod
- **Confidentiality control:** TLS
- **Replay or idempotency control:** Execution engine idempotency checks
- **Logging control:** Next.js API route logging, Security Event logs
- **Failure behavior:** 401 Unauthorized, 403 Forbidden
- **Existing evidence IDs:** EV-001, EV-002, EV-003, EV-009
- **Related gap IDs:** N/A
- **Related risk IDs:** RSK-001, RSK-002, RSK-003
- **Evidence classification:** VERIFIED_IMPLEMENTATION
- **Target Phase 5 control:** Phase 5D, 5E

### TB-003: Backend API to Database
- **Boundary ID:** TB-003
- **Source zone:** Server-side application
- **Destination zone:** Database boundary
- **Assets crossing:** Persistent state, PII, financial ledgers, audit logs
- **Identities involved:** Application Service Account
- **Data classifications involved:** CONFIDENTIAL, HIGHLY_CONFIDENTIAL, RESTRICTED_IDENTITY, SECURITY_SENSITIVE
- **Protocol or interaction type:** TCP / PostgreSQL protocol
- **Authentication control:** Database credentials
- **Authorization control:** Database user permissions
- **Integrity control:** ORM constraints
- **Confidentiality control:** TLS in transit; Data at rest encryption missing
- **Replay or idempotency control:** Database unique constraints
- **Logging control:** Database audit logs (planned)
- **Failure behavior:** Query failure, transaction rollback
- **Existing evidence IDs:** EV-012
- **Related gap IDs:** GAP-006
- **Related risk IDs:** RSK-009
- **Evidence classification:** PARTIALLY_IMPLEMENTED (VERIFIED_IMPLEMENTATION for local guard)
- **Target Phase 5 control:** Phase 5F

### TB-004: Backend API to Payment Gateway (PayMongo)
- **Boundary ID:** TB-004
- **Source zone:** Server-side application
- **Destination zone:** Payment-gateway boundary
- **Assets crossing:** Payment initiation, escrow funding
- **Identities involved:** System Service Account
- **Data classifications involved:** RESTRICTED_FINANCIAL
- **Protocol or interaction type:** HTTPS / REST
- **Authentication control:** API Keys
- **Authorization control:** Gateway scoping
- **Integrity control:** TLS
- **Confidentiality control:** TLS
- **Replay or idempotency control:** Request idempotency keys
- **Logging control:** Payment Action logs
- **Failure behavior:** Payment failure
- **Existing evidence IDs:** EV-010
- **Related gap IDs:** GAP-007
- **Related risk IDs:** RSK-006, RSK-007, RSK-008
- **Evidence classification:** NOT_EVIDENCED
- **Target Phase 5 control:** Phase 5G

### TB-005: Payment Gateway Webhook to Backend API
- **Boundary ID:** TB-005
- **Source zone:** Payment-gateway boundary
- **Destination zone:** Server-side application
- **Assets crossing:** Payment status updates
- **Identities involved:** PayMongo System
- **Data classifications involved:** RESTRICTED_FINANCIAL
- **Protocol or interaction type:** HTTPS Webhook
- **Authentication control:** Webhook signature verification
- **Authorization control:** Webhook signature validation
- **Integrity control:** Signature validation
- **Confidentiality control:** TLS
- **Replay or idempotency control:** Webhook event ID idempotency
- **Logging control:** Webhook logs
- **Failure behavior:** 400 Bad Request
- **Existing evidence IDs:** EV-010
- **Related gap IDs:** GAP-007
- **Related risk IDs:** RSK-006
- **Evidence classification:** NOT_EVIDENCED
- **Target Phase 5 control:** Phase 5G

### TB-006: Backend API to External AI Service
- **Boundary ID:** TB-006
- **Source zone:** Server-side application
- **Destination zone:** AI-service boundary
- **Assets crossing:** Prompts, application context
- **Identities involved:** Application Service Account
- **Data classifications involved:** CONFIDENTIAL
- **Protocol or interaction type:** HTTPS / API
- **Authentication control:** API Keys
- **Authorization control:** Vendor policy
- **Integrity control:** TLS
- **Confidentiality control:** TLS
- **Replay or idempotency control:** None
- **Logging control:** AI usage logs
- **Failure behavior:** Fallback to standard application logic
- **Existing evidence IDs:** N/A
- **Related gap IDs:** GAP-009
- **Related risk IDs:** RSK-026, RSK-027, RSK-028
- **Evidence classification:** NOT_EVIDENCED
- **Target Phase 5 control:** Phase 5K

## 3. Trust Boundary Diagram

```mermaid
flowchart TD
    subgraph Public Zone
        User([Public Client])
    end

    subgraph Internal Network Zone
        Edge[Edge / WAF]
        Frontend[Frontend App]
        Backend[Backend API]
    end

    subgraph Restricted Data Zone
        DB[(Database)]
    end

    subgraph External Trusted Zone
        PayMongo((PayMongo))
        AI((AI Service))
    end

    User -->|TB-001| Edge
    Edge --> Frontend
    Frontend -->|TB-002| Backend
    Backend -->|TB-003| DB
    Backend -->|TB-004| PayMongo
    PayMongo -->|TB-005| Backend
    Backend -->|TB-006| AI
```
