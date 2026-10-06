# RENTipid GLCC v1.1 — Locale Pack Generation & Validation Governance Template

**Controlling Master:** `RENTIPID-GLCC-MULTILINGUAL-MIP-001 v1.0`  
**Workstream:** `P12 / v1.1 GLOBAL EXPANSION FACTORY`  
**Document:** `LOCALE PACK GENERATION & VALIDATION TEMPLATE`  
**Version:** `1.1.0`  

---

## 1. Overview & Purpose

This template governs the compilation of a fully approved translation work package into a sealed, machine-readable, tamper-evident **Locale Pack** (`LocalePack`) release candidate.

The compiled locale pack acts as an immutable candidate artifact for downstream linguistic QA, visual regression verification, hydration audits, and staging promotion in Work Package P12-E.

---

## 2. Input Prerequisites

The Locale Pack Generator (`generateLocalePack`) accepts input only when all upstream criteria are satisfied:
1. **Workflow State:** Must be strictly `APPROVED_FOR_QA`. Packages in `SOURCE_LOCKED`, `DRAFT`, `LINGUISTIC_REVIEW`, or `COMPLIANCE_REVIEW` are rejected.
2. **Canonical Parity:** 100% canonical key completeness (`2,208 / 2,208`). Zero missing, extra, or duplicate keys.
3. **Cryptographic Checksum Parity:** Upstream `canonicalKeyChecksum` and `sourceMessageChecksum` must match live repository contracts with zero source drift.
4. **Placeholder Parity:** 100% placeholder variable matching with zero broken tokens.
5. **Class C Legal Clearance:** All controlled legal/compliance strings must possess formal `APPROVED` status, accredited human `reviewerReference`, and valid `legalApprovalReference`.

---

## 3. Machine-Readable Locale Pack Schema

```typescript
export interface LocalePack {
  packVersion: string;                       // e.g. "1.1.0"
  localeTag: string;                         // BCP-47 tag, e.g. "fil-PH", "ja-JP"
  sourceLocale: string;                      // Canonical reference ("en-PH")
  workflowPackageVersion: string;            // Version of upstream work package
  canonicalKeyCount: number;                 // 2,208
  canonicalKeyChecksum: string;              // SHA-256 of canonical key array
  sourceMessageChecksum: string;             // SHA-256 of canonical source messages
  targetMessageChecksum: string;             // SHA-256 of sorted target translations
  packChecksum: string;                      // Sealed tamper-evident SHA-256 signature
  generatedAt: string;                       // ISO 8601 generation timestamp
  workflowState: 'APPROVED_FOR_QA';          // Fixed compilation state
  releaseCandidateState: 'CANDIDATE_FOR_QA'; // Non-release candidate state
  localeMetadata: LocalePackMetadata;        // Structural formatting and display metadata
  messages: Record<string, LocalePackMessageItem>;
  validationSummary: LocalePackValidationSummary;
  approvalReferences: Record<string, string>;
}
```

---

## 4. Architectural Firewalls

### 4.1. Runtime Installation Firewall
- **Rule:** Generation tooling must **NEVER** write directly into runtime directories:
  - `src/lib/glcc/i18n/locales/**`
  - `src/lib/glcc/default-registries.ts`
  - `src/lib/glcc/i18n/contracts/**`
- **Behavior:** Any attempt to direct generation output into protected runtime paths fails closed immediately with `RUNTIME_INSTALLATION_FIREWALL`.

### 4.2. Release-State Promotion Firewall
- **Rule:** A generated locale pack has **ZERO** authority to self-promote into `QA_REQUIRED` or `PRODUCTION_READY`.
- **Behavior:** The pack's internal release indicator is hardcoded to `releaseCandidateState: 'CANDIDATE_FOR_QA'`.
- **Selectability:** Candidate packs remain 100% fail-closed and cannot be selected in production or staging UI without explicit subsequent governed lifecycle promotion.

---

## 5. Metadata & Directionality Contract

Each locale pack must specify:
- **`tag`**: BCP-47 tag compliant with `/^[a-z]{2,3}(-[A-Za-z0-9]{2,4})*$/`.
- **`direction`**: Strictly `'ltr'` or `'rtl'`. The compiler must validate both directions seamlessly.
- **`script`**: Standard ISO 15924 four-letter script code (e.g. `Latn`, `Kana`, `Arab`).
- **`displayName` & `nativeDisplayName`**: Non-empty English and endonym representations.
- **`numberingMetadata` & `dateTimeFormattingMetadata`**: Standards-compliant format configurations.

---

## 6. Fallback Integrity Rules

1. **No Self-Fallback:** A locale cannot declare itself as its own fallback (`target !== fallback`).
2. **No Circular Dependencies:** Fallback chains must be strictly acyclic (e.g., `A -> B -> A` is rejected).
3. **Approved Fallback Target:** The terminal fallback must resolve to the authoritative enterprise default (`en-PH`).
4. **Authority Isolation:** Production authority or payment rights cannot be inherited via fallback.

---

## 7. Tamper Detection & Checksum Integrity

- Every compiled pack generates a deterministic `targetMessageChecksum` across sorted translations.
- A composite `packChecksum` is calculated across `localeTag`, `targetMessageChecksum`, and `localeMetadata`.
- During validation, `validateLocalePack()` recalculates all hashes.
- If any message string, placeholder, or metadata attribute is modified out-of-band, validation fails with `status: 'TAMPER_DETECTED'`.

---

## 8. Handoff to Work Package P12-E

Once a candidate locale pack passes `validateLocalePack()` with `status: 'VALID'`, it is formally stored as:
```text
docs/governance/glcc-v1.1/evidence/p12/[locale]-candidate-pack.json
```
and handed off to **Work Package P12-E (Language-Specific QA Factory)** to execute headless browser rendering, client-side hydration, route persistence, and guest/auth isolation testing.
