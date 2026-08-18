\set ON_ERROR_STOP on
\pset pager off
BEGIN READ ONLY;

SELECT
    id AS record_id,
    account_type,
    role,
    status AS lifecycle_status,
    account_type IN ('Individual', 'Business') AS account_type_valid,
    role IN (
        'Guest',
        'Renter',
        'Individual Provider',
        'Business Provider',
        'Admin',
        'Finance Admin',
        'Compliance Admin',
        'Super Admin',
        'SOC_ANALYST',
        'SOC_SUPERVISOR'
    ) AS role_valid,
    status IN ('Pending', 'Verified', 'Suspended', 'Blacklisted') AS lifecycle_status_valid,
    concat_ws(
        ',',
        CASE
            WHEN account_type NOT IN ('Individual', 'Business')
            THEN 'INVALID_ACCOUNT_TYPE'
        END,
        CASE
            WHEN role NOT IN (
                'Guest',
                'Renter',
                'Individual Provider',
                'Business Provider',
                'Admin',
                'Finance Admin',
                'Compliance Admin',
                'Super Admin',
                'SOC_ANALYST',
                'SOC_SUPERVISOR'
            )
            THEN 'INVALID_ROLE'
        END,
        CASE
            WHEN status NOT IN ('Pending', 'Verified', 'Suspended', 'Blacklisted')
            THEN 'INVALID_LIFECYCLE_STATUS'
        END
    ) AS violation_reason
FROM "User"
WHERE account_type NOT IN ('Individual', 'Business')
   OR role NOT IN (
       'Guest',
       'Renter',
       'Individual Provider',
       'Business Provider',
       'Admin',
       'Finance Admin',
       'Compliance Admin',
       'Super Admin',
       'SOC_ANALYST',
       'SOC_SUPERVISOR'
   )
   OR status NOT IN ('Pending', 'Verified', 'Suspended', 'Blacklisted')
ORDER BY id;

ROLLBACK;
