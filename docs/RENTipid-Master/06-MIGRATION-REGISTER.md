# RENTipid Migration Register

Canonical directory: `prisma/migrations`. Historical migrations are immutable. Current LOCAL baseline count: 38; pending migrations: 0; failed migrations: 0.

| Order | Migration | Domain | Recorded state |
| ---: | --- | --- | --- |
| 1 | `20260715145648_init_soc_events` | SOC | LOCAL DATABASE MIGRATED |
| 2 | `20260715153500_add_soc_recovery` | SOC recovery | LOCAL DATABASE MIGRATED |
| 3 | `20260715161457_add_soc_failure_resolution` | SOC recovery | LOCAL DATABASE MIGRATED |
| 4 | `20260716000000_phase2_corrections` | SOC | LOCAL DATABASE MIGRATED |
| 5 | `20260716000001_phase2_final_corrections` | SOC | LOCAL DATABASE MIGRATED |
| 6 | `20260716000002_phase2_v5_corrections` | SOC | LOCAL DATABASE MIGRATED |
| 7 | `20260716032811_phase3_detection_rules_and_alerts` | Detection | LOCAL DATABASE MIGRATED |
| 8 | `20260717074109_phase3_add_quarantined_detection_rule_status` | Detection | LOCAL DATABASE MIGRATED |
| 9 | `20260719122949_add_auth_security_log` | Authentication | LOCAL DATABASE MIGRATED |
| 10 | `20260719125500_fix_authentication_security_log_source_enum` | Authentication | LOCAL DATABASE MIGRATED |
| 11 | `20260719140248_add_api_security_log` | API security | LOCAL DATABASE MIGRATED |
| 12 | `20260719140402_add_api_security_log_enum` | API security | LOCAL DATABASE MIGRATED |
| 13 | `20260719144014_add_correlation_key_subject_fixed` | Security events | LOCAL DATABASE MIGRATED |
| 14 | `20260720061500_add_payment_action_log` | Payments | LOCAL DATABASE MIGRATED |
| 15 | `20260720073000_add_checkout_idempotency` | Payments | LOCAL DATABASE MIGRATED |
| 16 | `20260720231333_add_payment_action_log_security_event_source` | Payments/SOC | LOCAL DATABASE MIGRATED |
| 17 | `20260721155006_add_payment_action_log_amount_evidence` | Payments | LOCAL DATABASE MIGRATED |
| 18 | `20260721173423_add_payment_action_log_currency_evidence` | Payments | LOCAL DATABASE MIGRATED |
| 19 | `20260723053752_add_incident_case_foundation` | Incident cases | LOCAL DATABASE MIGRATED |
| 20 | `20260724131703_amend_incident_case_history_assignment` | Incident cases | LOCAL DATABASE MIGRATED |
| 21 | `20260724140000_soc_gate4g_playbooks` | Playbooks | LOCAL DATABASE MIGRATED |
| 22 | `20260724145953_reconcile_incident_case_reopen_lifecycle` | Incident cases | LOCAL DATABASE MIGRATED |
| 23 | `20260724155000_soc_gate4g_playbook_concurrency` | Playbooks | LOCAL DATABASE MIGRATED |
| 24 | `20260725000000_add_approved_scope_binding` | Response approvals | LOCAL DATABASE MIGRATED |
| 25 | `20260725145200_gate4h_reversible_response_execution` | Response execution | LOCAL DATABASE MIGRATED |
| 26 | `20260725185900_add_mfa_schema` | MFA | LOCAL DATABASE MIGRATED |
| 27 | `20260726162419_add_behavioral_risk_persistence` | Behavioral risk | LOCAL DATABASE MIGRATED |
| 28 | `20260727011311_phase5f_profile_encryption_companion_fields` | Profile encryption | LOCAL DATABASE MIGRATED |
| 29 | `20260731160300_init_prohibited_items_phase2` | Prohibited items | LOCAL DATABASE MIGRATED |
| 30 | `20260805092944_privacy_v1_schema_recovery` | Privacy | LOCAL DATABASE MIGRATED |
| 31 | `20260807000000_privacy_v1_remediation` | Privacy | LOCAL DATABASE MIGRATED |
| 32 | `20260808000000_reconcile_schema_drift` | Cross-domain | LOCAL DATABASE MIGRATED |
| 33 | `20260809000000_add_global_address` | Address | CLOSED / FROZEN |
| 34 | `20260809000001_add_address_rate_limit` | Address | CLOSED / FROZEN |
| 35 | `20260809000002_add_address_rate_limit_cleanup_index` | Address | CLOSED / FROZEN |
| 36 | `20260811000001_add_psgc_subdivision` | Address/PSGC | CLOSED / FROZEN |
| 37 | `20260811000002_add_password_recovery` | Identity/Auth | LOCAL DATABASE MIGRATED — functional implementation not authorized by schema gate |
| 38 | `20260812000000_add_insurance_foundation` | Insurance Technical Foundation Slice 1 | LOCAL DATABASE MIGRATED — EVD-INS-S1-GATE3 PASS |

## Evidence limits

- The ordered migration history exists and Address closure proved all migrations on disposable databases.
- That Address proof does not replace a future whole-application fresh-empty-database acceptance at LOCAL-RC1.
- Preview and Production migration state is module-specific. Address Preview was accepted; no global application migration claim is made.
- New schema changes require additive migrations where possible, targeted preservation tests, and explicit destructive-operation authorization where not possible.
