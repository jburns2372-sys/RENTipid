# Chapter 22 — API, Services, and Integrations

## 22.1 Internal APIs and Server Actions

RENTipid primarily utilizes Next.js Server Actions for internal mutations, avoiding the need to expose REST endpoints for every UI interaction. This enhances security by keeping logic tightly coupled to the server.

However, formal API routes (`src/app/api`) are exposed for specific architectural needs:
- **Webhooks:** Receiving asynchronous callbacks from third parties (e.g., PayMongo).
- **Client-Side Fetching:** Specific highly dynamic UI components that require polling.
- **Mobile/Native Sync:** Endpoints designed for the upcoming Capacitor native applications.

## 22.2 Payment Gateway Integration (PayMongo)

**Status:** `SANDBOX_ACTIVE`
- **Route:** `src/app/api/webhooks/paymongo/route.ts`
- **Purpose:** Listens for `payment.paid` and `payment.failed` events. 
- **Security:** The webhook endpoint verifies the signature using the PayMongo Webhook Secret (`PAYMONGO_WEBHOOK_SECRET`) to prevent spoofing.

## 22.3 Authentication Service (NextAuth)

**Status:** `PRODUCTION_ACTIVE`
- **Route:** `src/app/api/auth/[...nextauth]/route.ts`
- **Purpose:** Handles login, session token generation, and OAuth callbacks (if social login is enabled).

## 22.4 AI and Chat Services

**Status:** `MOCK_OR_SIMULATION_ONLY`
- **Route:** `src/app/api/ai/chat/route.ts`
- **Purpose:** Connects the frontend chat interface to the backend LLM orchestrator.

## 22.5 Administrative and SOC APIs

The SOC module exposes extensive REST-like routes for managing security playbooks and approvals asynchronously:
- `src/app/api/soc/playbooks/list/route.ts`
- `src/app/api/soc/responses/execute/route.ts`
- `src/app/api/admin/security/cases/route.ts`

These endpoints enforce strict role-based authorization, requiring `SOC_ANALYST` or `SOC_SUPERVISOR` tokens.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-005 | `src/app/api` | Next.js API Routes | System integration points | Verified |

## Related Chapters
- Chapter 16: Security Operations Center
- Chapter 20: Technical Architecture
