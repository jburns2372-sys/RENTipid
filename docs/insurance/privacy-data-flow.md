# Insurance Privacy & Data Flow

This document outlines the strict privacy boundaries and data flow requirements for the RENTipid Insurance module, extending the existing RENTipid Privacy Framework.

## 1. Purpose and Scope
The Insurance module collects and transmits specific personal and financial data to external insurance partners to facilitate:
- Eligibility checks and premium quoting.
- Policy issuance and certificate generation.
- Claims processing and adjudication.

## 2. Data Flow Map
- **Renter/Provider -> RENTipid**: Submits booking details, identity verification, and (if claiming) damage evidence.
- **RENTipid -> Insurer/Intermediary**: Transmits sanitized `InsuranceEligibilityRequest` (dates, item category, value). During issuance, transmits necessary PII (Name, minimal contact info required by partner). During claims, transmits `InsuranceClaimEvidence` (photos, descriptions).
- **Insurer -> RENTipid**: Returns policy certificates, claim statuses, and reconciliation settlements.

## 3. Minimum Necessary Data
- Only the minimum data required by the specific partner's API contract is transmitted.
- RENTipid does NOT transmit full platform interaction histories, unrelated booking data, or password hashes to insurers.

## 4. Claims Evidence Retention & Access
- **Storage**: `InsuranceClaimEvidence` files are stored in a dedicated, access-controlled bucket, isolated from public listing images.
- **Access**: Restricted to the involved Renter, Provider, Support/SOC (for routing only), and the designated Insurer.
- **Retention Limitations**: Evidence must be retained for the duration of the regulatory statute of limitations (typically 3-7 years depending on jurisdiction) even if the user requests account deletion, to preserve legal defense and fraud investigation rights.

## 5. Audit & Telemetry
- `InsuranceTelemetry` and `AuditLog` records must NEVER contain raw API payloads containing PII, webhook secrets, or unredacted claim evidence.
- Financial records (`FinanceLedger`, `InsuranceReconciliationLog`) retain transaction metadata but omit sensitive payment instrument details (PCI-DSS compliance handled by payment gateway).

## 6. Privacy Incident Handling
Refer to the `privacy-incident.md` Runbook. Any unauthorized access to the `InsuranceClaimEvidence` or policy data triggers immediate partner notification and kill switch evaluation.
