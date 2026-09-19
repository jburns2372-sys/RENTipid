# RENTipid Unified Multi-Login Authentication Module

## Documentation Index v1.1.0

**Suite status:** COMPLETE DOCUMENTATION BASELINE FOR CLOSED / VERSION FROZEN MODULE  
**Frozen tag:** `rentipid-unified-auth-v1.1.0-frozen`  
**Prepared:** 2026-09-19

## Table of Contents

1. [Choose a document](#1-choose-a-document)
2. [Rendered publications](#2-rendered-publications)
3. [Diagram and image assets](#3-diagram-and-image-assets)
4. [Authority and consistency](#4-authority-and-consistency)
5. [Distribution and privacy](#5-distribution-and-privacy)

## 1. Choose a document

| Document | Audience | Purpose | Recommended starting point | Technical level | Status | Rendered PDF | Rendered DOCX |
|---|---|---|---|---|---|---|---|
| [Master Manual](01_RENTipid_Unified_Multi_Login_Master_Manual_v1.1.0.md) | All audiences; governance | Authoritative consolidated user, business, technical, security and operations manual with A-Z appendices | Product owners, auditors and readers needing full baseline | Mixed | Complete | [PDF](rendered/RENTipid_Unified_Multi_Login_Master_Manual_v1.1.0.pdf) | [DOCX](rendered/RENTipid_Unified_Multi_Login_Master_Manual_v1.1.0.docx) |
| [User Manual](02_RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.md) | Renters, providers, business users | Step-by-step sign-in, linking, recovery and safety guidance | End users and frontline support | Beginner | Complete | [PDF](rendered/RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.pdf) | [DOCX](rendered/RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.docx) |
| [Developer & Operations Manual](03_RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.md) | Developers, SRE, database, QA, support | Implementation architecture, schema, providers, tests, deployment, monitoring and rollback | Engineering and operations | Advanced | Complete | [PDF](rendered/RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.pdf) | [DOCX](rendered/RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.docx) |
| [Business Prospect Guide](04_RENTipid_Unified_Multi_Login_Business_Prospect_Guide_v1.1.0.md) | Prospects, partners, investors, LGUs | Business value, customer journey, security and enterprise context | Non-technical decision makers | Low to medium | Complete | [PDF](rendered/RENTipid_Unified_Multi_Login_Business_Prospect_Guide_v1.1.0.pdf) | [DOCX](rendered/RENTipid_Unified_Multi_Login_Business_Prospect_Guide_v1.1.0.docx) |
| [FAQ](05_RENTipid_Unified_Multi_Login_FAQ_v1.1.0.md) | All audiences | Concise answers grouped by user, business, developer and operations questions | Readers with a specific question | Mixed | Complete | N/A (Included in Master) | N/A (Included in Master) |
| [Troubleshooting Guide](06_RENTipid_Unified_Multi_Login_Troubleshooting_Guide_v1.1.0.md) | Users, support, operations, developers | Symptom-first diagnosis and escalation | Support during an active issue | Medium | Complete | N/A (Included in Master) | N/A (Included in Master) |
| [Architecture Reference](07_RENTipid_Unified_Multi_Login_Architecture_Reference_v1.1.0.md) | Architects, senior developers, reviewers | Canonical identity model, algorithms, boundaries and diagrams | Technical design review | Advanced | Complete | N/A (Included in Master) | N/A (Included in Master) |
| [API Reference](08_RENTipid_Unified_Multi_Login_API_Reference_v1.1.0.md) | Developers and integrators | Actual routes, authentication requirements, responses and security | Route implementation/support | Advanced | Complete | N/A (Included in Master) | N/A (Included in Master) |
| [Security Reference](09_RENTipid_Unified_Multi_Login_Security_Reference_v1.1.0.md) | Security, incident response, engineering | Threat model, OAuth/OTP/session controls, events and incidents | Security review and response | Advanced | Complete | N/A (Included in Master) | N/A (Included in Master) |
| Documentation Index | All audiences | Navigation and distribution guide | First-time documentation readers | Low | Complete | N/A | N/A |

## 2. Rendered publications

Publication copies are generated and stored in `rendered/`:

- `RENTipid_Unified_Multi_Login_Master_Manual_v1.1.0.docx` and `.pdf`
- `RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.docx` and `.pdf`
- `RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.docx` and `.pdf`
- `RENTipid_Unified_Multi_Login_Business_Prospect_Guide_v1.1.0.docx` and `.pdf`

The Markdown files are authoritative. Rendered files are publication views of those sources.

## 3. Diagram and image assets

- [`diagrams/README.md`](diagrams/README.md) indexes 12 Mermaid sources.
- [`images/unified-login-page.png`](images/unified-login-page.png) is a privacy-safe public sign-in screenshot.
- Authenticated Account Security screenshots are omitted to avoid exposing live user/session data.

## 4. Authority and consistency

All documents use these release facts:

| Item | Value |
|---|---|
| Module version | v1.1.0 |
| Status | CLOSED / VERSION FROZEN |
| Frozen tag | `rentipid-unified-auth-v1.1.0-frozen` |
| Production runtime source | `c0254631ea55030fd8e6c21ee73bc7a4563173ff` |
| Production deployment | `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse` |
| Production | `https://www.rentipid.com.ph` |
| Stable Preview | `https://preview.rentipid.com.ph` |
| Provider IDs | `credentials`, `phone-otp`, `google`, `facebook`, `apple` |

The permanent identity is `User.id`. OAuth identity keys are provider plus provider subject. Same-email automatic linking is disabled. Provider roles never assign RENTipid business roles.

## 5. Distribution and privacy

Before external distribution, apply RENTipid's approved branding, contact and classification decision. For partnership, enterprise, or business inquiries, use the official contact channels published by RENTipid through its website or application.

Do not add screenshots, environment exports or logs containing user email, phone number, provider subject, token, cookie, credential, database URL or secret. If a future screenshot is needed, use a designated non-production account and redact all personal/security data before committing.
