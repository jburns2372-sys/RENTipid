# INTERFACE CONTRACTS

## 1. SESSION / CONVERSATION
**Contract:** The client will authenticate using NextAuth. The `AvatarSessionBroker` will issue a short-lived scoped token for media streaming. All AI requests (text or voice) will include the `AiConversation` ID to maintain cross-channel continuity.
**Data:** `AiServiceSession` tracks the lifecycle, quotas, and provider state.

## 2. TOOL GATEWAY
**Contract:** Tools are defined strictly server-side. The generative model responds with a structured tool-call request including: `toolName`, `parameters`, and a generated `requestFingerprint` for idempotency.
**Enforcement:** Gateway validates `toolName`, checks RBAC, validates input schema, invokes deterministic policies, and handles confirmation states before mutating any DB record.

## 3. PROVIDER ADAPTER
**Contract:** Isolates external SDKs.
**Methods:** `initializeSession()`, `sendAudio()`, `receiveAudio()`, `closeSession()`.

## 4. UI / CHANNEL
**Contract:** UI sends User intents (audio blob or text) to the Shared Core. Receives structured responses containing text, audio stream data, and `Cards` (JSON UI hints for bookings, policies, resolutions). UI is stateless regarding case outcomes.
