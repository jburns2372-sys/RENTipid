# Sole-maintainer change-control exception

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0
Package: ISO-C2-M4-D5-R2-E3. Effective: 2026-10-24. Executor: CODEX.

The Project Owner declares they are the sole repository maintainer; no qualified independent human reviewer is currently available. The prior mandatory human-review requirement was operationally impossible. This package explicitly authorizes its formal replacement and normal protected merge of PR #1 after all gates pass. This is RENTipid internal control design, not an ad-hoc bypass. ISO itself is not claimed to require or prohibit a GitHub review count. No certification claimed.

## Compensating controls

Require a PR, explicit Project Owner merge authorization, recorded designated AI technical review, strict passing required CI, applicable Production-impact gates and no unresolved high/critical security gate failure. Prohibit direct main pushes, force pushes, branch deletion and normal-merge bypass. Enforce administrators. No residual risk accepted merely to permit merge. Review the exception when another qualified maintainer joins.

## Protection before and after

Only required_approving_review_count changed 1 -> 0 and require_last_push_approval true -> false through the review-protection PATCH endpoint. Both are human-review requirements. Read-back confirmed all other settings unchanged:

- required_pull_request_reviews remains present: PR required.
- dismiss_stale_reviews=true; require_code_owner_reviews=false.
- required_status_checks.strict=true; contexts supply-chain-validation and Localization Acceptance CI, both app_id=15368.
- enforce_admins.enabled=true; allow_force_pushes.enabled=false; allow_deletions.enabled=false.
- required_conversation_resolution.enabled=true; required_signatures.enabled=false; required_linear_history.enabled=false.
- block_creations.enabled=false; lock_branch.enabled=false; allow_fork_syncing.enabled=false.
- No configured bypass actors; effective branch rules endpoint returned [].

## Review evidence

Dual-executor evidence: Antigravity R1 synchronization review and Codex R2-E1 patched-candidate review in ISO_C2_MAIN_PRODUCTION_BASELINE_SYNCHRONIZATION_EVIDENCE.md. These are prior recorded reviews, not a claim of a new Antigravity execution. Codex E3 independently verified all 2,422 candidate-to-PR differences exactly match the documented permitted-difference register. Runtime/build/CI content matches accepted candidate 54e2fd6d0eacdd91619f542f9888c66e7a9b52d8, except six explicitly excluded M4 files. M4 activation included: NO.

PR #1 head: 40ad800b2c87b883c7138f7a3e2ad1b0b41ea68e. Required supply-chain-validation run 40058096422 and Localization Acceptance CI run 40058096407 PASS. Both Vercel deployment checks and Preview Comments PASS; RENTipid Preview dpl_9SzUJc1rQVWM6MJdwAuTkJvGa2Xh PASS. Production-impact evidence reused unaffected. Final merge and Production consequence are recorded in synchronization evidence and STATUS.json.

Historical M1 evidence remains valid for its observed state. This subsequent authorized revision supersedes only the human-review requirement. No historical evidence is rewritten.
