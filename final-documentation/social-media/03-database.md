# Database Design (Phase 3 Foundation)

## Existing Models Reused & Extended
- **`SocialAccount`**: Extended with relations to `SocialMetric` and `SocialProviderEvent`.
- **`MarketingCampaign`**: Extended with relations to `SocialMetric` and `SocialAttribution`.
- **`MarketingPost`**: Extended with relations to `SocialMetric` and `SocialAttribution`.
- **`User`, `Listing`, `Booking`, `Payment`**: Extended with relations to `SocialAttribution`.

## New Models Added
- **`SocialMetric`**: Normalized structure to track actual, derived, and estimated metrics (impressions, clicks).
- **`SocialAttribution`**: Links social events to RENTipid entities (`User`, `Booking`, `Payment`) with confidence scoring.
- **`SocialProviderEvent`**: Foundation for webhook event ingestion and idempotent processing.

## Migration
- Added via `prisma db push` locally to bypass shadow DB limitations on the restricted test environment.


## Phase 5 Updates
- **MarketingPost**: Added ersion field (Int) for optimistic concurrency locking.
- **MarketingPostVersion**: New model capturing point-in-time snapshots of draft edits (content_snapshot, media_snapshot, 	arget_channels, change_reason).