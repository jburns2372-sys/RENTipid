# PHASE 17 Access Revocation Checklist

## Revocation Actions

Once the PHASE 17 Integrity Check has concluded, the DBA and Security Administrator must execute the following revocation steps immediately:

- [ ] Clear the `PHASE17_READONLY_DATABASE_URL` from the executing terminal session.
- [ ] Invalidate the specific database credential via Neon/database console.
- [ ] Drop the read-only role or revoke all access privileges from it.
- [ ] Confirm no concurrent sessions remain active for the revoked role.
- [ ] Audit logs reflect the creation and deletion of the read-only role.
- [ ] Verify that no secrets were inadvertently logged during execution.

## Sign-off
**DBA Signature:** ____________________
**Security Administrator Signature:** ____________________
**Date of Revocation:** ____________________
