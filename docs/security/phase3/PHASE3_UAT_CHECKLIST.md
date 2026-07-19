# Phase 3 UAT Checklist

| Test ID | Preconditions | Steps | Expected Result | Actual Result | PASS / FAIL | Evidence Reference | Tester | Date | Reviewer Approval |
|---|---|---|---|---|---|---|---|---|---|
| UAT-3-01 | Verified Super Admin access | Log in as Verified Super Admin and navigate to rule init | Action succeeds | | | | | | |
| UAT-3-02 | Unauthorized role denial | Log in as Admin and attempt init | Action fails (Unauthorized) | | | | | | |
| UAT-3-03 | Suspended or Blacklisted account denial | Log in as Suspended Super Admin | Action fails (Status denial) | | | | | | |
| UAT-3-04 | Rule listing | View rules dashboard | Rules displayed successfully | | | | | | |
| UAT-3-05 | Explicit rule initialization | Click initialize rules button | Returns CREATED array | | | | | | |
| UAT-3-06 | Exactly two initialized rules | Query database for DRAFT rules | Exactly 2 rules created | | | | | | |
| UAT-3-07 | DRAFT status confirmation | Check rule status field | Status is strictly DRAFT | | | | | | |
| UAT-3-08 | Equivalent initialization retry | Click initialize rules again | Returns ALREADY_INITIALIZED | | | | | | |
| UAT-3-09 | Semantic conflict | Attempt to initialize altered DSL | Returns INITIALIZATION_CONFLICT | | | | | | |
| UAT-3-10 | Invalid DSL rejection | Submit malformed DSL payload | Rejects via schema validator | | | | | | |
| UAT-3-11 | Event compatibility | Submit compatible raw event | Evaluates matching logic | | | | | | |
| UAT-3-12 | Rule evaluation | Trigger evaluator worker | Evaluator processes event | | | | | | |
| UAT-3-13 | Alert creation | Check SecurityAlerts | Alert is generated correctly | | | | | | |
| UAT-3-14 | Alert deduplication | Ingest duplicate event stream | Only 1 alert is created | | | | | | |
| UAT-3-15 | Alert review | Access alert dashboard | Alert is viewable | | | | | | |
| UAT-3-16 | Audit creation | Check AuditLogs table | SOC_RULE_INITIALIZED logged | | | | | | |
| UAT-3-17 | Audit privacy | Inspect AuditLog details | No sensitive data exposed | | | | | | |
| UAT-3-18 | Transaction rollback | Simulate DB failure in AuditLog | Rule is rolled back | | | | | | |
| UAT-3-19 | Worker lease | Lock lease and start worker 2 | Worker 2 skips batch | | | | | | |
| UAT-3-20 | Worker checkpoint recovery | Restart worker | Resumes from checkpoint | | | | | | |
| UAT-3-21 | No page-render audit noise | Visit pages multiple times | AuditLogs remain unchanged | | | | | | |
| UAT-3-22 | No automatic activation | Confirm initialization boundary | Rules stay DRAFT | | | | | | |
| UAT-3-23 | No business-record mutation | Inspect user/booking tables | Records remain untouched | | | | | | |
| UAT-3-24 | No automated countermeasure | Check automated enforcement logs | No enforcement triggered | | | | | | |
| UAT-3-25 | Test artifact cleanup | Validate cleanup scripts | Test DB is restored | | | | | | |
| UAT-3-26 | Production-not-touched confirmation | Query prod DB after tests | Prod DB unchanged | | | | | | |
