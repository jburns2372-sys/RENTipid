# RENTipid GLCC v1.1 — Legal & Compliance Translation Control Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Document:** `LEGAL / COMPLIANCE TRANSLATION CONTROL TEMPLATE`  
**Controlled Scope:** Class C Legal, Regulatory, Compliance, Disclosures, Terms, and Statutory Notices  
**Authoritative Language:** English (Philippines) — `en-PH`  
**Controlled Content Status:** `[GOVERNED / PENDING_REVIEW / APPROVED / REVOKED]`  

---

## 1. Class C Controlled Content Authority Model

Class C content represents all statutory, regulatory, and contractual declarations where legal meaning must never be diluted, modified, or inferred through automated means. Class C translation is strictly governed by an explicit authority hierarchy:

```
AUTHORITATIVE_SOURCE (Original governed legal document; e.g. en-PH)
       │
       ▼
APPROVED_TRANSLATION (Human accredited legal/compliance translation with formal approvalReference)
       │
       ▼
REFERENCE_TRANSLATION (Informational translation for user assistance; non-binding)
       │
       ▼
DRAFT_TRANSLATION (Work-in-progress or AI-generated translation; strictly prohibited from authoritative use)
```

### Governing Rule:
Only `AUTHORITATIVE_SOURCE` or an accredited `APPROVED_TRANSLATION` bearing a verified `approvalReference` and matching checksums may be presented as legally binding or authoritative to users or regulatory authorities.

---

## 2. Legal Source Registry Contract

