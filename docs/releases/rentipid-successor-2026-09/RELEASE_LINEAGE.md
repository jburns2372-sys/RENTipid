# RENTipid — Release Lineage & Provenance Record

**Release Tag:** `rentipid-successor-2026-09-v1.0.0-frozen`  
**Accepted Production Runtime SHA:** `d84854264447b7e2c5f521ebf88da31d22d7c066`  
**Accepted Production Deployment ID:** `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW`  
**Canonical Production URL:** `https://www.rentipid.com.ph`  

---

## 1. Lineage & Transition History

| Stage | Identifier | Context | Status |
|---|---|---|---|
| **Historical Baseline** | `dpl_A2gAH3ZHDtW6Gbo2479ToqbLhQsu` | Commit `d19f0cb63391a652f9a9a4fb22d9688ffac753b0` | Immutable Frozen Tag `listingbridge-retirement-v1.0.0-frozen` |
| **Local Successor Branch** | `successor/rc-candidate` | Commit `d84854264447b7e2c5f521ebf88da31d22d7c066` | Clean worktree, G1-G5 verified locally |
| **Blocked Preview Attempt** | `dpl_ciXgjLY2ZLzm4xT13agNL9w85NxV` | Same SHA `d8485426...` | STAGED / BLOCKED (Project paused in Vercel control plane) |
| **Preview Recovery & Verification** | `dpl_6FXfFpwkcCfb5cuHbRveUCmAJmUb` | Same SHA `d8485426...` | READY, 14/14 Acceptance Tests Passed (G6/G7) |
| **Production Promotion** | `dpl_6CAZBAdohAhBJKhBvaNs26AHfzgW` | Same SHA `d8485426...` | READY, Health 200, Aliased to `www.rentipid.com.ph` (G9) |
| **Owner Acceptance** | Explicit Directive | Directive `ACCEPT PRODUCTION` | Formal Approval Logged (G11) |
| **Version Freeze** | Tag `rentipid-successor-2026-09-v1.0.0-frozen` | Resolves to commit `d8485426...` | Frozen Baseline (G13) |

---

## 2. Integrity Statement

The accepted production runtime SHA `d84854264447b7e2c5f521ebf88da31d22d7c066` remained byte-for-byte identical through:
- Local functional acceptance (G5)
- Preview block remediation (G6)
- Preview end-to-end acceptance testing (G7)
- Production readiness review (G8)
- Production deployment and domain aliasing (G9)
- Formal Owner Acceptance (G11)
- Release Baseline Freeze (G13)
