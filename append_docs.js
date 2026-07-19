const fs = require('fs');

function appendToFile(filename, content) {
    fs.appendFileSync(filename, content + '\n');
}

// 1. PHASE4_RULE_CATALOG.md
appendToFile('docs/security/phase4/PHASE4_RULE_CATALOG.md', 
### Gate 4D-A Rule Tuning and Rationale
*   **API-RATE-ABUSE-01**:
    *   **Threshold rationale**: Set to 5 breaches. A single \API_RATE_LIMIT_EXCEEDED\ event represents a breach of the underlying general limiter (100req/min) or strict limiter (5req/min). Correlating 5 distinct breaches is a strong indicator of sustained abuse rather than a temporary spike.
    *   **Window rationale**: Set to 15 minutes (900 seconds) to capture persistent abuse across multiple limiter windows.
    *   **Cooldown rationale**: Set to 1 hour (3600 seconds) to avoid alert flooding for the same actor.
    *   **Initial tuning status**: INITIAL_DRAFT_TUNING_BASELINE.
*   **API-AUTHORIZATION-PROBE-01**:
    *   **Threshold rationale**: Set to 10 denials. An ordinary expired session might cause 1-2 denials. 10 denials within a short window is a strong indicator of probing.
    *   **Window rationale**: Set to 5 minutes (300 seconds).
    *   **Cooldown rationale**: Set to 1 hour (3600 seconds).
    *   **Initial tuning status**: INITIAL_DRAFT_TUNING_BASELINE.
*   **API-RESOURCE-ENUMERATION-01**: Status: UNVERIFIED. Initial Lifecycle: DRAFT. Ineligible for activation.
*   **WEB-CSRF-FAILURE-01**: Status: UNVERIFIED. Initial Lifecycle: DRAFT. Ineligible for activation.
*   **BOT-SCRAPING-01**: Status: UNVERIFIED. Initial Lifecycle: DRAFT. Ineligible for activation. Writer verified as MISSING.
*   **BOT-BOOKING-ABUSE-01**: Status: UNVERIFIED. Initial Lifecycle: DRAFT. Deferred to Gate 4B-4.
);

// 2. PHASE4_DECISION_REGISTER.md
appendToFile('docs/security/phase4/PHASE4_DECISION_REGISTER.md', 
### Gate 4D-A Decisions
*   **Correlation Architecture Selection**: \CORRELATION_KEY\ added to \DetectionCorrelationSubject\ enum in \schema.prisma\.
*   **Confirmation \	arget_resource_id\ was not overloaded**: The \	arget_resource_id\ field was deliberately NOT overloaded with composite strings. A new correlation key builder places \ACTOR:...\ or \SOURCE:...\ delimited composites natively into the existing \correlation_key\ field.
*   **Generic Evaluator Reuse Result**: Fully successfully reused \lert-generator.service.ts\ by merely enabling it to recognize the \CORRELATION_KEY\ subject type without requiring a separate Phase 4 specific engine.
*   **Adapter Version Result**: ApiSecurityLogAdapter bumped to version 1.1 due to material changes in correlation mapping.
*   **Bot-scraping Correction**: Threat Matrix corrected to list \BOT-SCRAPING-01\ as UNVERIFIED / WRITER_MISSING.
*   **Initialization Behavior**: Controlled Phase 3 initializers expanded to properly construct the DRAFT rules while preventing duplicates.
);

// 3. PHASE4_EVIDENCE_REGISTER.md
appendToFile('docs/security/phase4/PHASE4_EVIDENCE_REGISTER.md', 
### Gate 4D-A Evidence
*   **Compatible Rules**: \API-RATE-ABUSE-01\, \API-AUTHORIZATION-PROBE-01\.
*   **Unverified Rules**: \API-RESOURCE-ENUMERATION-01\, \WEB-CSRF-FAILURE-01\, \BOT-SCRAPING-01\, \BOT-BOOKING-ABUSE-01\.
*   **Test Counts**: 
    *   Initialization Tests: 5
    *   Correlation Semantics: 1
    *   Cleanup / Privacy: 1
*   **Advisory-only Result**: Verified that no cases or incident responses were mutated or generated. Rules strictly generate alerts.
*   **Cleanup Totals**: Validated 0 residual test rules, 0 residual logs.
);

// 4. PHASE4_CHANGE_IMPACT_LEDGER.md
appendToFile('docs/security/phase4/PHASE4_CHANGE_IMPACT_LEDGER.md', 
### Gate 4D-A Change Impact
*   **Adapter Impact**: \pi-security-adapter.ts\ now safely manages \ACTOR:\ and \SOURCE:\ subject domains to prevent collisions in correlation.
*   **Schema Impact**: \DetectionCorrelationSubject\ safely expanded to support \CORRELATION_KEY\.
);
