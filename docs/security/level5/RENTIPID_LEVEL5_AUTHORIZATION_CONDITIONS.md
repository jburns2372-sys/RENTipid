# RENTipid Level 5 Authorization Conditions

## Condition 1: Production Infrastructure Deployment
CONDITION_ID=COND-01
CONDITION=Terraform apply to production Azure/Neon environments requires manual approval
CLASSIFICATION=PRODUCTION_ACTIVATION
OWNER=Engineering Lead
REQUIRED_ACTION=Review Terraform Plan and Execute Apply
APPROVAL_AUTHORITY=VP Engineering
DUE_DATE_STATUS=PENDING_GO_LIVE
SECURITY_AUTHORIZATION_BLOCKING=false
PRODUCTION_ACTIVATION_BLOCKING=true
EVIDENCE_REQUIRED=Approved PR / Change Request for Terraform Apply

## Condition 2: Vercel Production Release
CONDITION_ID=COND-02
CONDITION=Deployment of branch to Vercel production
CLASSIFICATION=PRODUCTION_ACTIVATION
OWNER=Engineering Lead
REQUIRED_ACTION=Promote build to production
APPROVAL_AUTHORITY=VP Engineering
DUE_DATE_STATUS=PENDING_GO_LIVE
SECURITY_AUTHORIZATION_BLOCKING=false
PRODUCTION_ACTIVATION_BLOCKING=true
EVIDENCE_REQUIRED=Vercel Deployment Log

## Condition 3: Live Payment Mode
CONDITION_ID=COND-03
CONDITION=Stripe production keys integration and activation
CLASSIFICATION=FINANCE_APPROVAL
OWNER=Finance Lead
REQUIRED_ACTION=Provide live Stripe keys to secure vault
APPROVAL_AUTHORITY=CFO
DUE_DATE_STATUS=PENDING_GO_LIVE
SECURITY_AUTHORIZATION_BLOCKING=false
PRODUCTION_ACTIVATION_BLOCKING=true
EVIDENCE_REQUIRED=Written CFO Approval

## Condition 4: Legal Retention Policy Confirmation
CONDITION_ID=COND-04
CONDITION=Confirm standard data retention durations map strictly to local law
CLASSIFICATION=LEGAL
OWNER=Legal Counsel
REQUIRED_ACTION=Review `src/lib/privacy/retention-policy.ts` definitions
APPROVAL_AUTHORITY=Legal Counsel
DUE_DATE_STATUS=PENDING_GO_LIVE
SECURITY_AUTHORIZATION_BLOCKING=false
PRODUCTION_ACTIVATION_BLOCKING=false
EVIDENCE_REQUIRED=Email/Memo of confirmation from Counsel
