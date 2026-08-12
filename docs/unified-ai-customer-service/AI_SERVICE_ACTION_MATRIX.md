# AI SERVICE ACTION MATRIX

| Action / Capability | Orchestrator Rule | Gateway Enforcement | Fallback / Block Rule |
| ------------------- | ----------------- | ------------------- | --------------------- |
| General Info/FAQ | Synthesize using `AiKnowledgeSource` | READ_ONLY | Safe uncertainty (No hallucination) |
| Case Creation | Request minimum evidence; Set `AiSupportCase` | DRAFT_ONLY | Hold until evidence received |
| Bookings/Rentals | Fetch via tools; Draft changes | USER_CONFIRMATION_REQUIRED | Reject without confirmation |
| Policy Execution | Present deterministic engine result | POLICY_ENGINE_REQUIRED | Cannot override policy amount |
| Insurance/KYC | Query boundary services | EXTERNAL_AUTHORITY_REQUIRED | Safe hold / Escalate externally |
| DB Mutation | Not allowed via raw SQL/Prisma | AI_PROHIBITED | Strictly BLOCKED |
| Admin actions | Not exposed to model | AI_PROHIBITED | Strictly BLOCKED |
| Self-Repair | One reconnect/fallback attempt | USER_CONFIRMATION_REQUIRED | Switch to text-only mode |
