\set ON_ERROR_STOP on
\pset pager off
BEGIN READ ONLY;

WITH fragments (ordinal, check_id, category, required_tables, query_sql) AS (
VALUES
    (1, 'P17-001', 'execution_context', '', $phase17_fragment$
SELECT
        'P17-001',
        'execution_context',
        'CRITICAL',
        CASE WHEN current_user = 'rentipid_phase17_readonly' THEN 0::bigint ELSE 1::bigint END,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Audit must execute as the dedicated PHASE17 read-only role.'
$phase17_fragment$),
    (2, 'P17-002', 'execution_context', '', $phase17_fragment$
SELECT
        'P17-002',
        'execution_context',
        'CRITICAL',
        CASE WHEN current_database() = 'rentipid_db' THEN 0::bigint ELSE 1::bigint END,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Audit must execute against the owner-designated production logical database.'
$phase17_fragment$),
    (3, 'P17-003', 'execution_context', '', $phase17_fragment$
SELECT
        'P17-003',
        'execution_context',
        'CRITICAL',
        CASE WHEN current_setting('transaction_read_only') = 'on' THEN 0::bigint ELSE 1::bigint END,
        'CRITICAL_GO_LIVE_BLOCKER',
        'The active transaction must be read-only.'
$phase17_fragment$),
    (4, 'P17-004', 'execution_context', '', $phase17_fragment$
SELECT
        'P17-004',
        'execution_context',
        'CRITICAL',
        CASE WHEN current_setting('default_transaction_read_only') = 'on' THEN 0::bigint ELSE 1::bigint END,
        'CRITICAL_GO_LIVE_BLOCKER',
        'The role default transaction mode must be read-only.'
$phase17_fragment$),
    (5, 'P17-005', 'migration_integrity', '_prisma_migrations', $phase17_fragment$
SELECT
        'P17-005',
        'migration_integrity',
        'CRITICAL',
        COUNT(*)::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts unfinished Prisma migrations; no migration identifiers are emitted.'
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL
      AND rolled_back_at IS NULL
$phase17_fragment$),
    (6, 'P17-006', 'migration_integrity', '_prisma_migrations', $phase17_fragment$
SELECT
        'P17-006',
        'migration_integrity',
        'INFO',
        COUNT(*)::bigint,
        'INFORMATIONAL',
        'Counts rolled-back Prisma migration records for owner review.'
    FROM "_prisma_migrations"
    WHERE rolled_back_at IS NOT NULL
$phase17_fragment$),
    (7, 'P17-007', 'schema_integrity', '', $phase17_fragment$
SELECT
        'P17-007',
        'schema_integrity',
        'CRITICAL',
        COUNT(*)::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts application indexes that are invalid or not ready.'
    FROM pg_catalog.pg_index i
    JOIN pg_catalog.pg_class c ON c.oid = i.indexrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND (NOT i.indisvalid OR NOT i.indisready)
$phase17_fragment$),
    (8, 'P17-008', 'schema_integrity', '', $phase17_fragment$
SELECT
        'P17-008',
        'schema_integrity',
        'HIGH',
        COUNT(*)::bigint,
        'REMEDIATION_REQUIRED',
        'Counts unvalidated foreign-key and check constraints.'
    FROM pg_catalog.pg_constraint con
    JOIN pg_catalog.pg_namespace n ON n.oid = con.connamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND con.contype IN ('f', 'c')
      AND NOT con.convalidated
$phase17_fragment$),
    (9, 'P17-009', 'schema_integrity', '', $phase17_fragment$
SELECT
        'P17-009',
        'schema_integrity',
        'HIGH',
        COUNT(*)::bigint,
        'REMEDIATION_REQUIRED',
        'Counts disabled non-system application triggers.'
    FROM pg_catalog.pg_trigger t
    JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND NOT t.tgisinternal
      AND t.tgenabled = 'D'
$phase17_fragment$),
    (10, 'P17-010', 'schema_integrity', '', $phase17_fragment$
SELECT
        'P17-010',
        'schema_integrity',
        'HIGH',
        COUNT(*)::bigint,
        'REMEDIATION_REQUIRED',
        'Counts application tables without a primary key.'
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND c.relname <> '_prisma_migrations'
      AND NOT EXISTS (
          SELECT 1
          FROM pg_catalog.pg_constraint con
          WHERE con.conrelid = c.oid
            AND con.contype = 'p'
      )
$phase17_fragment$),
    (11, 'P17-011', 'referential_integrity', 'Booking,BusinessProfile,Category,GatewayTransaction,Listing,Payment,PaymentActionLog,PaymentReconciliationLog,RentalAgreement,User,UserProfile,VerificationDocument', $phase17_fragment$
SELECT
        'P17-011',
        'referential_integrity',
        'CRITICAL',
        (
            (SELECT COUNT(*) FROM "UserProfile" p
             LEFT JOIN "User" u ON to_jsonb(u)->>'id' = to_jsonb(p)->>'user_id'
             WHERE to_jsonb(u)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "BusinessProfile" p
             LEFT JOIN "User" u ON to_jsonb(u)->>'id' = to_jsonb(p)->>'user_id'
             WHERE to_jsonb(u)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "VerificationDocument" d
             LEFT JOIN "User" u ON to_jsonb(u)->>'id' = to_jsonb(d)->>'user_id'
             WHERE to_jsonb(u)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "Listing" l
             LEFT JOIN "User" u ON to_jsonb(u)->>'id' = to_jsonb(l)->>'provider_id'
             LEFT JOIN "Category" c ON to_jsonb(c)->>'id' = to_jsonb(l)->>'category_id'
             WHERE to_jsonb(u)->>'id' IS NULL OR to_jsonb(c)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "Booking" b
             LEFT JOIN "Listing" l ON to_jsonb(l)->>'id' = to_jsonb(b)->>'listing_id'
             LEFT JOIN "User" r ON to_jsonb(r)->>'id' = to_jsonb(b)->>'renter_id'
             LEFT JOIN "User" p ON to_jsonb(p)->>'id' = to_jsonb(b)->>'provider_id'
             WHERE to_jsonb(l)->>'id' IS NULL
                OR to_jsonb(r)->>'id' IS NULL
                OR to_jsonb(p)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "Payment" p
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(p)->>'booking_id'
             LEFT JOIN "User" u ON to_jsonb(u)->>'id' = to_jsonb(p)->>'user_id'
             WHERE to_jsonb(b)->>'id' IS NULL OR to_jsonb(u)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "GatewayTransaction" g
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(g)->>'booking_id'
             WHERE to_jsonb(b)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "PaymentReconciliationLog" r
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(r)->>'booking_id'
             LEFT JOIN "GatewayTransaction" g ON to_jsonb(g)->>'id' = to_jsonb(r)->>'gateway_transaction_id'
             WHERE to_jsonb(b)->>'id' IS NULL OR to_jsonb(g)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "PaymentActionLog" a
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(a)->>'booking_id'
             LEFT JOIN "GatewayTransaction" g ON to_jsonb(g)->>'id' = to_jsonb(a)->>'gateway_transaction_id'
             WHERE to_jsonb(b)->>'id' IS NULL
                OR (
                    to_jsonb(a)->>'gateway_transaction_id' IS NOT NULL
                    AND to_jsonb(g)->>'id' IS NULL
                ))
          + (SELECT COUNT(*) FROM "RentalAgreement" a
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(a)->>'booking_id'
             WHERE to_jsonb(b)->>'id' IS NULL)
        )::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts orphaned critical application relationships without emitting identifiers.'
$phase17_fragment$),
    (12, 'P17-012', 'duplicate_integrity', 'Category,GatewayTransaction,Payment,PaymentActionLog,RentalAgreement,User', $phase17_fragment$
SELECT
        'P17-012',
        'duplicate_integrity',
        'CRITICAL',
        (
            (SELECT COUNT(*) FROM (
                SELECT lower(trim(to_jsonb(u)->>'email'))
                FROM "User" u
                WHERE NULLIF(trim(to_jsonb(u)->>'email'), '') IS NOT NULL
                GROUP BY lower(trim(to_jsonb(u)->>'email'))
                HAVING COUNT(*) > 1
            ) d)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(c)->>'slug'
                FROM "Category" c
                WHERE NULLIF(to_jsonb(c)->>'slug', '') IS NOT NULL
                GROUP BY to_jsonb(c)->>'slug'
                HAVING COUNT(*) > 1
            ) d)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(p)->>'booking_id'
                FROM "Payment" p
                GROUP BY to_jsonb(p)->>'booking_id'
                HAVING COUNT(*) > 1
            ) d)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(a)->>'booking_id'
                FROM "RentalAgreement" a
                GROUP BY to_jsonb(a)->>'booking_id'
                HAVING COUNT(*) > 1
            ) d)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(g)->>'idempotency_key'
                FROM "GatewayTransaction" g
                WHERE NULLIF(to_jsonb(g)->>'idempotency_key', '') IS NOT NULL
                GROUP BY to_jsonb(g)->>'idempotency_key'
                HAVING COUNT(*) > 1
            ) d)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(g)->>'gateway_reference'
                FROM "GatewayTransaction" g
                WHERE NULLIF(to_jsonb(g)->>'gateway_reference', '') IS NOT NULL
                GROUP BY to_jsonb(g)->>'gateway_reference'
                HAVING COUNT(*) > 1
            ) d)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(a)->>'idempotency_key'
                FROM "PaymentActionLog" a
                WHERE NULLIF(to_jsonb(a)->>'idempotency_key', '') IS NOT NULL
                GROUP BY to_jsonb(a)->>'idempotency_key'
                HAVING COUNT(*) > 1
            ) d)
        )::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts duplicate groups for application-level unique values without emitting values.'
