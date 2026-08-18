# R7 — RBAC REGISTRY

| Role | Insurance Permissions |
|---|---|
| Guest | None |
| Renter | Read own offers, create selection, view own policy, submit claim on own booking |
| Individual Provider | View policies attached to own listings, respond to claims |
| Business Provider | View policies attached to own listings, respond to claims |
| Admin | View all policies, view claims, override mock statuses |
| Finance Admin | View insurance ledger entries, reconcile partner payouts |
| Compliance Admin | View claims, view evidence, review compliance |
| Super Admin | Full access, manage kill switch, manage partner config |
| Insurance Partner Service Account | Write webhooks, sync claim status |

*Note: Add new permission names only when genuinely required. Reuse existing RENTipid RBAC vocabulary wherever possible.*
