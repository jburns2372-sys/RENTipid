# Content Workflows

The Content Studio provides the following workflows:
1. **Draft Creation**: Associates campaign/listing, target platform, and caption/media.
2. **AI Suggestion**: Generates suggested content (flagged as [SUGGESTED CONTENT]).
3. **Draft Edit**: Enables optimistic concurrency, updating MarketingPost and recording a MarketingPostVersion snapshot.
4. **Submit for Review**: Locks the draft from further edits and sets status to SUBMITTED_FOR_REVIEW.
5. **Phase 12 Comprehensive Validation**: All workflows have been successfully E2E validated through the entire Publishing pipeline, proving persistence and state-machine transitions.