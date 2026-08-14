# DECISION LEDGER

| Decision ID | Phase | Component | Original Design | Approved Deviation | Reason |
| ----------- | ----- | --------- | --------------- | ------------------ | ------ |
| UAICS-DH-DEC-001 | P2 | Digital Human Provider | N/A | Missing credentials locked | The provider path is confirmed as NEW. It will use `DigitalHumanProviderAdapter` but real integration is safely deferred/blocked until external keys are provisioned, preventing hallucinated credential usage. |

| UAICS-DH-DEC-002 | P0 v1.1 | Source baseline | Historical source 067ad72db92d73de58b6cf4463473c44650a173c | Accept clean descendant aa180160d25cb12764099d487382d3f98e534a97 as current implementation source | Git ancestry is verified and intervening work is committed, attributable RENTipid/Unified AI work. |
| UAICS-DH-DEC-003 | P0 v1.1 | Legacy tickets | IssueTicket and SupportTicket exist in the schema | Explicitly exclude both from Unified AI v1.1 | No runtime consumers were found; AiSupportCase remains the only approved AI case platform and no human queue is permitted. |
| UAICS-DH-DEC-004 | P0 v1.1 | AI interaction feedback | No dedicated model | Defer a possible additive AiInteractionFeedback model to its approved later phase | Existing beta/social feedback has different authority and semantics; P1 needs no migration. |

## Controlled reconciliation

UAICS-DH-CR-001 reconciles the historical baseline to current source HEAD aa180160d25cb12764099d487382d3f98e534a97. It authorizes documentation evidence only and does not authorize feature, database, knowledge, Preview, or Production mutation.
