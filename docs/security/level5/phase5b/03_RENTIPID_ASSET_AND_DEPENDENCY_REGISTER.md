# RENTIPID ASSET AND DEPENDENCY REGISTER

## 1. Internal Assets

| Asset ID | Asset Name | Asset Category | Description | Security Owner | Business Owner | Environment | Trust Zone | Data Classification | Criticality | Availability Req | Integrity Req | Confidentiality Req | AuthN Dependency | AuthZ Dependency | Logging Req | Backup Req | Recovery Req | Existing Controls | Evidence IDs | Gap IDs | Risk IDs | Lifecycle Status | Evidence Classification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AST-001** | **Primary Database** | Data Store | Main PostgreSQL database | Lead Engineer | System Owner | Production | Restricted Data Zone | HIGHLY_CONFIDENTIAL | High | High | High | High | DB Credentials | DB Roles | High | High | High | Local guard | EV-012 | GAP-006 | RSK-009 | Active | VERIFIED_IMPLEMENTATION |
| **AST-002** | **Backend API** | Application | Core Next.js API server | Security Architect | Engineering Lead | Production | Internal Network Zone | CONFIDENTIAL | High | High | High | High | NextAuth | Proxy / Permissions | High | N/A | High | Idempotency | EV-001, EV-009 | N/A | RSK-002 | Active | VERIFIED_IMPLEMENTATION |
| **AST-003** | **SOC Dashboard** | Application | Command center UI | SOC Lead | CISO | Production | Internal Network Zone | SECURITY_SENSITIVE | High | Medium | High | High | NextAuth | Proxy | High | N/A | High | Proxy boundary | EV-002, EV-011 | N/A | RSK-001 | Active | VERIFIED_IMPLEMENTATION |

## 2. External Dependencies

| Dependency ID | Service or Package | Purpose | Data Exchanged | Trust Boundary | AuthN Mechanism | Failure Effect | Security Responsibility | Vendor Assurance | Contingency Strategy | Evidence IDs | Related Risks | Evidence Classification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **DEP-001** | **PayMongo** | Payment Gateway | Escrow funding | TB-004, TB-005 | Webhooks, REST | API Keys, Webhook signatures | Payment failures | Shared (Vendor for PAN, RENTipid for API) | PCI DSS Compliance | Manual escrow | EV-010 | RSK-006, RSK-007 | VERIFIED_DOCUMENTED_ARCHITECTURE |
| **DEP-002** | **Vercel** | Hosting Provider | Cloud Infrastructure | TB-001 | Application Data | Cloud IAM / Deploy Keys | Complete application outage | Shared (Vendor for infra, RENTipid for app) | SOC2 / ISO27001 | Multi-cloud strategy (planned) | EV-012 | RSK-016 | VERIFIED_DOCUMENTED_ARCHITECTURE |
| **DEP-003** | **NextAuth** | Authentication Library | Session Management | TB-002 | Session Cookies | JWT / Sessions | Unauthorized access | Shared (Library for logic, RENTipid for config) | Open Source Review | Switch auth provider | EV-001 | RSK-002 | VERIFIED_IMPLEMENTATION |
| **DEP-004** | **Prisma** | ORM Library | Database Access | TB-003 | DB Queries | Environment Variables | Data corruption or breach | Shared | Open Source Review | Fallback to raw SQL | EV-012 | RSK-009 | VERIFIED_IMPLEMENTATION |