$phase17_fragment$),
    (13, 'P17-013', 'mandatory_relations', 'Booking,BusinessProfile,Listing,ListingPhoto,TurnoverRecord,User', $phase17_fragment$
SELECT
        'P17-013',
        'mandatory_relations',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "User" u
             LEFT JOIN "BusinessProfile" p ON to_jsonb(p)->>'user_id' = to_jsonb(u)->>'id'
             WHERE to_jsonb(u)->>'account_type' = 'Business'
               AND to_jsonb(p)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(l)->>'id'
                FROM "Listing" l
                LEFT JOIN "ListingPhoto" p
                  ON to_jsonb(p)->>'listing_id' = to_jsonb(l)->>'id'
                WHERE to_jsonb(l)->>'status' = 'Published'
                GROUP BY to_jsonb(l)->>'id'
                HAVING COUNT(to_jsonb(p)->>'id') = 0
             ) missing_listing_photos)
          + (SELECT COUNT(*) FROM (
                SELECT to_jsonb(b)->>'id'
                FROM "Booking" b
                LEFT JOIN "TurnoverRecord" t
                  ON to_jsonb(t)->>'booking_id' = to_jsonb(b)->>'id'
                WHERE to_jsonb(b)->>'status' = 'Completed'
                GROUP BY to_jsonb(b)->>'id'
                HAVING COUNT(to_jsonb(t)->>'id') = 0
             ) missing_turnover_records)
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts missing mandatory profile, publication, and completed-booking relation records.'
$phase17_fragment$),
    (14, 'P17-014', 'status_integrity', 'Booking,BusinessProfile,GatewayTransaction,Listing,Payment,PaymentReconciliationLog,PaymentWebhookLog,User,UserProfile,VerificationDocument', $phase17_fragment$
SELECT
        'P17-014',
        'status_integrity',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "User"
             WHERE status NOT IN ('Pending', 'Verified', 'Suspended', 'Blacklisted'))
          + (SELECT COUNT(*) FROM "UserProfile"
             WHERE verification_status NOT IN ('Unverified', 'Pending', 'Verified', 'Rejected'))
          + (SELECT COUNT(*) FROM "BusinessProfile"
             WHERE verification_status NOT IN ('Unverified', 'Pending', 'Verified', 'Rejected'))
          + (SELECT COUNT(*) FROM "VerificationDocument"
             WHERE status NOT IN ('Submitted', 'Under Review', 'Approved', 'Rejected', 'Expired'))
          + (SELECT COUNT(*) FROM "Listing"
             WHERE status NOT IN (
                 'Draft', 'Submitted for Review', 'Under Review', 'Approved',
                 'Published', 'Rejected', 'Suspended', 'Unavailable', 'Archived'
             ))
          + (SELECT COUNT(*) FROM "Booking"
             WHERE status NOT IN (
                 'Pending Provider Approval', 'Approved', 'Pending Payment',
                 'Confirmed', 'Ongoing', 'Returned', 'Completed',
                 'Cancelled by Renter', 'Cancelled by Provider', 'Rejected', 'Expired'
             ))
          + (SELECT COUNT(*) FROM "Payment"
             WHERE status NOT IN ('Pending', 'Completed', 'Failed', 'Refunded'))
          + (SELECT COUNT(*) FROM "GatewayTransaction"
             WHERE provider_mode NOT IN ('Sandbox', 'Live', 'Internal')
                OR gateway_status NOT IN (
                    'Created', 'Checkout Pending', 'Paid Sandbox', 'Failed Sandbox',
                    'Expired', 'Cancelled', 'Refunded Placeholder', 'Error'
                )
                OR verification_status NOT IN (
                    'Not Verified', 'Verified', 'Failed', 'Skipped Sandbox'
                )
                OR reconciliation_status NOT IN (
                    'Pending', 'Matched', 'Mismatch', 'Manual Review Required'
                ))
          + (SELECT COUNT(*) FROM "PaymentReconciliationLog"
             WHERE status NOT IN ('Matched', 'Mismatch'))
          + (SELECT COUNT(*) FROM "PaymentWebhookLog"
             WHERE lower(processing_status) NOT IN (
                 'received', 'processed', 'ignored', 'failed', 'duplicate'
             ))
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts invalid core application status values and status combinations.'
$phase17_fragment$),
    (15, 'P17-015', 'date_integrity', 'Booking,GatewayTransaction,Listing,PaymentActionLog,RentalAgreement', $phase17_fragment$
SELECT
        'P17-015',
        'date_integrity',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "Booking"
             WHERE end_date < start_date
                OR updated_at < created_at
                OR (approved_at IS NOT NULL AND approved_at < created_at)
                OR (rejected_at IS NOT NULL AND rejected_at < created_at)
                OR (cancelled_at IS NOT NULL AND cancelled_at < created_at)
                OR (completed_at IS NOT NULL AND completed_at < created_at))
          + (SELECT COUNT(*) FROM "Listing"
             WHERE availability_end IS NOT NULL
               AND availability_start IS NOT NULL
               AND availability_end < availability_start)
          + (SELECT COUNT(*) FROM "RentalAgreement"
             WHERE (accepted_at IS NOT NULL AND accepted_at < created_at)
                OR (provider_accepted_at IS NOT NULL AND provider_accepted_at < created_at))
          + (SELECT COUNT(*) FROM "GatewayTransaction"
             WHERE updated_at < created_at
                OR (webhook_received_at IS NOT NULL AND webhook_received_at < created_at))
          + (SELECT COUNT(*) FROM "PaymentActionLog"
             WHERE occurred_at > now() + interval '5 minutes')
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts structurally invalid date ordering without emitting timestamps.'
$phase17_fragment$),
    (16, 'P17-016', 'booking_agreement_integrity', 'Booking,RentalAgreement', $phase17_fragment$
SELECT
        'P17-016',
        'booking_agreement_integrity',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "RentalAgreement"
             WHERE (accepted_by_renter AND accepted_at IS NULL)
                OR (NOT accepted_by_renter AND accepted_at IS NOT NULL)
                OR (accepted_by_provider AND provider_accepted_at IS NULL)
                OR (NOT accepted_by_provider AND provider_accepted_at IS NOT NULL))
          + (SELECT COUNT(*) FROM "Booking" b
             LEFT JOIN "RentalAgreement" a ON a.booking_id = b.id
             WHERE b.status IN ('Confirmed', 'Ongoing', 'Returned', 'Completed')
               AND a.id IS NULL)
          + (SELECT COUNT(*) FROM "Booking" b
             JOIN "RentalAgreement" a ON a.booking_id = b.id
             WHERE b.status IN ('Ongoing', 'Returned', 'Completed')
               AND (NOT a.accepted_by_renter OR NOT a.accepted_by_provider))
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts booking and rental-agreement lifecycle inconsistencies.'
$phase17_fragment$),
    (17, 'P17-017', 'booking_payment_integrity', 'Booking,Payment', $phase17_fragment$
SELECT
        'P17-017',
        'booking_payment_integrity',
        'CRITICAL',
        (
            (SELECT COUNT(*) FROM "Booking" b
             LEFT JOIN "Payment" p
               ON p.booking_id = b.id
              AND p.status IN ('Completed', 'Refunded')
             WHERE b.status IN ('Confirmed', 'Ongoing', 'Returned', 'Completed')
               AND p.id IS NULL)
          + (SELECT COUNT(*) FROM "Payment" p
             JOIN "Booking" b ON b.id = p.booking_id
             WHERE p.type = 'Rental Payment'
               AND p.status = 'Completed'
               AND p.amount <= 0)
        )::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts advanced bookings without a completed payment and invalid completed rental payments.'
$phase17_fragment$),
    (18, 'P17-018', 'gateway_reconciliation_integrity', 'GatewayTransaction,Payment,PaymentReconciliationLog', $phase17_fragment$
SELECT
        'P17-018',
        'gateway_reconciliation_integrity',
        'CRITICAL',
        (
            (SELECT COUNT(*) FROM "PaymentReconciliationLog"
             WHERE status = 'Matched'
               AND (
                   expected_amount <> received_amount
                   OR expected_currency <> received_currency
               ))
          + (SELECT COUNT(*) FROM "GatewayTransaction" g
             LEFT JOIN "PaymentReconciliationLog" r
               ON r.gateway_transaction_id = g.id
              AND r.status = 'Matched'
             WHERE g.reconciliation_status = 'Matched'
               AND r.id IS NULL)
          + (SELECT COUNT(*) FROM "Payment" p
             JOIN "GatewayTransaction" g ON g.id = p.gateway_transaction_id
             WHERE p.booking_id <> g.booking_id)
          + (SELECT COUNT(*) FROM "GatewayTransaction"
             WHERE provider_mode = 'Live'
               AND gateway_status IN ('Paid Sandbox', 'Failed Sandbox'))
        )::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts gateway, payment, and reconciliation mismatches.'
$phase17_fragment$),
    (19, 'P17-019', 'escrow_refund_integrity', 'Booking,DepositAction,ProviderPayout,RefundRequest', $phase17_fragment$
SELECT
        'P17-019',
        'escrow_refund_integrity',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "DepositAction" d
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(d)->>'booking_id'
             WHERE to_jsonb(b)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "RefundRequest" r
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(r)->>'booking_id'
             WHERE to_jsonb(b)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "ProviderPayout" p
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(p)->>'booking_id'
             WHERE to_jsonb(b)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "DepositAction" d
             WHERE lower(COALESCE(to_jsonb(d)->>'action_type', '')) ~ '(release|refund)'
               AND COALESCE(NULLIF(to_jsonb(d)->>'amount', '')::numeric, 0) <= 0)
          + (SELECT COUNT(*) FROM "RefundRequest" r
             WHERE COALESCE(NULLIF(to_jsonb(r)->>'amount', '')::numeric, 0) < 0)
          + (SELECT COUNT(*) FROM "ProviderPayout" p
             WHERE COALESCE(NULLIF(to_jsonb(p)->>'amount', '')::numeric, 0) < 0)
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts structurally invalid escrow, refund, and payout linkage or amounts.'
$phase17_fragment$),
    (20, 'P17-020', 'payment_webhook_integrity', 'Booking,GatewayTransaction,Payment,PaymentWebhookLog', $phase17_fragment$
SELECT
        'P17-020',
        'payment_webhook_integrity',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "PaymentWebhookLog" w
             WHERE lower(w.processing_status) = 'processed'
               AND w.booking_id IS NULL
               AND w.payment_transaction_id IS NULL
               AND w.gateway_reference IS NULL)
          + (SELECT COUNT(*) FROM "PaymentWebhookLog" w
             LEFT JOIN "Booking" b ON b.id = w.booking_id
             WHERE w.booking_id IS NOT NULL
               AND b.id IS NULL)
          + (SELECT COUNT(*) FROM "PaymentWebhookLog" w
             LEFT JOIN "Payment" p ON p.transaction_id = w.payment_transaction_id
             WHERE w.payment_transaction_id IS NOT NULL
               AND p.id IS NULL)
          + (SELECT COUNT(*) FROM "PaymentWebhookLog" w
             LEFT JOIN "GatewayTransaction" g ON g.gateway_reference = w.gateway_reference
             WHERE w.gateway_reference IS NOT NULL
               AND g.id IS NULL)
          + (SELECT COUNT(*) FROM "PaymentWebhookLog"
             WHERE lower(processing_status) = 'processed'
               AND lower(verification_status) = 'failed')
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts processed webhook linkage and verification inconsistencies.'
$phase17_fragment$),
    (21, 'P17-021', 'payment_webhook_integrity', 'PaymentWebhookLog', $phase17_fragment$
SELECT
        'P17-021',
        'payment_webhook_integrity',
        'MEDIUM',
        COUNT(*)::bigint,
        'NON_BLOCKING_WARNING',
        'Counts duplicate webhook-key groups requiring idempotency review.'
    FROM (
        SELECT
            provider,
            event_type,
            gateway_reference,
            booking_id,
            payment_transaction_id
        FROM "PaymentWebhookLog"
        GROUP BY
            provider,
            event_type,
            gateway_reference,
            booking_id,
            payment_transaction_id
        HAVING COUNT(*) > 1
    ) duplicate_groups
$phase17_fragment$),
    (22, 'P17-022', 'claim_dispute_integrity', 'Booking,DamageClaim,DisputeCase', $phase17_fragment$
SELECT
        'P17-022',
        'claim_dispute_integrity',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "DamageClaim" c
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(c)->>'booking_id'
             WHERE to_jsonb(b)->>'id' IS NULL
                OR to_jsonb(b)->>'listing_id' <> to_jsonb(c)->>'listing_id'
                OR to_jsonb(b)->>'renter_id' <> to_jsonb(c)->>'renter_id'
                OR to_jsonb(b)->>'provider_id' <> to_jsonb(c)->>'provider_id')
          + (SELECT COUNT(*) FROM "DisputeCase" d
             LEFT JOIN "Booking" b ON to_jsonb(b)->>'id' = to_jsonb(d)->>'booking_id'
             WHERE to_jsonb(b)->>'id' IS NULL)
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts damage-claim and dispute records with invalid booking linkage.'
$phase17_fragment$),
    (23, 'P17-023', 'verification_kyc_integrity', 'User,VerificationDocument', $phase17_fragment$
SELECT
        'P17-023',
        'verification_kyc_integrity',
        'MEDIUM',
        (
            (SELECT COUNT(*) FROM "VerificationDocument"
             WHERE status = 'Approved'
               AND reviewed_at IS NULL)
          + (SELECT COUNT(*) FROM "VerificationDocument"
             WHERE status = 'Rejected'
               AND NULLIF(trim(COALESCE(rejection_reason, '')), '') IS NULL)
          + (SELECT COUNT(*) FROM (
                SELECT u.id
                FROM "User" u
                LEFT JOIN "VerificationDocument" d
                  ON d.user_id = u.id
                 AND d.status = 'Approved'
                WHERE u.status = 'Verified'
                GROUP BY u.id
                HAVING COUNT(d.id) = 0
             ) verified_without_approved_document)
        )::bigint,
        'NON_BLOCKING_WARNING',
        'Counts verification and KYC records requiring evidence review.'
$phase17_fragment$),
    (24, 'P17-024', 'user_role_integrity', 'User', $phase17_fragment$
SELECT
        'P17-024',
        'user_role_integrity',
        'HIGH',
        COUNT(*)::bigint,
        'REMEDIATION_REQUIRED',
        'Counts invalid user account types, roles, and lifecycle statuses.'
    FROM "User"
    WHERE account_type NOT IN ('Individual', 'Business')
       OR role NOT IN (
           'Guest', 'Renter', 'Individual Provider', 'Business Provider',
           'Admin', 'Finance Admin', 'Compliance Admin', 'Super Admin',
           'SOC_ANALYST', 'SOC_SUPERVISOR'
       )
       OR status NOT IN ('Pending', 'Verified', 'Suspended', 'Blacklisted')
$phase17_fragment$),
    (25, 'P17-025', 'rbac_integrity', 'IncidentCase,User', $phase17_fragment$
SELECT
        'P17-025',
        'rbac_integrity',
        'HIGH',
        COUNT(*)::bigint,
        'REMEDIATION_REQUIRED',
        'Counts incident-case assignments to missing or ineligible users.'
    FROM "IncidentCase" c
    LEFT JOIN "User" u
      ON to_jsonb(u)->>'id' = COALESCE(
          to_jsonb(c)->>'assigned_to_user_id',
          to_jsonb(c)->>'assigned_user_id'
      )
    WHERE COALESCE(
              to_jsonb(c)->>'assigned_to_user_id',
              to_jsonb(c)->>'assigned_user_id'
          ) IS NOT NULL
      AND (
          to_jsonb(u)->>'id' IS NULL
          OR to_jsonb(u)->>'role' NOT IN (
              'SOC_ANALYST', 'SOC_SUPERVISOR', 'Admin', 'Super Admin'
          )
      )
$phase17_fragment$),
    (26, 'P17-026', 'security_audit_integrity', 'AuditLog,IncidentCase,PaymentWebhookLog,SecurityEvent,User', $phase17_fragment$
SELECT
        'P17-026',
        'security_audit_integrity',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "AuditLog" a
             LEFT JOIN "User" u ON to_jsonb(u)->>'id' = to_jsonb(a)->>'actor_user_id'
             WHERE to_jsonb(a)->>'actor_user_id' IS NOT NULL
               AND to_jsonb(u)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "SecurityEvent" e
             LEFT JOIN "PaymentWebhookLog" w
               ON to_jsonb(w)->>'id' = to_jsonb(e)->>'source_record_id'
             WHERE to_jsonb(e)->>'source_type' = 'PAYMENT_WEBHOOK_LOG'
               AND to_jsonb(e)->>'source_record_id' IS NOT NULL
               AND to_jsonb(w)->>'id' IS NULL)
          + (SELECT COUNT(*) FROM "IncidentCase" c
             LEFT JOIN "SecurityEvent" e
               ON to_jsonb(e)->>'id' = to_jsonb(c)->>'security_event_id'
             WHERE to_jsonb(c)->>'security_event_id' IS NOT NULL
               AND to_jsonb(e)->>'id' IS NULL)
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts broken security-event, incident-case, and audit-log linkage.'
$phase17_fragment$),
    (27, 'P17-027', 'test_data_inventory', 'Booking,Listing,User', $phase17_fragment$
SELECT
        'P17-027',
        'test_data_inventory',
        'MEDIUM',
        (
            (SELECT COUNT(*) FROM "User" WHERE is_test_data)
          + (SELECT COUNT(*) FROM "Listing" WHERE is_test_data)
          + (SELECT COUNT(*) FROM "Booking" WHERE is_test_data)
        )::bigint,
        'NON_BLOCKING_WARNING',
        'Counts explicitly marked test records; no records or identifiers are emitted.'
$phase17_fragment$),
    (28, 'P17-028', 'monetary_integrity', 'Booking,DamageClaim,FinanceLedger,GatewayTransaction,Listing,Payment,PaymentReconciliationLog', $phase17_fragment$
SELECT
        'P17-028',
        'monetary_integrity',
        'CRITICAL',
        (
            (SELECT COUNT(*) FROM "Listing"
             WHERE COALESCE(hourly_rate, 0) < 0
                OR COALESCE(daily_rate, 0) < 0
                OR COALESCE(weekly_rate, 0) < 0
                OR COALESCE(monthly_rate, 0) < 0
                OR COALESCE(security_deposit, 0) < 0
                OR COALESCE(replacement_value, 0) < 0
                OR COALESCE(delivery_fee, 0) < 0)
          + (SELECT COUNT(*) FROM "Booking"
             WHERE base_rental_amount < 0
                OR deposit_amount < 0
                OR COALESCE(platform_fee, 0) < 0
                OR estimated_total_amount < 0
                OR COALESCE(delivery_fee, 0) < 0)
          + (SELECT COUNT(*) FROM "Payment" WHERE amount <= 0)
          + (SELECT COUNT(*) FROM "GatewayTransaction" WHERE amount <= 0)
          + (SELECT COUNT(*) FROM "PaymentReconciliationLog"
             WHERE expected_amount < 0 OR received_amount < 0)
          + (SELECT COUNT(*) FROM "FinanceLedger" WHERE amount < 0)
          + (SELECT COUNT(*) FROM "DamageClaim" c
             WHERE COALESCE(NULLIF(to_jsonb(c)->>'claimed_amount', '')::numeric, 0) < 0
                OR COALESCE(NULLIF(to_jsonb(c)->>'deposit_amount', '')::numeric, 0) < 0
                OR COALESCE(NULLIF(to_jsonb(c)->>'requested_deduction_amount', '')::numeric, 0) < 0)
        )::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts negative or structurally invalid monetary records.'
$phase17_fragment$),
    (29, 'P17-029', 'operational_data_quality', 'Booking,GatewayTransaction,Listing,PaymentActionLog', $phase17_fragment$
SELECT
        'P17-029',
        'operational_data_quality',
        'HIGH',
        (
            (SELECT COUNT(*) FROM "Listing"
             WHERE quantity <= 0
                OR NULLIF(trim(title), '') IS NULL)
          + (SELECT COUNT(*) FROM "Booking"
             WHERE renter_id = provider_id
                OR rental_duration <= 0
                OR end_date < start_date)
          + (SELECT COUNT(*) FROM "PaymentActionLog"
             WHERE NULLIF(trim(action_code), '') IS NULL
                OR NULLIF(trim(source_workflow), '') IS NULL
                OR NULLIF(trim(source_operation_id), '') IS NULL)
          + (SELECT COUNT(*) FROM "GatewayTransaction"
             WHERE NULLIF(trim(currency), '') IS NULL)
        )::bigint,
        'REMEDIATION_REQUIRED',
        'Counts structurally invalid operational records.'
$phase17_fragment$),
    (30, 'P17-030', 'database_privileges', '', $phase17_fragment$
SELECT
        'P17-030',
        'database_privileges',
        'CRITICAL',
        COUNT(*)::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts application tables on which the audit role has mutation privileges.'
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND (
          has_table_privilege(current_user, c.oid, 'INSERT')
          OR has_table_privilege(current_user, c.oid, 'UPDATE')
          OR has_table_privilege(current_user, c.oid, 'DELETE')
          OR has_table_privilege(current_user, c.oid, 'TRUNCATE')
      )
$phase17_fragment$),
    (31, 'P17-031', 'database_privileges', '', $phase17_fragment$
SELECT
        'P17-031',
        'database_privileges',
        'CRITICAL',
        COUNT(*)::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts application schemas on which the audit role has CREATE privilege.'
    FROM pg_catalog.pg_namespace n
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND has_schema_privilege(current_user, n.oid, 'CREATE')
$phase17_fragment$),
    (32, 'P17-032', 'database_privileges', '', $phase17_fragment$
SELECT
        'P17-032',
        'database_privileges',
        'CRITICAL',
        COUNT(*)::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts dangerous database-role attributes on the active audit role.'
    FROM pg_catalog.pg_roles r
    WHERE r.rolname = current_user
      AND (
          r.rolsuper
          OR r.rolcreaterole
          OR r.rolcreatedb
          OR r.rolreplication
          OR r.rolbypassrls
      )
$phase17_fragment$),
    (33, 'P17-033', 'database_privileges', '_prisma_migrations', $phase17_fragment$
SELECT
        'P17-033',
        'database_privileges',
        'CRITICAL',
        CASE
            WHEN has_table_privilege(current_user, '"_prisma_migrations"', 'SELECT')
            THEN 0::bigint
            ELSE 1::bigint
        END,
        'CRITICAL_GO_LIVE_BLOCKER',
        'The audit role must be able to read Prisma migration metadata.'
$phase17_fragment$),
    (34, 'P17-034', 'database_privileges', '', $phase17_fragment$
SELECT
        'P17-034',
        'database_privileges',
        'CRITICAL',
        COUNT(*)::bigint,
        'CRITICAL_GO_LIVE_BLOCKER',
        'Counts application tables that the audit role cannot inspect.'
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND NOT has_table_privilege(current_user, c.oid, 'SELECT')
$phase17_fragment$),
    (35, 'P17-035', 'database_privileges', '', $phase17_fragment$
SELECT
        'P17-035',
        'database_privileges',
        'HIGH',
        COUNT(*)::bigint,
        'REMEDIATION_REQUIRED',
        'Counts application sequences that the audit role cannot inspect.'
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND NOT has_sequence_privilege(current_user, c.oid, 'SELECT')
$phase17_fragment$),
    (36, 'P17-036', 'schema_inventory', '', $phase17_fragment$
SELECT
        'P17-036',
        'schema_inventory',
        'INFO',
        COUNT(*)::bigint,
        'INFORMATIONAL',
        'Counts readable application tables as a sanitized audit inventory total.'
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'p')
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      AND n.nspname !~ '^pg_toast'
      AND has_table_privilege(current_user, c.oid, 'SELECT')
