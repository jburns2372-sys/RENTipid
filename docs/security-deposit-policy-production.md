# Security Deposit Production Policy

**Phase 16 - Limited Live Pilot Restrictions**

> [!CAUTION]
> **No Automated Escrow Release**
> During the Limited Live Pilot, automated API releases of security deposits are DISABLED.

## Deposit Workflow
1. **Hold Generation:** The system records a "Hold" in the RENTipid Ledger when a booking is confirmed.
2. **Transaction Lifecycle:** The booking completes its return inspection.
3. **Damage Claims:** If a damage claim is filed, the deposit ledger is marked "Hold for Dispute" and cannot be manually released until the claim resolves.
4. **Manual Release:** Upon a clean return without disputes, Finance operations must manually log into the payment gateway and trigger a partial/full release of the initial authorized amount.
5. **System Updates:** Finance must update the RENTipid ledger to match the manual gateway action.

## Legal Pre-Condition
RENTipid does not claim "Licensed Escrow" capabilities unless authorized by specific regional regulators. Public-facing terms must emphasize "Security Deposit Hold" rather than "Escrow Account."
