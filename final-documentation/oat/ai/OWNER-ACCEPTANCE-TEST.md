# UNIFIED AUTONOMOUS AI CUSTOMER SERVICE - OWNER ACCEPTANCE TEST (OAT)
**Framework ID:** RENTIPID-OAT-AI-MASTER-001
**Criticality:** TIER 1 - BUSINESS-CRITICAL
**Environment:** PREVIEW

## PREREQUISITES
- [ ] Ensure OAT Environment is `PREVIEW`
- [ ] Run `npm run oat:ai:setup` (or Vercel equivalent) to generate the baseline knowledge source and OAT Renter identity.
- [ ] Verify `npm run oat:ai:check` reports `OVERALL: READY`.

## TEST 1: AI ASSISTANT INITIATION
1. Log in as `oat.renter@rentipid.test`.
2. Navigate to the `/help` route or click the AI floating action button (if enabled via feature flags).
3. **Verify:** The AI interface successfully loads and displays a welcome message.
4. **Verify:** A new `AiServiceSession` and `AiConversation` record are created in the database.

## TEST 2: KNOWLEDGE RETRIEVAL
1. Ask the AI a question covered by the `oat-ai-test-policy` knowledge fixture.
2. **Verify:** The AI responds accurately using the approved policy.
3. **Verify:** The `AiMessage` log accurately attributes the source reference.

## TEST 3: ESCALATION & SUPPORT CASE GENERATION
1. Tell the AI that you have an unresolved complaint that requires human intervention.
2. **Verify:** The AI escalates the issue.
3. **Verify:** A new `AiSupportCase` is generated with `status` = `OPEN`.

## TEST 4: DIGITAL HUMAN / VOICE (OPTIONAL SANDBOX)
1. If the mock Digital Human provider is active, initiate a voice session.
2. **Verify:** The `AiProviderSession` is established in `active` status.

## TEARDOWN & CLEANUP
- [ ] Run `npm run oat:ai:reset` (or Vercel equivalent).
- [ ] **Verify:** The specific `AiConversation`, `AiSupportCase`, `AiMessage`, and associated transient session data for `oat.renter` are completely removed.
- [ ] **Verify:** The baseline `oat-ai-test-policy` knowledge fixture remains intact.
- [ ] **Verify:** The underlying domain models (e.g. Listings, Users) remain untouched.

---
**FORMAL OWNER ACCEPTANCE EXECUTED:** NO
**READY FOR PREVIEW OWNER ACCEPTANCE:** YES
