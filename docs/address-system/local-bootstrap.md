# Local Address Module bootstrap

Run the complete application bootstrap:

```powershell
npm run app:local:bootstrap
npm run dev
```

`npm run address:local:bootstrap` remains an alias. The bootstrap is idempotent. It validates the Address source contract, pins all writes to the dedicated loopback database `rentipid_address_local`, creates missing local secrets once in the ignored `.env.local`, validates and generates Prisma, uses `prisma migrate deploy`, loads the PSGC registry, creates a synthetic local test user, runs the Address suite in a uniquely named disposable database, and performs both direct and real-browser Google, PSGC, token, encrypted-persistence, save, and reload acceptance checks. A successful unchanged second run skips completed work.

The local browser gate can also be run independently while port 3000 is free:

```powershell
npm run app:acceptance:local
```

It starts the real application on `http://localhost:3000`, authenticates through the normal NextAuth credentials contract, exercises the real Profile and Address APIs, and stops its application server when Playwright finishes.

## Verification and release gates

```powershell
npm run app:verify:local
npm run app:verify:preview
npm run app:verify:production-readiness
npm run app:release:gate
```

The remote stages are read-only and fail closed as `PENDING` unless their explicitly named connection/authorization inputs are supplied. A pending Preview or Production-readiness stage is never represented as a pass.

## One-time external credentials

`GOOGLE_MAPS_API_KEY` is reused from `.env.local`, the current process, or an already-authenticated linked Vercel Preview project. The key is server-only, is never printed, and must never use a `NEXT_PUBLIC_` name.

If the normal local PostgreSQL role cannot create databases, the bootstrap may use the locally authorized `pgpass.conf` entry in memory for the minimum loopback database administration required. It never prints, copies, or modifies that file. An explicit loopback maintenance connection may alternatively be supplied as `ADDRESS_LOCAL_ADMIN_DATABASE_URL`. It must target the `postgres` maintenance database. Administrative credentials are never copied into generated state or output.

Example shapes (replace placeholders locally; never commit values):

```dotenv
GOOGLE_MAPS_API_KEY=<server-only-google-key>
ADDRESS_LOCAL_ADMIN_DATABASE_URL=postgresql://<local-admin>:<password>@127.0.0.1:5432/postgres
```

Both values may instead be supplied to the current process. `.env.local` and `.address-local-state.json` are ignored by Git.

## Safety contract

- Only `localhost`, `127.0.0.1`, or `::1` PostgreSQL hosts are accepted.
- Preview, production, system, and unexpected database names are rejected.
- The application always uses `rentipid_address_local`.
- Focused Jest tests use `rentipid_test_soc_address_local_<random>`, initialize it with `prisma migrate deploy`, and drop only that exact database in `finally`.
- Live browser acceptance writes only synthetic records in `rentipid_address_local`.
- No `prisma db push`, `prisma migrate reset`, or `prisma migrate dev` command is used.
- Google credentials and generated encryption/authentication secrets are not logged or committed.

The synthetic login email and generated password are stored only in `.env.local` as `ADDRESS_LOCAL_TEST_EMAIL` and `ADDRESS_LOCAL_TEST_PASSWORD`.
