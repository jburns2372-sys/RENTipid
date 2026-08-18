# PHASE 4 RESPONSE BOUNDARY

## Response Levels
- LEVEL_0: ALERT_ONLY
- LEVEL_1: INVESTIGATION
- LEVEL_2: REVERSIBLE_SECURITY_ACTION
- LEVEL_3: CONTROLLED_BUSINESS_RESTRICTION
- LEVEL_4: EMERGENCY_PLATFORM_CONTROL

## Reversible Executor Allowlist
The initially proposed reversible executor allowlist is architectural and not yet implemented:
- REVOKE_SELECTED_SESSIONS
- REQUIRE_REAUTHENTICATION
- REQUIRE_STEP_UP_VERIFICATION
- TEMPORARY_LOGIN_THROTTLE
- TEMPORARY_ACCOUNT_REVIEW_RESTRICTION
- LISTING_REVIEW_HOLD
- BOOKING_REVIEW_HOLD
- PAYOUT_REVIEW_HOLD
- KYC_MANUAL_REVIEW_REFERRAL
- SECURITY_NOTIFICATION

## Prohibited Actions
- Permanent automatic account deletion
- Automatic permanent blacklisting
- Automatic payment transfer
- Automatic payout release
- Automatic refund
- Automatic booking cancellation
- Automatic KYC rejection
- Evidence deletion
- Audit deletion
- Unapproved emergency freeze
- Automatic irreversible action
- Alert-direct-to-business-mutation execution

## Mandatory Response Chain
SecurityAlert -> incident case -> investigation -> response recommendation -> required approval -> dual control where applicable -> execution request -> reversible executor -> verification -> expiration or rollback -> audit

No executor may run directly from a SecurityAlert or detection rule.
