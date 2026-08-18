# PHASE 5F-D-C STAGING REHEARSAL OPERATOR CHECKLIST

## Before access
- [ ] Approval complete
- [ ] Accepted Git commit confirmed
- [ ] Temporary branch confirmed
- [ ] Restricted role confirmed
- [ ] TLS confirmed
- [ ] Synthetic-only confirmation
- [ ] No production copy
- [ ] Staging key attestation

## Preview
- [ ] Approval validation passed
- [ ] Environment validation passed
- [ ] Database hash matched
- [ ] Git commit matched
- [ ] Preview generated token
- [ ] Zero writes confirmed

## Execution
- [ ] Lock acquired
- [ ] Key pinned
- [ ] Dry-run reconciled
- [ ] Real-record count zero
- [ ] Quarantine count zero
- [ ] Batch limits enforced
- [ ] Writes verified

## Post-run
- [ ] Post-run dry-run passed
- [ ] Second run wrote zero fields
- [ ] Plaintext unchanged
- [ ] Only approved companions changed
- [ ] Lock released
- [ ] Evidence saved
- [ ] Synthetic cleanup complete
- [ ] Temporary branch disposition complete
