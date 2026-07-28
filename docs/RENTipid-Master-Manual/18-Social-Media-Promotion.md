# Chapter 18 — Social Media, Promotion, and Feedback Intelligence

## 18.1 Marketing and Promotion Engine

RENTipid includes a built-in module for managing external marketing campaigns and provider promotions. This allows the platform to broadcast top-tier listings to connected social channels (e.g., Facebook, Instagram, Twitter).

### 18.1.1 Social Accounts and Queues
- Admins can link official RENTipid social profiles via the `SocialAccount` model (using OAuth integration).
- The `SocialPostQueue` manages scheduled promotional posts.

### 18.1.2 Provider Opt-In Promotion
Providers can boost their listings by opting into promotional campaigns (`ProviderPromotionOptIn`). If selected, RENTipid generates marketing assets (`PromotionAsset`) and tracks engagement via UTM links (`UTMLink`).

## 18.2 Feedback Intelligence and Sentiment Analysis

A critical component of Trust and Safety is aggregating user feedback.
- **Review System:** Renters and Providers rate each other post-transaction.
- **Sentiment Tracking:** (Planned) RENTipid intends to route text reviews through an NLP sentiment analyzer. Consistently negative sentiment scores against a Provider will flag their account for Compliance review, even if no formal disputes were filed.

## 18.3 Campaign Analytics

Marketing Admins utilize the `CampaignAnalytics` module to track the ROI of social media efforts, measuring:
- Click-through rates on promotional UTM links.
- Conversion rates (number of actual bookings originating from a specific social post).

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-002 | `prisma/schema.prisma` | `SocialAccount`, `MarketingCampaign`, `SocialPostQueue` | Marketing Data Models | Verified |
| REPO-005 | `src/app/dashboard/admin/marketing` | Marketing Dashboard | Operations UI | Verified |

## Known Limitations
- **API Quotas:** Social media integrations rely on external third-party APIs which are subject to rate limiting. Deep integration is currently heavily mocked.

## Related Chapters
- Chapter 10: Listing Creation and Management
