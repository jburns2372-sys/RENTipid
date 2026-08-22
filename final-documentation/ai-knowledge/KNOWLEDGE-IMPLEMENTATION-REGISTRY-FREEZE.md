# RENTipid Knowledge Implementation Registry Freeze

REGISTRY_ID: `KB1-INITIAL-148`  
STATUS: `FROZEN_IMPLEMENTATION_INPUT`  
BASELINE_HEAD: `7427fa8f98aa3996cb07168e2960d28a1cd92ac7`  
CANDIDATES: `147`  
ACCOUNTED: `147`  
UNCLASSIFIED: `0`  
UNACCOUNTED: `0`  
REGISTRY_SHA256: `66F9D4C11A07B30EE0D421D80D379C4F8725B8110E1595D821A110129F886957`
HASH_CANONICALIZATION: `UTF-8 text; CRLF and CR normalized to LF; trailing-newline presence and all other characters preserved`

Validated invariants:

- 147 numbered rows;
- 147 unique `sourceKey` values;
- 147 unique sequence numbers;
- zero invalid dispositions;
- zero missing registered document or route locators.

The registry is the sole KB-1 implementation input. Changes require an explicit targeted exception with justification; repository-wide rediscovery is prohibited.

## Targeted exception 1

- Source: `address.local-bootstrap`
- Trigger: secret validator category `DATABASE_CREDENTIAL`
- Change: `SUPER_ADMIN_ONLY` synchronizable source to non-ingested `SYSTEM_ONLY`
- Reason: the controlled document contains a credential-shaped local connection example; conversational persistence is not permitted.
- Discovery scope: no repository-wide rediscovery performed.

## Targeted exception 2

- Sources: `ai.complete-documentation`, `ai.policy-catalog`
- Trigger: lower-role safe-uncertainty test exposed internal/local-test policy-limit detail
- Change: `ROLE_RESTRICTED/AUTHENTICATED` to `SUPER_ADMIN_ONLY`
- Reason: the documents are approved internal implementation knowledge, but their local-test thresholds are not approved customer policy.
- Discovery scope: no repository-wide rediscovery performed.

## Targeted exception 3

- Source: `provider.workflow-status`
- Trigger: Basic Inquiry AI OAT
- Change: `AUTHENTICATED` to `PUBLIC`
- Reason: Listing creation inquiries from unauthenticated users incorrectly fallback to provider onboarding due to missing visibility. Descriptions are non-mutative and should be public.
- Discovery scope: no repository-wide rediscovery performed.

