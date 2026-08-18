# Chapter 17 — AI Assistant and Automation

## 17.1 Artificial Intelligence Posture

**Current Status:** `MOCK_OR_SIMULATION_ONLY` / `IMPLEMENTED_BUT_DISABLED`.
RENTipid has architectural hooks for Generative AI and automated chat assistance; however, these systems are actively restricted from executing autonomous financial, administrative, or compliance actions.

## 17.2 The AI Support Assistant

The primary AI integration is designed to offload tier-1 customer support.
- **Renter Assistance:** AI can answer questions about the rental process, guide users on how to upload KYC documents, or explain the dispute process.
- **Provider Assistance:** AI can suggest optimal rental pricing based on category averages or help draft listing descriptions.

*Note: All AI interactions are logged in the `AIBotLog` model for compliance and quality assurance.*

## 17.3 AI Governance and Safeguards

To prevent "hallucinations" or unauthorized commitments, the AI module is restricted by strict boundaries:
1. **Read-Only Access:** The AI can query knowledge bases (RAG) but cannot execute POST/PUT/DELETE operations on user data.
2. **Escalation Triggers:** If the AI detects negative sentiment, threats of legal action, or physical safety concerns, it automatically escalates the chat to a human `SupportTicket` and notifies the SOC.
3. **No Financial Authority:** The AI cannot authorize refunds, waive platform fees, or alter the simulated escrow ledger.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `AIBotLog` | AI Telemetry | Verified |
| REPO-005 | `src/app/api/ai/chat/route.ts` | AI Chat Handler | Integration | Verified |

## Related Chapters
- Chapter 13: Administrative and Operations Manual
