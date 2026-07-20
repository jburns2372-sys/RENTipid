# Local Test Database Safety

## Approved Local Database Host
- `localhost`
- `127.0.0.1`
- `::1`

## Approved Database Name
- `rentipid_test_soc`

## Required Environment Flags
- `NODE_ENV=test`
- `ALLOW_TEST_DATABASE_MUTATION=true`

## Prohibited Targets
- Remote or cloud-hosted hostnames
- The Azure production hostname
- Any database name not explicitly designated as `rentipid_test_soc` (e.g. `rentipid_db` or missing `test` suffix)

## Fail-Closed Behavior
The safety guard (`assertSafeLocalTestDatabaseTarget()`) will abort execution immediately if any forbidden or ambiguous target configurations are detected.

## Safe Local Setup
1. Define local test credentials in `.env.test.local` (ensure this file remains Git-ignored).
2. Use `npm run test:db:setup` to execute local migrations.

## Safe Test Reset
1. Use `npm run test:db:reset` to execute a local reset safely.

## Guarded Commands
The following scripts in `package.json` are explicitly guarded:
- `test:db:setup`
- `test:db:migrate`
- `test:db:reset`
- `test:soc:integration`

## Gate 4D-A-R1 Prerequisite
This local database safety foundation MUST be fully implemented and verified before executing the Gate 4D-A-R1 SOC test suite to strictly eliminate the risk of executing SOC actions against a production database.

## Incident Rationale
This safety guard resolves a critical misconfiguration risk where SOC test automation processes could improperly run destructive test cleanup and seed functions against the production database instead of an isolated local test instance.
