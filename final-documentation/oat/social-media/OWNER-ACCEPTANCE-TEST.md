# RENTipid Owner Acceptance Test

MODULE:
Social Media & Marketing

OAT ID:
OAT-SOCIAL-MASTER-001

ENVIRONMENT:
PREVIEW ONLY

ESTIMATED TIME:
10–15 minutes

DEPENDENCIES:
AUTH, RBAC

PERMANENT FIXTURES:
MockSocialAdapter, MasterCampaign, TestProvider

REQUIRED USERS:
OWNER, ADMIN, PROVIDER

SETUP:
npm run oat:social:setup

RESET:
npm run oat:social:reset

READINESS:
npm run oat:social:check

MANUAL WORKFLOW:

STEP 1: Log in as OAT PROVIDER (oat.provider@rentipid.test) and navigate to Content Studio.
EXPECTED: The Content Studio loads successfully and displays the connected Mock Social profiles.

STEP 2: Create a new social media post targeting a connected campaign. Submit for approval.
EXPECTED: The post is saved in PENDING_APPROVAL state.

STEP 3: Log in as OAT ADMIN (oat.admin@rentipid.test). Navigate to Social Approvals.
EXPECTED: The pending post appears in the queue.

STEP 4: Approve the pending post.
EXPECTED: The post status changes to APPROVED and the system schedules it via the Mock Social Adapter.

RBAC NEGATIVE CHECK:
Log in as OAT RENTER (oat.renter@rentipid.test). Attempt to navigate to Content Studio (/dashboard/provider/social).
EXPECTED: The system rejects access with a 403 Forbidden or redirects to the Renter dashboard.

ERROR CHECK:
Attempt to publish a post with missing text/image content.
EXPECTED: The validation blocks the submission and displays a clear error message.

PERSISTENCE CHECK:
Refresh the browser after submitting the post.
EXPECTED: The post remains visible in the list with the correct status.

PASS CRITERIA:
- The owner can execute the full content lifecycle (draft -> pending -> approved).
- The Mock Adapter captures the scheduled event without real API calls.
- Unauthorized roles cannot access the studio.

RESULT:
[PASS / FAIL]

DEFECTS:
[NONE]
