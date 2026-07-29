# PHASE17 Authorized Migration Manifest

## Authorization and Scope

This manifest records the owner-authorized PHASE17 production schema-remediation package. The confirmed production Prisma baseline contains exactly 13 successfully finished, non-rolled-back migrations and ends at `20260719144014_add_correlation_key_subject_fixed`.

The owner approved the corrected authorization statement in `PHASE17_CORRECTED_OWNER_AUTHORIZATION_DRAFT.md`. Authorization covers:

- the exact 15-migration pending chain in this manifest;
- the three named constraint replacements;
- the conditionally authorized `prevent_incident_case_mutation()` operation, protected by catalog preflight;
- `20260727011311_phase5f_profile_encryption_companion_fields` as PHASE17 schema remediation without reopening PHASE5F;
- production-equivalent rehearsal, a verified PITR checkpoint, controlled maintenance, truthful Prisma metadata, post-execution verification, and checkpoint restoration on failure.

This package does not authorize application-record changes, unrelated migrations, deployment, privilege changes, secret changes, or any modification to a migration file.

## Confirmed Applied Migration Prefix

| Order | Migration | Repository `migration.sql` SHA-256 |
|---:|---|---|
| 1 | `20260715145648_init_soc_events` | `c1f906fd79bca44d275e648a5842909b482508b2577408508250ae7487fbae1e` |
| 2 | `20260715153500_add_soc_recovery` | `5f33b40d9f731bdc42ca367370b4aaff4b1d034bac387d7f347bec8fddf2e98d` |
| 3 | `20260715161457_add_soc_failure_resolution` | `f32c5b3c073acca6ee173e3b78782d3ad1ba9de6883b83633745dcd3ef84bff7` |
| 4 | `20260716000000_phase2_corrections` | `36b912c6581f8c88ad7ed64d0b7be996b03ef8dc413de4febd7f5a4f38015ef5` |
| 5 | `20260716000001_phase2_final_corrections` | `5adfef13612158f7f950804f23dcd16feee7d69ebc700a3ce84a101e6c4af942` |
| 6 | `20260716000002_phase2_v5_corrections` | `74aaee81ca23566f42cf3dbab2b7d768b654eeb2aac95408e0c52641c884996b` |
| 7 | `20260716032811_phase3_detection_rules_and_alerts` | `20f79086f6ee9663f1ef9457ee25faecbf151c4b97504fb2cde757d704497894` |
| 8 | `20260717074109_phase3_add_quarantined_detection_rule_status` | `018d0512833807f02488becac2b7115252914ab4ab061a39081c529a65c8f1b0` |
| 9 | `20260719122949_add_auth_security_log` | `6c2caba3a877d9e579966b05083bd8f523bed4d1079bdf1a9923cb1b63174c79` |
| 10 | `20260719125500_fix_authentication_security_log_source_enum` | `bfe296491a7bf1f74297434a76ad6109ae476d4127cb040dfd89ddae24890906` |
| 11 | `20260719140248_add_api_security_log` | `bbe5ae463da367377f3865f20dd76a25f5548774c0e7cbb100e98a93d32d996b` |
| 12 | `20260719140402_add_api_security_log_enum` | `160d2d3c1511fdd1890d61c01f1089e252551656c004a5cc99095de2eeaf8f10` |
| 13 | `20260719144014_add_correlation_key_subject_fixed` | `1a0d642d7e85cd801724bf2997b96966fd0458b3e50b18434cc08f0c1fd8f4fe` |

The pre-remediation validation script stops if the production names, order, completion state, rollback state, or checksums differ from this prefix.

## Exact Authorized Pending Migration Chain

| Order | Migration | Repository `migration.sql` SHA-256 | Classification |
|---:|---|---|---|
| 1 | `20260720061500_add_payment_action_log` | `96d807e94aadad68cff770ca57891b7b1891a61ec6a87e7ae1395916f66c3c88` | `ADDITIVE` |
| 2 | `20260720073000_add_checkout_idempotency` | `fc6a6fd3575e17fb37b7aef1cf9895eb99a517bff80cd1362539e42791e84003` | `ADDITIVE` |
| 3 | `20260720231333_add_payment_action_log_security_event_source` | `7a74a7a36ab7121c8db4ebb0ced83653f6c833b6584f402b11443e0f5d23dc5c` | `ADDITIVE` |
| 4 | `20260721155006_add_payment_action_log_amount_evidence` | `d0e85f799b343ac116f7b652dd2d94b94ac817de4edd2ecc73d01c35fb909f52` | `ADDITIVE` |
| 5 | `20260721173423_add_payment_action_log_currency_evidence` | `7b3ebc3c89e357546c44e9b13a4db630c3d997bc13563a01c13f752cb0d98bf5` | `ADDITIVE` |
| 6 | `20260723053752_add_incident_case_foundation` | `9b8a1b739902379b233e322e2a4e6fab4ec599f94f86ea371d8114182ead3d4b` | `ADDITIVE` plus conditionally authorized `AMBIGUOUS` function operation |
| 7 | `20260724131703_amend_incident_case_history_assignment` | `968ad6283a4d6e307952d7e58e4b524f0cfd78371dbf8bbf79769f2759444da9` | `AUTHORIZED_CONSTRAINT_REPLACEMENT` |
| 8 | `20260724140000_soc_gate4g_playbooks` | `49c0954dd50c2aab2a385cdda028b6a1f84d5967bfdab031d1dc24f3548ac280` | `ADDITIVE` |
| 9 | `20260724145953_reconcile_incident_case_reopen_lifecycle` | `268469bdc364bb28019cc033abeb53be80a28c55f04b31c6ce3590ac9e33fd10` | `AUTHORIZED_CONSTRAINT_REPLACEMENT` |
| 10 | `20260724155000_soc_gate4g_playbook_concurrency` | `4294363db5729b97585c3b6634445dbaec097e19e4839b12bbc027af321a1013` | `ADDITIVE` |
| 11 | `20260725000000_add_approved_scope_binding` | `0ef7d35d517311ebfa48b6f3976286f06e4b9eb22423e23165c30c0b9dac8f72` | `ADDITIVE` |
| 12 | `20260725145200_gate4h_reversible_response_execution` | `05a61ae99cd0fa2535d3e98fbcb0a63964b7bec36fa37edb124e012c6880a2d2` | `ADDITIVE` |
| 13 | `20260725185900_add_mfa_schema` | `0b80550562a0f5c0e5223c723fd3433dd3aa1f1fbc6167f9c836d8074def345b` | `ADDITIVE` |
| 14 | `20260726162419_add_behavioral_risk_persistence` | `759b2f785c7eeaf034064e8e6657d1b17fcb6bd466bde2cea5770e93226a208c` | `ADDITIVE` |
| 15 | `20260727011311_phase5f_profile_encryption_companion_fields` | `949245ac950861328cbf419911bfdb89e7f2e869431c70fb40f96b5857fe2a7f` | `ADDITIVE`; explicitly authorized PHASE17 schema remediation |

