# Final Owner Authorization Matrix

This matrix governs the necessary approvals for proceeding with the final true implementation phases (PHASE 17, PHASE 19, PHASE 19B) requiring production and external access.

| Role | Exact Decision Required | Authorized Person/Role | Evidence Needed Before Approval | Actions Enabled | Actions Prohibited |
|---|---|---|---|---|---|
| **Owner** | Final Go/No-Go on all production connectivity and live payment execution | Business Owner | Pre-live security sign-off, staging smoke tests, infrastructure readiness report | Live DB connection (Phase 17), production infrastructure deployment (Phase 19B), Live pilot execution (Phase 19) | Unapproved mass data mutations, unauthorized user access |
| **Finance** | Pilot budget authorization and financial reconciliation procedures | Finance Officer | PayMongo KYC verification, pilot limits documented (Max 500 PHP) | Execution of live transactions, payout processing | Live transactions exceeding pilot threshold |
| **Legal** | Authorization of Terms of Service and liability for live transactions | Legal Counsel | Updated platform Terms of Service | User onboarding for pilot | Processing restricted transactions |
| **Compliance** | KYC and AML compliance sign-off | Compliance Officer | PayMongo live status, user verification checks | Merchant live status | Sanctioned user transactions |
| **Security** | Authorization of SOC/Security architecture in production | Security Lead | Phase 5 strict closures, Zero-Trust compliance | Database Integrity Checks, SOC production monitoring | Bypassing SOC guardrails, unmonitored prod access |
| **Infra Admin** | Production infrastructure and secret-path verification | DevOps/Infra Admin | Vercel and Azure configuration verification | Separately authorized CI/CD production pipelines and secrets configuration | Exposure of raw secrets |
| **Gateway Admin** | Live keys generation and webhook setup | Payment Gateway Admin (PayMongo) | Sandbox success evidence | Injection of live keys to Vercel | Production refunds without audit |
| **Database Admin** | Production DB read-only access provisioning | Database Administrator (Azure PostgreSQL) | Target identity, schema/migration state, network path, and restore evidence | Execution of Phase 17 Integrity Check against `rentipid-postgres-db` | Direct SQL write access |
