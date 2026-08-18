# RBAC Foundation

## Principles
RENTipid utilizes a **centralized code-authoritative** permission framework mapping roles to granular capabilities in memory. There is no dynamic, database-authoritative permission registry table.

No hardcoded role checks exist in the Social domain. All permission checking routes strictly through the `hasSocialPermission` dictionary.

## Social Permissions Vocabulary
- `social.view`
- `social.create`
- `social.edit`
- `social.approve`
- `social.schedule`
- `social.publish`
- `social.analytics.view`
- `social.accounts.manage`
- `social.feedback.view`
- `social.feedback.respond`
- `social.admin`

## Implementations
Implemented in `src/lib/social/social-permissions.ts`.
- **Admin/Super Admin**: All permissions.
- **Compliance Admin**: View-only, Analytics, Feedback.
- **Finance Admin**: Analytics.
- **Renter/Provider**: None unless explicitly granted by business logic later.


## Phase 5 Content Studio Authorization
UI access and backend methods require the social.create and social.edit permissions (mapped through SOCIAL_PERMISSIONS). Content Studio explicitly denies edits when an account is DISABLED, or if provider promotion consent (ProviderPromotionOptIn) has not been granted for a specific listing.