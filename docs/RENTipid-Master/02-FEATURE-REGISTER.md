# RENTipid Feature Register

Baseline: `6f55296cdf1ff2bda3c550448fc307f264f1f397` on 2026-08-11. Status reflects working behavior and evidence, not file presence.

| Journey / feature | UI | Server/API | Database | Automated evidence | Current status | Gap |
| --- | --- | --- | --- | --- | --- | --- |
| Register individual | Yes | Yes | Yes | Security coverage; no focused E2E | IN IMPLEMENTATION | End-to-end acceptance and consent-version receipt |
| Register business | Yes | Yes | Yes | Limited | IN IMPLEMENTATION | KYB/onboarding completion acceptance |
| Login/logout/session | Yes | Yes | Yes | Security tests | IN IMPLEMENTATION | Known secret fallback and password recovery |
| MFA/step-up | Yes | Yes | Yes | Accepted security evidence | LOCAL ACCEPTANCE PASS | Preview gates |
| Password recovery | Link not yet wired | Handlers not yet authorized | Additive token/rate-limit schema valid; migration unapplied | No | IN IMPLEMENTATION | Explicit approval required for SMTP token delivery and credential mutation |
| Profile/account settings | Yes | Yes | Yes | Address/profile evidence | IN IMPLEMENTATION | Whole account-status/settings acceptance |
| Global/PH Address | Yes | Yes | Yes | 112 Jest and 12 Playwright retained closure evidence | CLOSED / FROZEN | None |
| Provider onboarding | Yes | Yes | Yes | Limited | IN IMPLEMENTATION | Complete verified-provider journey |
| KYC/KYB upload/review | Yes | Azure path intended | Yes | Upload/security tests | IN IMPLEMENTATION | Deployed backend/runtime acceptance |
| Category catalogue | Yes | Yes | Yes | Seed acceptance | LOCAL REQUIRED DATA SEEDED/SYNCED | Marketplace acceptance |
| Create listing | Yes | Yes | Yes | Marketplace/security coverage | IN IMPLEMENTATION | Focused workflow and parity acceptance |
| Edit listing | UI indicates disabled demo state | Incomplete parity | Yes | Limited | IN IMPLEMENTATION | Required editing behavior |
| Upload listing media | Yes | Azure/local paths | Yes | Upload security coverage | IN IMPLEMENTATION | Required provider selection/runtime acceptance |
| Listing validation/compliance | Yes | Yes | Yes | Conflicting evidence | IN IMPLEMENTATION | Reconcile prohibited-item defects and placeholder action |
| Publish listing | Yes | Yes | Yes | Limited | IN IMPLEMENTATION | Approval/public visibility full journey |
| Search/filter/discovery | Yes | Local/Azure paths | Yes | Minimal | IN IMPLEMENTATION | Search correctness/fallback acceptance |
| Availability | Yes | Yes | Booking/listing state | Limited | IN IMPLEMENTATION | Concurrency proof |
| Create booking | Yes | Yes | Yes | Booking/security tests | IN IMPLEMENTATION | Complete renter/provider journey |
| Price calculation | Yes | Yes | Stored totals | Limited | IN IMPLEMENTATION | Single authoritative fee/pricing contract |
| Agreement acceptance | Yes | Yes | Yes | Booking tests | IN IMPLEMENTATION | Legal version recording |
| Handover/check-out | Yes | Yes | Yes | Booking coverage | IN IMPLEMENTATION | End-to-end state and evidence acceptance |
| Active rental | Yes | Status transitions | Yes | Limited | IN IMPLEMENTATION | Full lifecycle acceptance |
| Return/check-in | Yes | Yes | Yes | Booking coverage | IN IMPLEMENTATION | Full lifecycle acceptance |
| Cancellation/expiration | Yes | Worker/server | Yes | Worker coverage missing | IN IMPLEMENTATION | Scheduler and state-machine proof |
| Mock/sandbox payment | Yes | Yes | Yes | Payment/security tests | IN IMPLEMENTATION | Global financial invariant acceptance |
| PayMongo live payment | Guarded UI | Adapter exists | Yes | Historical NO-GO | BLOCKED-EXTERNAL | Provider activation and separate authorization |
| Webhook/idempotency | Monitor | Yes | Yes | Focused security tests | IN IMPLEMENTATION | Complete callback matrix acceptance |
| Refund | Yes | Manual/placeholder | Yes | Limited | IN IMPLEMENTATION | Real gateway refund behavior |
| Provider payout | Yes | Manual placeholder | Yes | Limited | IN IMPLEMENTATION | Real payout rail and failure/retry behavior |
| Reconciliation/ledger | Yes | Yes | Yes | Security/payment tests | IN IMPLEMENTATION | End-to-end equality proof |
| Insurance | No user workflow yet | Technical foundation only | Six core models; migration unapplied | 17 focused foundation tests PASS | IN IMPLEMENTATION | Slice 1 CODE COMPLETE; all integration and later promotion gates remain |
| Damage claim | Yes | Yes | Yes | Booking/security coverage | IN IMPLEMENTATION | Determination-to-financial-adjustment acceptance |
| Dispute | Admin UI | Admin resolution | Yes | No dedicated E2E | IN IMPLEMENTATION | Party workflow and evidence lifecycle |
| Review/reputation | Reads only | No dedicated mutation | Model | No | IN IMPLEMENTATION | Submission, eligibility, moderation and aggregation |
| Direct messaging | No | No | No | No | NOT STARTED | Conversation/message workflow |
| Notification inbox | No | Booking writes only | Model | No focused tests | IN IMPLEMENTATION | Delivery/read-state/preferences |
| Support request | Form shell | No user mutation | Model | No | IN IMPLEMENTATION | Submission and lifecycle |
| AI Help Center | Yes | Mock/Azure-intended | Logs/settings | Security coverage | IN IMPLEMENTATION | Real contextual tools/provider integration |
| Admin dashboards | Yes | Mixed APIs/actions | Yes | Security coverage | IN IMPLEMENTATION | Complete role acceptance |
| SOC operations | Yes | Yes | Extensive models | Extensive accepted local evidence | LOCAL ACCEPTANCE PASS | Preview gates under new standard |
| Privacy/DSR | Yes | Yes | Yes | 47 privacy, 9 security, 15 browser in closure | LOCAL ACCEPTANCE PASS | Preview gates under new standard |
| Analytics/KPIs | Yes | Mixed real/mock | Yes | Limited | IN IMPLEMENTATION | Authoritative calculations and acceptance |
| PWA installability | Manifest only | No service worker | Not required | No focused acceptance | IN IMPLEMENTATION | Offline/service-worker/icon proof |
| Capacitor shell | Config only | Hosted web app | Not required | No native tests | IN IMPLEMENTATION | Native projects and secure release config |
| Terms/privacy/cancellation | Pages exist | Limited receipts | Privacy receipt only | Privacy coverage | IN IMPLEMENTATION | Versioned acceptance for all required policies |

External activation is never used as a substitute for engineering completion. Where both exist, engineering gaps remain `IN IMPLEMENTATION` and the external dependency is separately recorded in `09-INTEGRATION-REGISTER.md`.
