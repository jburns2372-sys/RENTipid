# R8 — PRIVACY / DATA FLOW

| Data Element | Privacy Constraint |
|---|---|
| Booking Data | Minimum necessary partner data (dates, values) |
| User Data | PII limited to name/contact required for issuance |
| KYC Reference | Hash-only data or opaque references sent to partner |
| Listing Data | General category/location allowed |
| Insurance Offer | Public/Non-sensitive |
| Consent | Immutable record of explicit user consent required |
| Policy | Confidential to Renter, Provider, Admin, Partner |
| Claim | Confidential, contains sensitive context |
| Evidence | Sensitive evidence; encrypted storage references only |
| Partner API | Transport Layer Security required |
| Webhook | Authenticated via signature/HMAC |
| Finance | Ledger access restricted to Finance Admin |
| Audit | Immutable, restricted to Super Admin |
| Retention | Follows statutory retention requirements (e.g., 7 years for financial records) |
