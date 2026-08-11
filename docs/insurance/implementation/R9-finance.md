# R9 — FINANCE REGISTRY

Independent Insurance ledger requirements:

| Financial Event | Ledger Requirement | Mapping |
|---|---|---|
| Premium Quote | Informational only, no ledger entry | N/A |
| Insurance Order | Renter charged premium + taxes | Independent `InsurancePremium` line item on invoice |
| Policy Issuance | Escrow/Hold premium until settlement | `HeldPremium` account |
| Cancellation/Refund | Premium returned to renter | Linked to `RefundLedger` |
| Partner Settlement | Payout to external insurance provider | `ProviderPayable` (Partner) |
| Marketplace Revenue Share | RENTipid commission from partner | `MarketplaceRevenue` |

**Rule**: Insurance records MUST remain traceable independently from rental amount, provider payout, security deposit, escrow, and marketplace fee.