$phase17_fragment$)
),
fragment_status AS (
    SELECT
        f.*,
        CASE
            WHEN f.required_tables = '' THEN 0::bigint
            ELSE (
                SELECT COUNT(*)::bigint
                FROM unnest(string_to_array(f.required_tables, ',')) AS required(table_name)
                WHERE to_regclass(format('%I', required.table_name)) IS NULL
            )
        END AS missing_table_count
    FROM fragments f
),
rendered AS (
    SELECT
        ordinal,
        CASE
            WHEN missing_table_count = 0 THEN query_sql
            ELSE format(
                'SELECT %L, %L, ''HIGH'', %s::bigint, ''REMEDIATION_REQUIRED'', ''expected table is absent from deployed schema''',
                check_id,
                category,
                missing_table_count
            )
        END AS query_sql
    FROM fragment_status
),
generated AS (
    SELECT
        $phase17_header$
WITH raw_checks (
    check_id,
    category,
    severity,
    finding_count,
    nonzero_result,
    sanitized_note
) AS (
    SELECT
        'P17-TBL-' || expected.table_name,
        'schema_drift',
        'HIGH',
        CASE
            WHEN to_regclass(format('%I', expected.table_name)) IS NULL THEN 1::bigint
            ELSE 0::bigint
        END,
        'REMEDIATION_REQUIRED',
        CASE
            WHEN to_regclass(format('%I', expected.table_name)) IS NULL
            THEN 'expected table is absent from deployed schema'
            ELSE 'expected table is present in deployed schema'
        END
    FROM (VALUES
        ('_prisma_migrations'),
        ('User'),
        ('UserMfa'),
        ('UserProfile'),
        ('BusinessProfile'),
        ('Category'),
        ('VerificationDocument'),
        ('CategoryRequirement'),
        ('Listing'),
        ('ListingPhoto'),
        ('ListingDocument'),
        ('Booking'),
        ('BookingStatusHistory'),
        ('Payment'),
        ('GatewayTransaction'),
        ('PaymentWebhookLog'),
        ('PaymentReconciliationLog'),
        ('PaymentActionLog'),
        ('FinanceLedger'),
        ('RentalAgreement'),
        ('SystemSettings'),
        ('InspectionReport'),
        ('InspectionPhoto'),
        ('TurnoverRecord'),
        ('DamageClaim'),
        ('DamageClaimPhoto'),
        ('DisputeCase'),
        ('DepositAction'),
        ('Review'),
        ('Notification'),
        ('AuditLog'),
        ('ApiSecurityLog'),
        ('AIBotLog'),
        ('SystemSetting'),
        ('AuthenticationSecurityLog'),
        ('SystemErrorLog'),
        ('SocialAccount'),
        ('MarketingCampaign'),
        ('MarketingPost'),
        ('CampaignApproval'),
        ('PromotionAsset'),
        ('UTMLink'),
        ('CampaignAnalytics'),
        ('ProviderPromotionOptIn'),
        ('SocialPostQueue'),
        ('AccountDeletionRequest'),
        ('AppReleaseVersion'),
        ('MobileAnalytics'),
        ('BetaInvitation'),
        ('BetaFeedback'),
        ('IssueTicket'),
        ('SupportTicket'),
        ('UATFlow'),
        ('RefundRequest'),
        ('ProviderPayout'),
        ('PayoutBatch'),
        ('SecurityEvent'),
        ('SecurityEventIngestionFailure'),
        ('SecurityEventIngestionCheckpoint'),
        ('DetectionRule'),
        ('SecurityAlert'),
        ('SecurityAlertEvidence'),
        ('RuleEvaluationLog'),
        ('DetectionEvaluationCheckpoint'),
        ('IncidentCase'),
        ('IncidentCaseHistory'),
        ('IncidentCaseNote'),
        ('IncidentCaseEvidence'),
        ('SecurityResponsePlaybook'),
        ('SecurityResponseStep'),
        ('IncidentCasePlaybookLink'),
        ('SecurityResponseApprovalRequest'),
        ('SecurityResponseApprovalDecision'),
        ('SecurityResponseApprovalGrant'),
        ('SecurityResponseExecution'),
        ('SecurityResponseAction'),
        ('BehavioralRiskAssessment'),
        ('BehavioralRiskSignal'),
        ('BehavioralRiskEvidenceLink'),
        ('SecurityEventGeoEnrichment')
    ) AS expected(table_name)
    UNION ALL$phase17_header$
        || string_agg(query_sql, E'\n    UNION ALL\n' ORDER BY ordinal)
        || $phase17_suffix$
),
checks AS (
    SELECT
        check_id::text,
        category::text,
        severity::text,
        finding_count::bigint,
        CASE
            WHEN finding_count = 0 THEN 'PASS'
            ELSE nonzero_result
        END::text AS result,
        sanitized_note::text
    FROM raw_checks
),
summary AS (
    SELECT
        COUNT(*)::bigint AS total_checks,
        COUNT(*) FILTER (WHERE result = 'PASS')::bigint AS passed_checks,
        COUNT(*) FILTER (WHERE result = 'INFORMATIONAL')::bigint AS informational_checks,
        COUNT(*) FILTER (WHERE result = 'NON_BLOCKING_WARNING')::bigint AS warning_checks,
        COUNT(*) FILTER (WHERE result = 'REMEDIATION_REQUIRED')::bigint AS remediation_required_checks,
        COUNT(*) FILTER (WHERE result = 'CRITICAL_GO_LIVE_BLOCKER')::bigint AS critical_blocker_checks
    FROM checks
),
report AS (
    SELECT
        0 AS sort_order,
        'PHASE17_CHECKS'::text AS section,
        c.check_id,
        c.category,
        c.severity,
        c.finding_count,
        c.result,
        c.sanitized_note,
        NULL::bigint AS total_checks,
        NULL::bigint AS passed_checks,
        NULL::bigint AS informational_checks,
        NULL::bigint AS warning_checks,
        NULL::bigint AS remediation_required_checks,
        NULL::bigint AS critical_blocker_checks,
        NULL::text AS execution_result
    FROM checks c
    UNION ALL
    SELECT
        1 AS sort_order,
        'PHASE17_AUDIT_SUMMARY'::text AS section,
        NULL::text AS check_id,
        NULL::text AS category,
        NULL::text AS severity,
        NULL::bigint AS finding_count,
        NULL::text AS result,
        'Sanitized aggregate result; inspect individual count-only checks above.'::text AS sanitized_note,
        s.total_checks,
        s.passed_checks,
        s.informational_checks,
        s.warning_checks,
        s.remediation_required_checks,
        s.critical_blocker_checks,
        CASE
            WHEN s.critical_blocker_checks = 0
             AND s.remediation_required_checks = 0
            THEN 'PHASE17_READY_FOR_OWNER_ACCEPTANCE'
            ELSE 'PHASE17_REMEDIATION_REQUIRED'
        END::text AS execution_result
    FROM summary s
)
SELECT
    section,
    check_id,
    category,
    severity,
    finding_count,
    result,
    sanitized_note,
    total_checks,
    passed_checks,
    informational_checks,
    warning_checks,
    remediation_required_checks,
    critical_blocker_checks,
    execution_result
FROM report
ORDER BY sort_order, check_id NULLS LAST
$phase17_suffix$ AS query_sql
    FROM rendered
)
SELECT query_sql
FROM generated
\gexec

ROLLBACK;