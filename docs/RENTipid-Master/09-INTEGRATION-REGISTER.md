# RENTipid Integration Register

Secret values are never recorded here. Environment names identify contracts only.

| Integration | Owning modules | Environment names / configuration | Engineering state | Activation state | Current blocker |
| --- | --- | --- | --- | --- | --- |
| PostgreSQL / Prisma | All persisted modules | `DATABASE_URL`, `DIRECT_URL` | IN IMPLEMENTATION application-wide; Address accepted | Local available historically; Preview/Production are separate | Whole-app fresh DB acceptance and environment-specific migration gates |
| Google Places | Address | `ADDRESS_PROVIDER`, `GOOGLE_MAPS_API_KEY` | CLOSED / FROZEN | Accepted in protected Preview | None for frozen Address scope |
| PSGC Cloud/data | Address | sync script configuration | CLOSED / FROZEN | Required data accepted | None for frozen Address scope |
| Vercel | Next frontend and Route Handlers | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_VERCEL_URL`, deployment project settings | Address PRODUCTION-READY; app-wide IN IMPLEMENTATION | Preview exists; no Production deployment authorized by this program | Global LOCAL-RC1 and Preview gates |
| Azure API backend | KYC, uploads, listings, bookings, AI | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_AZURE_BACKEND`, `PORT` | Code exists | BLOCKED-EXTERNAL | No accepted deployed Container App/runtime; Vercel replacements return 410 |
| Azure Blob Storage | Media/documents | `STORAGE_PROVIDER`, `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY` | Adapter/path exists | BLOCKED-EXTERNAL until runtime acceptance | Credential/runtime and end-to-end upload proof |
| Local storage | Local media/documents | `STORAGE_PROVIDER=local` | Implemented for local use | LOCAL FUNCTIONAL evidence incomplete | Security/cleanup/serving acceptance |
| S3 | Optional storage | Provider-specific names not canonically templated | Adapter throws not implemented | BLOCKED-EXTERNAL and engineering incomplete | Implementation and credentials |
| Cloudflare R2 | Optional storage | Provider-specific names not canonically templated | Adapter throws not implemented | BLOCKED-EXTERNAL and engineering incomplete | Implementation and credentials |
| Supabase Storage | Optional storage | Provider-specific names not canonically templated | Adapter throws not implemented | BLOCKED-EXTERNAL and engineering incomplete | Implementation and credentials |
| PayMongo | Checkout/webhooks/refunds | `PAYMENT_PROVIDER_MODE`, `PAYMENT_MODE`, `PAYMENT_LIVE_MODE`, `ENABLE_LIVE_PAYMENTS`, `PAYMONGO_SANDBOX`, `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, live-key variants | Checkout/webhook adapter exists; refund is placeholder | BLOCKED-EXTERNAL for live mode | Business/method activation, explicit live authorization, refund/payout implementation |
| Bank/payout rail | Provider payouts | Not defined as an automated provider contract | Manual placeholder only | BLOCKED-EXTERNAL | Provider selection, credentials/contracts and engineering implementation |
| Azure OpenAI | AI Help Center | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_CHAT_DEPLOYMENT`, `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Command layer deliberately uses mock; tools are mock | BLOCKED-EXTERNAL and engineering incomplete | Provider config plus safe real tool dispatch |
| Azure AI Search | Search/AI retrieval | `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_API_KEY`, `AZURE_SEARCH_INDEX` | Service references exist | BLOCKED-EXTERNAL | Index/runtime acceptance and fallback contract |
| Social platforms | Marketing | No canonical provider credential contract | Mock adapter only | BLOCKED-EXTERNAL | OAuth app reviews, provider implementations and credentials |
| Email/SMTP | Password recovery, notifications, support | `EMAIL_PROVIDER`, `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Nodemailer 7.0.7 pinned; reset delivery/handlers not yet authorized | BLOCKED-EXTERNAL until configured | Explicit authorization for sensitive reset delivery, then SMTP runtime acceptance |
| Insurance partner adapter | Insurance | `INSURANCE_ENABLED`, `NEXT_PUBLIC_FEATURE_INSURANCE`, `INSURANCE_ADAPTER`, `INSURANCE_MOCK_ENABLED`, `INSURANCE_LIVE_ISSUANCE_ENABLED`, `INSURANCE_KILL_SWITCH` | Provider-neutral registry and deterministic Mock adapter CODE COMPLETE | Real issuance NOT ACTIVATED | Booking/Auth integration and real partner approval/credentials |
| Application Insights | Logging/telemetry | `APPLICATIONINSIGHTS_CONNECTION_STRING` | Adapter/middleware references exist | BLOCKED-EXTERNAL until accepted | Runtime connection and privacy-safe telemetry proof |
| GeoIP/MaxMind | SOC threat map | `SOC_GEOIP_DATABASE_PATH`, `SOC_GEOLOCATION_PROVIDER`, `SOC_GEOLOCATION_HMAC_SECRET` | Optional enrichment exists | BLOCKED-EXTERNAL where database/provider absent | Licensed data/runtime configuration |
| Key management | Profile/MFA/security | `PRIVACY_FIELD_ENCRYPTION_KEY_B64`, `MFA_ENCRYPTION_KEY_ID`, `MFA_ENCRYPTION_KEY`, `BLIND_INDEX_KEY`, `BLIND_INDEX_KEY_ID`, retired-key and HMAC names | Historical crypto acceptance exists | Environment-specific | Rotation/recovery contracts per environment |
| Capacitor/native stores | Mobile | `CAPACITOR_SERVER_URL` | Shell config only | BLOCKED-EXTERNAL after engineering | Native projects, signing and store accounts |

## Integration rule

`BLOCKED-EXTERNAL` is not a completion status. Mock/sandbox behavior may satisfy a deliberately scoped local gate, but live provider activation must be recorded separately and must never be fabricated.
