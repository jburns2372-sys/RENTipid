# Provider Payout Readiness Checklist

**Phase 16 - Limited Live Pilot Restrictions**

> [!CAUTION]
> **Real Payouts are DISABLED**
> Live API disbursements via PayMongo are disabled during the Limited Live Pilot. Payouts exist strictly as manual ledger placeholders pending Phase 17/18 gateway integration.

## Payout Architecture
1. **Verification Requirement:** Providers must have a fully verified bank account attached to their `UserProfile` before any payout ledger is generated.
2. **Platform Commission Deduction:** Platform fees are calculated and deducted automatically before logging the ledger entry.
3. **Settlement Delay:** Payout ledgers are placed on a standard X-day hold to handle disputes.
4. **Dispute Holds:** Any active dispute instantly freezes the payout ledger.
5. **Manual Transfer:** Finance physically transfers the funds to the provider's bank using an external portal, then marks the ledger as "Settled."
