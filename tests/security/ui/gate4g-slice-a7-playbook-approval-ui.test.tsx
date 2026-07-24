/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlaybookListClient } from '../../../src/components/security/playbooks/PlaybookListClient';
import { PlaybookDetailClient } from '../../../src/components/security/playbooks/PlaybookDetailClient';
import { ApprovalListClient } from '../../../src/components/security/approvals/ApprovalListClient';
import { ApprovalDetailClient } from '../../../src/components/security/approvals/ApprovalDetailClient';
import { SECURITY_PERMISSIONS } from '../../../src/lib/security/permissions';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      refresh: jest.fn(),
      push: jest.fn(),
    };
  }
}));

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('Gate 4G Slice A7 UI', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Playbooks UI', () => {
    it('PlaybookListClient hides create button for unauthorized users', () => {
      render(<PlaybookListClient activePermissions={[]} />);
      expect(screen.queryByText('Create draft')).toBeNull();
    });

    it('PlaybookListClient shows create button for authorized users', () => {
      render(<PlaybookListClient activePermissions={[SECURITY_PERMISSIONS.PLAYBOOK_CREATE]} />);
      expect(screen.getByText('Create draft')).not.toBeNull();
    });

    it('PlaybookDetailClient shows activate button when authorized and eligible', () => {
      const pb = { id: '1', playbook_id: 'pb1', version: 1, name: 'T', description: 'T', status: 'APPROVED', created_at: new Date(), updated_at: new Date(), lock_version: 1, steps: [], history: [] };
      render(<PlaybookDetailClient initialPlaybook={pb} activePermissions={[SECURITY_PERMISSIONS.PLAYBOOK_ACTIVATE]} />);
      expect(screen.getByText('Activate')).not.toBeNull();
    });

    it('PlaybookDetailClient hides activate button when ineligible', () => {
      const pb = { id: '1', playbook_id: 'pb1', version: 1, name: 'T', description: 'T', status: 'DRAFT', created_at: new Date(), updated_at: new Date(), lock_version: 1, steps: [], history: [] };
      render(<PlaybookDetailClient initialPlaybook={pb} activePermissions={[SECURITY_PERMISSIONS.PLAYBOOK_ACTIVATE]} />);
      expect(screen.queryByText('Activate')).toBeNull();
    });
  });

  describe('Approvals UI', () => {
    it('ApprovalDetailClient shows cancel button for pending requester', () => {
      const app = { id: '1', incident_case_id: 'c1', playbook_id: 'p1', playbook_version: 1, status: 'PENDING', requester_id: 'u1', requested_at: new Date(), expires_at: null, requester: null, grants: [], justification: '', decision_at: null, approver: null, decisions: [] };
      render(<ApprovalDetailClient initialApproval={app} activePermissions={[SECURITY_PERMISSIONS.RESPONSE_CANCEL]} currentUserId="u1" />);
      expect(screen.getByText('Cancel Request')).not.toBeNull();
    });

    it('ApprovalDetailClient hides cancel button for non-requester', () => {
      const app = { id: '1', incident_case_id: 'c1', playbook_id: 'p1', playbook_version: 1, status: 'PENDING', requester_id: 'u1', requested_at: new Date(), expires_at: null, requester: null, grants: [], justification: '', decision_at: null, approver: null, decisions: [] };
      render(<ApprovalDetailClient initialApproval={app} activePermissions={[SECURITY_PERMISSIONS.RESPONSE_CANCEL]} currentUserId="u2" />);
      expect(screen.queryByText('Cancel Request')).toBeNull();
    });

    it('ApprovalDetailClient shows approve/reject for non-requester analyst', () => {
      const app = { id: '1', incident_case_id: 'c1', playbook_id: 'p1', playbook_version: 1, status: 'PENDING', requester_id: 'u1', requested_at: new Date(), expires_at: null, requester: null, grants: [], justification: '', decision_at: null, approver: null, decisions: [] };
      render(<ApprovalDetailClient initialApproval={app} activePermissions={[SECURITY_PERMISSIONS.RESPONSE_APPROVE, SECURITY_PERMISSIONS.RESPONSE_REJECT]} currentUserId="u2" />);
      expect(screen.getByText('Approve')).not.toBeNull();
      expect(screen.getByText('Reject')).not.toBeNull();
    });

    it('ApprovalDetailClient prevents self-approval', () => {
      const app = { id: '1', incident_case_id: 'c1', playbook_id: 'p1', playbook_version: 1, status: 'PENDING', requester_id: 'u1', requested_at: new Date(), expires_at: null, requester: null, grants: [], justification: '', decision_at: null, approver: null, decisions: [] };
      render(<ApprovalDetailClient initialApproval={app} activePermissions={[SECURITY_PERMISSIONS.RESPONSE_APPROVE, SECURITY_PERMISSIONS.RESPONSE_REJECT]} currentUserId="u1" />);
      expect(screen.queryByText('Approve')).toBeNull();
      expect(screen.queryByText('Reject')).toBeNull();
    });

    it('ApprovalDetailClient shows revoke button for active grant', () => {
      const app = { id: '1', incident_case_id: 'c1', playbook_id: 'p1', playbook_version: 1, status: 'APPROVED', requester_id: 'u1', requested_at: new Date(), expires_at: null, requester: null, grants: [{ grant_state: 'AVAILABLE', issued_at: new Date(), expires_at: new Date(), consumed_at: null, revoked_at: null, revoked_by: null }], justification: '', decision_at: null, approver: null, decisions: [] };
      render(<ApprovalDetailClient initialApproval={app} activePermissions={[SECURITY_PERMISSIONS.RESPONSE_REVOKE]} currentUserId="u2" />);
      expect(screen.getByText('Revoke Grant')).not.toBeNull();
    });
  });
});
