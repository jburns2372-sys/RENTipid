# Phase 14 Roadmap: Social API Readiness

## Overview
Currently, the Social Promotion Engine runs entirely in **Draft/Mock Mode**. Phase 14 outlines connecting live OAuth applications to publish directly to connected user pages.

## Platform Evaluations
1. **Meta (Facebook/Instagram)**: Requires the Graph API. Getting `pages_manage_posts` and `instagram_content_publish` scopes requires a multi-week App Review process, including submitting screencasts of the UI.
2. **TikTok**: Requires the Direct Post API. Stricter approval guidelines, heavily focused on video requirements.
3. **LinkedIn**: Community Management API requires registering as an official LinkedIn Developer App.

## Rate Limits & Security
- We must build a strict scheduling queue to avoid exceeding Meta's 200 posts per hour limit.
- OAuth tokens must be stored using Advanced Encryption Standard (AES-256-GCM) in the database.

## Activation Checklist
1. Register Developer Apps.
2. Complete OAuth Scopes review.
3. Implement secure Token Refresh logic.
4. Test thoroughly in Sandbox mode before switching the Super Admin toggle to Production.