## Authorized Destructive and Ambiguous Operations

Exactly these operations are authorized:

1. Drop and replace `IncidentCaseHistory.chk_incidentcasehistory_status_change` through `20260724131703_amend_incident_case_history_assignment`.
2. Drop and replace `IncidentCase.chk_incidentcase_reopened_at_req` through `20260724145953_reconcile_incident_case_reopen_lifecycle`.
3. Drop and replace `IncidentCase.chk_incidentcase_reopened_at` through `20260724145953_reconcile_incident_case_reopen_lifecycle`.
4. Execute `CREATE OR REPLACE FUNCTION prevent_incident_case_mutation()` through `20260723053752_add_incident_case_foundation` only after catalog preflight establishes the authorized target state. The packaged preflight requires the function and incident-case tables to be absent; any different state stops execution.

No fourth constraint replacement, table drop, column drop, type drop, row deletion, application-record mutation, or unrelated migration is authorized.

## Truthful Prisma Metadata Rule

The production remediation script:

1. creates a started `_prisma_migrations` record immediately before each exact `migration.sql`;
2. records the repository SHA-256 for that exact file;
3. marks the record finished only after psql completes the file;
4. leaves a failed migration unfinished and stops immediately;
5. never marks an unexecuted migration as finished;
6. never fabricates a migration name or checksum.

A partial execution must not be rerun. Restore from the verified PITR checkpoint before another attempt.

## Authorized ZIP Payload

The ZIP contains exactly these files:

1. `docs/governance/remaining-work/PHASE17_AUTHORIZED_MIGRATION_MANIFEST.md`
2. `docs/governance/remaining-work/PHASE17_CORRECTED_OWNER_AUTHORIZATION_DRAFT.md`
3. `docs/governance/remaining-work/PHASE17_PRODUCTION_REMEDIATION_EXECUTION_GUIDE.md`
4. `scripts/phase17_authorized_checksums.sha256`
5. `scripts/phase17_pre_remediation_validation.sql`
6. `scripts/phase17_production_schema_remediation.sql`
7. `scripts/phase17_post_remediation_verification.sql`
8. `scripts/phase17_readonly_integrity_audit.sql`
9. `scripts/phase17_readonly_user_role_diagnostic.sql`
10. `prisma/migrations/20260720061500_add_payment_action_log/migration.sql`
11. `prisma/migrations/20260720073000_add_checkout_idempotency/migration.sql`
12. `prisma/migrations/20260720231333_add_payment_action_log_security_event_source/migration.sql`
13. `prisma/migrations/20260721155006_add_payment_action_log_amount_evidence/migration.sql`
14. `prisma/migrations/20260721173423_add_payment_action_log_currency_evidence/migration.sql`
15. `prisma/migrations/20260723053752_add_incident_case_foundation/migration.sql`
16. `prisma/migrations/20260724131703_amend_incident_case_history_assignment/migration.sql`
17. `prisma/migrations/20260724140000_soc_gate4g_playbooks/migration.sql`
18. `prisma/migrations/20260724145953_reconcile_incident_case_reopen_lifecycle/migration.sql`
19. `prisma/migrations/20260724155000_soc_gate4g_playbook_concurrency/migration.sql`
20. `prisma/migrations/20260725000000_add_approved_scope_binding/migration.sql`
21. `prisma/migrations/20260725145200_gate4h_reversible_response_execution/migration.sql`
22. `prisma/migrations/20260725185900_add_mfa_schema/migration.sql`
23. `prisma/migrations/20260726162419_add_behavioral_risk_persistence/migration.sql`
24. `prisma/migrations/20260727011311_phase5f_profile_encryption_companion_fields/migration.sql`

`scripts/phase17_authorized_checksums.sha256` hashes every payload file except itself. The detached ZIP checksum remains outside the ZIP. No checksum file hashes itself, and this manifest does not contain the final ZIP hash.
