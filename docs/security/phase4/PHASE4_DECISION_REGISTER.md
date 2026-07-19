# PHASE 4 DECISION REGISTER

- Dedicated SOC Analyst role approved in principle
- Dedicated SOC Supervisor role approved in principle
- Implementation deferred from Gate 4A
- External providers undecided
- Production Phase 4 deployment unauthorized
- Autonomous destructive actions prohibited
- Emergency payment freeze remains separately controlled
- SOC roles deferred to Gate 4F
- HMAC-SHA-256 pseudonymization approved
- Routine auth retention 180 days
- Incident-linked retention 365 days after case closure
- API request volume assigned to external telemetry
- FIN-002 correction approved

### Gate 4D-A Decisions
*   **Correlation Architecture Selection**: CORRELATION_KEY added to DetectionCorrelationSubject enum in schema.prisma.
*   **Confirmation target_resource_id was not overloaded**: The target_resource_id field was deliberately NOT overloaded with composite strings. A new correlation key builder places ACTOR:... or SOURCE:... delimited composites natively into the existing correlation_key field.
*   **Generic Evaluator Reuse Result**: Fully successfully reused alert-generator.service.ts by merely enabling it to recognize the CORRELATION_KEY subject type without requiring a separate Phase 4 specific engine.
*   **Adapter Version Result**: ApiSecurityLogAdapter bumped to version 1.1 due to material changes in correlation mapping.
*   **Bot-scraping Correction**: Threat Matrix corrected to list BOT-SCRAPING-01 as UNVERIFIED / WRITER_MISSING.
*   **Initialization Behavior**: Controlled Phase 3 initializers expanded to properly construct the DRAFT rules while preventing duplicates.
