# Refund Readiness Checklist

**Phase 16 - Limited Live Pilot Restrictions**

> [!CAUTION]
> **Real Refunds are DISABLED**
> Live API refunds via PayMongo are disabled during the Limited Live Pilot. Refunds exist strictly as manual placeholders pending Phase 17/18 gateway integration.

## Workflow 
1. **Refund Requested:** Initiated by Renter via booking cancellation or dispute resolution.
2. **Under Review:** Finance Admin reviews request evidence.
3. **Approved Placeholder:** System marks the refund as approved but does not trigger the payment gateway.
4. **Processed Manual Placeholder:** Finance physically logs into the bank/gateway manually, transfers the funds, and updates the RENTipid ledger to match.
5. **Gateway Refund Future:** Native automated API refunds (Future Phase).

## Action Required
Finance operations must maintain standard operating procedures for manually bridging the "Approved Placeholder" into real manual bank transfers.
