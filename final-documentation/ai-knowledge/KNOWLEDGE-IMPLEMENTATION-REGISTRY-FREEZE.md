# RENTipid Knowledge Implementation Registry Freeze

REGISTRY_ID: `KB1-INITIAL-146`  
STATUS: `FROZEN_IMPLEMENTATION_INPUT`  
BASELINE_HEAD: `7427fa8f98aa3996cb07168e2960d28a1cd92ac7`  
CANDIDATES: `146`  
ACCOUNTED: `146`  
UNCLASSIFIED: `0`  
UNACCOUNTED: `0`  
REGISTRY_SHA256: `97A3E7ADC75FBB35DC5D4947A51D517C8E8BF11FB49566E97FBB75B65E8A293D`

Validated invariants:

- 146 numbered rows;
- 146 unique `sourceKey` values;
- 146 unique sequence numbers;
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
