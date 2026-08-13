# Security & Audit Foundation

## Guardrails
- Idempotency checks implemented for provider events and webhook payloads (`idempotency_key`).
- Secrets are NEVER stored in raw format within public DB fields. Only secure `credential_reference` pointers are stored in `SocialAccount`.
- Audit layer integrated with existing `src/lib/audit.ts` hooks.
- Mock adapter validates safely rejecting configurations.

## Event Normalization
Provider payloads are scrubbed in the `normalizeProviderEvent` layer to strip auth tokens before they persist to `SocialProviderEvent`.


## Phase 5 Security Additions
- **Media Validation**: Strict server-side checks reject path traversal (../) and absolute URLs outside the authorized RENTipid storage namespace.
- **Audit Logs**: Events are emitted for DRAFT_CREATED, DRAFT_EDITED (including capability changes like media attachment), and DRAFT_SUBMITTED (along with failures).