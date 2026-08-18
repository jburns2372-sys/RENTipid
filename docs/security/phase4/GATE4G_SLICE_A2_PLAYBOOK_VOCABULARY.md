# Gate 4G Playbook & Approval Controlled Vocabulary

## 1. Playbook Lifecycle (`SecurityPlaybookStatus`)
- **DRAFT**: The playbook is being authored or revised and is not active.
- **REVIEW_PENDING**: The playbook is submitted for supervisor or admin review.
- **ACTIVE**: The playbook is approved and currently active for case linkage.
- **ARCHIVED**: The playbook is historically retained but no longer available for new cases.

## 2. Response Action Type (`SecurityResponseActionType`)
- **ACCOUNT_RESTRICTION**: Restrict login or feature access for a user account.
- **PAYMENT_FREEZE**: Prevent new payments or payouts on the platform.
- **BOOKING_FREEZE**: Prevent new bookings or reservations.
- **SESSION_REVOCATION**: Immediately terminate all active sessions for a user.
- **CREDENTIAL_ROTATION**: Force password or token reset.
- **INFRASTRUCTURE_ENFORCEMENT**: IP ban, WAF rule block, or network restriction.
- **MANUAL_PROCEDURE**: A human-driven procedure requiring external evidence collection.

## 3. Response Reversibility (`SecurityResponseReversibility`)
- **REVERSIBLE**: The action can be cleanly undone by the system.
- **IRREVERSIBLE**: The action is permanent (e.g., data deletion or hard ban).
- **MANUAL_INTERVENTION_REQUIRED**: Reversing the action requires manual administrative or external support effort.

## 4. Approval Request Lifecycle (`SecurityApprovalStatus`)
- **PENDING**: Request created and waiting for approver decision.
- **APPROVED**: Request has been approved but the grant is not yet fully consumed.
- **REJECTED**: Request was explicitly rejected by the approver.
- **CANCELLED**: Request was cancelled by the requester before a decision was made.
- **EXPIRED**: Request passed its expiration time without a decision.
- **REVOKED**: Request was approved but subsequently revoked by an admin or supervisor.
- **CONSUMED**: The approved action was fully executed by Gate 4H and the grant is spent.

## 5. Approval Decision Event Type (`SecurityApprovalEventType`)
- **REQUESTED**: The initial request submission.
- **APPROVED**: An approval decision recorded by the approver.
- **REJECTED**: A rejection decision recorded by the approver.
- **CANCELLED**: Cancellation recorded by the requester.
- **EXPIRED**: Expiration logged by the system.
- **REVOKED**: Revocation recorded by a privileged admin.
- **CONSUMED**: Execution completion recorded by Gate 4H.

## 6. Approval Grant State (`SecurityApprovalGrantState`)
- **AVAILABLE**: The grant is approved, unexpired, and ready for Gate 4H consumption.
- **CONSUMED**: The grant has been successfully utilized.
- **REVOKED**: The grant was manually invalidated before use.
- **EXPIRED**: The grant's validity window has passed.