Every controlled legal document must be formally cataloged in the machine-readable Legal Source Registry before translation work begins.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `sourceId` | `string` | Unique identifier (e.g. `rentipid-terms-of-service`, `rentipid-privacy-policy`) |
| `contentType` | `string` | Legal classification (`TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `KYC_DISCLOSURE`, `REGULATORY_NOTICE`, `JURISDICTION_NOTICE`, `PAYMENT_DISCLAIMER`, `MANDATORY_CONSENT`, `CONTRACTUAL_NOTICE`) |
| `title` | `string` | Human-readable document title |
| `authoritativeLocale` | `string` | Primary governing language tag (e.g. `en-PH`) |
| `sourceVersion` | `string` | Semantic document version (e.g. `1.0.0`) |
| `sourceChecksum` | `string` | SHA-256 hash of authoritative source text content |
| `effectiveDate` | `string` | ISO 8601 date when document becomes legally active |
| `jurisdictions` | `string[]` | Array of governing jurisdictions (e.g. `["PH"]`, `["GLOBAL"]`) |
| `status` | `string` | `ACTIVE`, `SUPERSEDED`, or `DEPRECATED` |
| `isAuthoritative` | `boolean` | Must be `true` for root legal source |
| `approvalAuthority` | `string` | Corporate/legal entity approving source (e.g. `RENTipid Legal & Compliance Board`) |
| `retentionReference` | `string` | Internal document repository retention identifier |
| `supersedesSourceId` | `string` | *(Optional)* ID of prior document version replaced |

---

## 3. Controlled Translation Record Specification

Each localized version of a Class C document must maintain a cryptographically verifiable translation record:

```json
{
  "translationId": "tos-zz-zz-v1.0.0",
  "sourceId": "rentipid-terms-of-service",
  "sourceVersion": "1.0.0",
  "sourceChecksum": "<sha256-of-source>",
  "targetLocale": "zz-ZZ",
  "translationVersion": "1.0.0",
  "translationChecksum": "<sha256-of-translation>",
  "workflowState": "APPROVED",
  "translatorReference": "certified-translator-id-01",
  "linguisticReviewerReference": "linguist-reviewer-id-02",
  "legalReviewerReference": "bar-certified-attorney-id-03",
  "complianceReviewerReference": "compliance-officer-id-04",
  "approvalStatus": "APPROVED",
  "approvalReference": "LEGAL-APP-2026-ZZ-001",
  "approvalDate": "2026-10-06T00:00:00Z",
  "jurisdictions": ["ZZ", "GLOBAL"],
  "effectiveDate": "2026-10-06T00:00:00Z",
  "expiryDate": null,
  "supersededBy": null
}
```

---

## 4. Legal Approval State Lifecycle

Class C translations cycle through six strict lifecycle states:

```
               ┌────────────────┐
               │  NOT_REQUIRED  │ (Class A / B general UI content)
               └────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐               ┌──────────────┐
│   PENDING    │──────────────▶│   REJECTED   │
└──────────────┘               └──────────────┘
       │                               ▲
       │ Review & Sign-off             │
       ▼                               │
┌──────────────┐                       │
│   APPROVED   │───────────────────────┤
└──────────────┘                       │
       │                               │
       ├───────────────────────────────┤ Revocation
       ▼                               ▼
┌──────────────┐               ┌──────────────┐
│  SUPERSEDED  │               │   REVOKED    │
└──────────────┘               └──────────────┘
```

- **`APPROVED`**: Mandatory prerequisite for authoritative localized presentation.
- **`PENDING`**: In review; cannot be used as authoritative legal content.
- **`REJECTED`**: Defective legal translation; prohibited from display.
- **`SUPERSEDED`**: Replaced by newer approved translation version; retained for historical audit only.
- **`REVOKED`**: Terminated due to legal error or regulatory invalidation; fails closed immediately.

---

## 5. Source Version Consistency & Drift Guard

Translations are strictly coupled to the exact source version and checksum:
1. **Source Coupling:** A translation approved for source version `X.Y.Z` with checksum `Hash_A` is valid **only** for that exact source text.
2. **Drift Detection:** If the authoritative source document changes (version bump or checksum change to `Hash_B`):
   - The existing translation is automatically classified as **`SOURCE_OUTDATED`**.
   - Prior approval does **not** carry forward automatically.
   - The translation cannot be used as authoritative localized text until re-reviewed and accredited against `Hash_B`.

---

## 6. Jurisdiction Control & Boundaries

1. **Jurisdiction Scope:** Legal approval is valid exclusively for the declared jurisdictions (e.g. `PH`, `JP`, `US`, or `GLOBAL`).
2. **No Automatic Jurisdiction Cross-Over:** A translation approved for jurisdiction `PH` cannot be served as authoritative legal text for jurisdiction `US` or `JP`.
3. **Locale Independence:** The user's chosen UI language (e.g. Japanese or English) **never** modifies the governing jurisdiction. Jurisdiction is determined by property location, tenancy contract, and statutory residency.

---

## 7. Authoritative Fallback Rule

If an approved localized translation is missing, pending, revoked, or outdated:
- The system **must fail closed** to the authoritative source document (e.g. `en-PH` original legal text).
- The system must display a formal governing notice that the source English text constitutes the sole binding legal document.
- The system **must NEVER**:
  - Silently substitute an unapproved machine translation.
  - Silently display an unreviewed draft.
  - Mark unaccredited text as legally authoritative.

---

## 8. AI Legal Authority Firewall

Artificial Intelligence systems (LLMs, neural MT, generative tools) have strictly defined operational boundaries:

### Permitted AI Functions:
- Generating initial translation suggestions (`DRAFT_TRANSLATION`).
- Comparing source and translated text for clause completeness.
- Detecting stylistic inconsistencies and formatting discrepancies.
- Flagging potential source drift.

### Prohibited AI Functions (Strictly Enforced):
- AI cannot approve legal or compliance text.
- AI cannot set `approvalStatus: "APPROVED"`.
- AI cannot generate an `approvalReference`.
- AI cannot replace or override the authoritative source.
- AI cannot modify governing jurisdiction or compliance thresholds.
- AI drafts cannot be published as authoritative content.

---

## 9. Tamper Control & Immutability

1. **Immutable Approval:** Once an `approvalReference` is issued, the translation text and metadata become immutable.
2. **Hash Invalidation:** Any post-approval byte alteration modifies `translationChecksum`, immediately tripping the **`TAMPER_DETECTED`** guard and voiding authoritative status.
3. **Re-Review Requirement:** Any text change requires incrementing `translationVersion`, resetting approval status to `PENDING`, and acquiring new reviewer sign-offs.

---

## 10. Audit, Retention & QA Handoff

### Audit & Retention:
- Every version (source and translation), reviewer identifier, timestamp, and approval reference is retained in the historical audit ledger.
- Superseded and revoked records are preserved immutably for compliance retention periods.

### P12-E QA Handoff (Domain QA-20):
- P12-F feeds verification evidence directly into QA domain **`QA-20: Legal / Compliance Authority`**.
- QA-20 validates that:
  - Authoritative source remains preserved.
  - Exact source versions and checksums match.
  - Target legal approval is active (`APPROVED`).
  - Jurisdiction matches statutory requirements.
  - AI promotion is blocked.
  - Fallback logic operates truthfully.
