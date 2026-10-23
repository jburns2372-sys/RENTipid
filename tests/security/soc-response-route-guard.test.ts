import { POST } from '@/app/api/soc/responses/execute/route';
import {
  assertSecurityPermissionForService,
  getValidSessionIdentity,
  requireAuthenticatedUser,
} from '@/lib/security/authorization';
import { executeSecurityResponse } from '@/lib/security/responses/execution.service';

jest.mock('@/lib/security/authorization', () => ({
  requireAuthenticatedUser: jest.fn(),
  getValidSessionIdentity: jest.fn(),
  assertSecurityPermissionForService: jest.fn(),
}));

jest.mock('@/lib/security/responses/execution.service', () => ({
  executeSecurityResponse: jest.fn(),
  ExecutionError: class ExecutionError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  },
}));

const requestBody = {
  incident_case_id: 'case-1',
  playbook_id: 'playbook-1',
  playbook_version: 1,
  approval_grant_id: 'grant-1',
  response_type: 'QUARANTINE_USER',
  target_type: 'User',
  target_id: 'target-1',
  idempotency_key: 'idem-1',
};

const request = () => new Request('https://app.example.test/api/soc/responses/execute', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(requestBody),
});

describe('SOC response route guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getValidSessionIdentity as jest.Mock).mockReturnValue('user-1');
  });

  it('denies unauthenticated privileged requests', async () => {
    (requireAuthenticatedUser as jest.Mock).mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(assertSecurityPermissionForService).not.toHaveBeenCalled();
    expect(executeSecurityResponse).not.toHaveBeenCalled();
  });

  it('denies AAL1 privileged requests before executing the operation', async () => {
    (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(false);

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(executeSecurityResponse).not.toHaveBeenCalled();
  });

  it('allows AAL2 privileged requests when authorization passes', async () => {
    (requireAuthenticatedUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (assertSecurityPermissionForService as jest.Mock).mockResolvedValue(true);
    (executeSecurityResponse as jest.Mock).mockResolvedValue({ id: 'execution-1' });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(executeSecurityResponse).toHaveBeenCalledTimes(1);
  });
});
