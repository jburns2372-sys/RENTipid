# PHASE 17 Access Revocation Checklist

## Revocation Actions

Once the PHASE 17 Integrity Check has concluded, the DBA and Security Administrator must execute the following revocation steps immediately:

- [ ] Clear the `PHASE17_READONLY_DATABASE_URL` from the executing terminal session.
- [ ] Invalidate the dedicated credential using Azure PostgreSQL administrative tooling.
- [ ] Remove or disable the PHASE 17 secret in the approved secret-delivery path, including `kv-rentipid-prod` if it was used.
- [ ] Drop the read-only role or revoke all access privileges from it.
- [ ] Confirm no concurrent sessions remain active for the revoked role.
- [ ] Audit logs reflect the creation and deletion of the read-only role.
- [ ] Verify that no secrets were inadvertently logged during execution.
- [ ] Record sanitized revocation evidence without a username, host, token, or connection string.

## Sign-off
**DBA Signature:** ____________________
**Security Administrator Signature:** ____________________
**Date of Revocation:** ____________________
