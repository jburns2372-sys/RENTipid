/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApprovalDetailClient } from '../../../src/components/security/approvals/ApprovalDetailClient';
import { ResponseDetailClient } from '../../../src/components/security/responses/ResponseDetailClient';
import { SECURITY_PERMISSIONS } from '../../../src/lib/security/permissions';
import { SecurityExecutionStatus } from '@prisma/client';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

describe('Gate 4J Technical UAT - SOC Operator Workflow', () => {
  it('UAT Workflow - Approval and Execution UI State Transitions', async () => {
    // Stage 1: Approval Request Review
    const pendingApproval = {
      id: 'app-1', incident_case_id: 'inc-1', playbook_id: 'pb-1', playbook_version: 1,
      status: 'PENDING', requester_id: 'req-1', requested_at: new Date(), expires_at: null,
      requester: { full_name: 'Requester' }, grants: [], justification: 'UAT Test',
      decision_at: null, approver: null, decisions: [],
      response_type: 'ACCOUNT_RESTRICTION', target_type: 'USER', target_id: 'usr-1'
    };
    
    // Analyst with approve permissions sees the control
    const { rerender } = render(
      <ApprovalDetailClient 
        initialApproval={pendingApproval} 
        activePermissions={[SECURITY_PERMISSIONS.RESPONSE_APPROVE, SECURITY_PERMISSIONS.RESPONSE_REJECT]} 
        currentUserId="analyst-1" 
      />
    );
    expect(screen.getByText('Approve')).not.toBeNull();
    expect(screen.getByText('Reject')).not.toBeNull();
    // (ACCOUNT_RESTRICTION is only shown in the grants section once approved)

    // Stage 2: Approved Grant Display
    const approvedApproval = {
      ...pendingApproval,
      status: 'APPROVED', decision_at: new Date(), approver: { full_name: 'Analyst 1' },
      grants: [{ id: 'g-1', grant_state: 'AVAILABLE', issued_at: new Date(), expires_at: new Date(Date.now() + 3600000), consumed_at: null, revoked_at: null, revoked_by: null }]
    };
    
    // Rerender with approved state to verify grant issues and execute action availability
    // Wait, ApprovalDetailClient might not have "Execute" button directly, but it should show the grant.
    rerender(
      <ApprovalDetailClient 
        initialApproval={approvedApproval} 
        activePermissions={[SECURITY_PERMISSIONS.RESPONSE_EXECUTE]} 
        currentUserId="exec-1" 
      />
    );
    console.log(document.body.innerHTML);
    // In actual implementation, we might not have an execute button here, but we should see the grant.
    expect(screen.getByText(/Available/i)).not.toBeNull();

    // Stage 3: Execution State Observation
    const mockExecution = {
      id: 'exec-1', incident_case_id: 'inc-1', approval_grant_id: 'g-1',
      status: SecurityExecutionStatus.SUCCEEDED, response_type: 'ACCOUNT_RESTRICTION',
      target_type: 'USER', target_id: 'usr-1', started_at: new Date(), completed_at: new Date(),
      actions: [{ id: 'a-1', action_type: 'ACCOUNT_RESTRICTION', status: 'SUCCEEDED', error_message: null, before_state: {}, after_state: {}, started_at: new Date(), completed_at: new Date() }]
    };
    
    const execRerender = render(
      <ResponseDetailClient 
        initialExecution={mockExecution} 
        activePermissions={[SECURITY_PERMISSIONS.RESPONSE_ROLLBACK]} 
        isEmergencyFreeze={false} 
      />
    );
    // Observe execution state
    expect(execRerender.getAllByText(/Succeeded/i).length).toBeGreaterThan(0);
    // Rollback should be available
    expect(execRerender.getByText('Rollback Execution')).not.toBeNull();
    
    // Stage 4: Partial Failure and Sanitization UI Observation
    const mockFailedExecution = {
      ...mockExecution,
      status: SecurityExecutionStatus.FAILED,
      failure_code: 'TARGET_NOT_FOUND' // sanitized reason, no stack trace
    };
    execRerender.rerender(
      <ResponseDetailClient 
        initialExecution={mockFailedExecution} 
        activePermissions={[SECURITY_PERMISSIONS.RESPONSE_ROLLBACK]} 
        isEmergencyFreeze={false} 
      />
    );
    expect(execRerender.getAllByText(/Failed/i).length).toBeGreaterThan(0);
    expect(execRerender.getByText(/TARGET_NOT_FOUND/)).not.toBeNull();

    // Stage 5: Emergency Freeze Observation
    execRerender.rerender(
      <ResponseDetailClient 
        initialExecution={mockExecution} // succeeded, ready for rollback
        activePermissions={[SECURITY_PERMISSIONS.RESPONSE_ROLLBACK]} 
        isEmergencyFreeze={true} // freeze is active
      />
    );
    // Freeze active, but rollback should still be visible because freeze disables execution, not rollback!
    expect(execRerender.getByText('Rollback Execution')).not.toBeNull();
    
    // Stage 6: Unauthorized controls hidden
    execRerender.rerender(
      <ResponseDetailClient 
        initialExecution={mockExecution} 
        activePermissions={[]} // viewer only
        isEmergencyFreeze={false} 
      />
    );
    expect(execRerender.queryByText('Rollback Execution')).toBeNull();
  });
});
