# Provider Adapters

## Contract
`SocialAdapter` interface defines mandatory capabilities:
- `validateConnection(accountId)`
- `checkHealth()`
- `validatePostRequirements(post)`
- `publishPost(post, id, idempotencyKey)`
- `handoffScheduledPost(post, date, id)`
- `getPublicationStatus(providerId, accountId)`
- `fetchMetrics()`
- `fetchFeedback()`
- `normalizeProviderEvent()`
- `refreshCredentials()`

## Provider Implementations
- **MockSocialAdapter**: The mandatory acceptance provider. Simulates all capabilities, health degradation, rate limits, and idempotency.
- **MetaSocialAdapter**: Scaffolding complete. Real credentials NOT CONFIGURED.
- **TikTokSocialAdapter**: Scaffolding complete. Real credentials NOT CONFIGURED.
- **GoogleSocialAdapter**: Scaffolding complete. Real credentials NOT CONFIGURED.
- **WhatsAppSocialAdapter**: Scaffolding complete. Real credentials NOT CONFIGURED.
- **ViberSocialAdapter**: Scaffolding complete. Real credentials NOT CONFIGURED.
