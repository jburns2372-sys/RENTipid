/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { ResponseDetailClient } from '../../../src/components/security/responses/ResponseDetailClient';
import { SECURITY_PERMISSIONS } from '../../../src/lib/security/permissions';
import { SecurityExecutionStatus } from '@prisma/client';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

describe('Response Operations UI', () => {
  it('shows rollback control if permitted and eligible', () => {
    const mockExecution = {
      id: 'exec-1',
      incident_case_id: 'inc-1',
      approval_grant_id: 'grant-1',
      status: SecurityExecutionStatus.SUCCEEDED,
      response_type: 'ACCOUNT_RESTRICTION',
      target_type: 'USER',
      target_id: 'user-1',
      started_at: new Date(),
      completed_at: new Date(),
      actions: []
    };
    render(<ResponseDetailClient initialExecution={mockExecution} activePermissions={[SECURITY_PERMISSIONS.RESPONSE_ROLLBACK]} isEmergencyFreeze={false} />);
    expect(screen.getByText('Rollback Execution')).not.toBeNull();
  });

  it('hides rollback control if not permitted', () => {
    const mockExecution = {
      id: 'exec-1',
      incident_case_id: 'inc-1',
      approval_grant_id: 'grant-1',
      status: SecurityExecutionStatus.SUCCEEDED,
      response_type: 'ACCOUNT_RESTRICTION',
      target_type: 'USER',
      target_id: 'user-1',
      started_at: new Date(),
      completed_at: new Date(),
      actions: []
    };
    render(<ResponseDetailClient initialExecution={mockExecution} activePermissions={[]} isEmergencyFreeze={false} />);
    expect(screen.queryByText('Rollback Execution')).toBeNull();
  });
});
