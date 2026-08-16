import { getServerSession } from 'next-auth/next';
import { GET, PATCH } from '@/app/api/admin/ai-customer-service/analytics/route';
import { SpecialistFeatureControlError } from '@/lib/ai/specialists/feature-control';

const mockList = jest.fn();
const mockUpdate = jest.fn();

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/ai/specialists/feature-control', () => {
  const actual = jest.requireActual('@/lib/ai/specialists/feature-control');
  return {
    ...actual,
    SpecialistFeatureControlService: jest.fn().mockImplementation(() => ({
      list: (...args: unknown[]) => mockList(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    })),
  };
});

const session = getServerSession as jest.MockedFunction<typeof getServerSession>;
const readRequest = () => new Request(
  'https://preview.example.test/api/admin/ai-customer-service/analytics?control=specialists',
);
const patchRequest = () => new Request(
  'https://preview.example.test/api/admin/ai-customer-service/analytics',
  {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ specialistId: 'SupportSpecialist', enabled: false }),
  },
);

describe('Admin Control Center specialist feature route', () => {
  beforeEach(() => jest.clearAllMocks());

  test('authorized Super Admin reads and changes an allowed specialist flag', async () => {
    session.mockResolvedValue({ user: { id: 'admin-001', role: 'Super Admin' } } as never);
    mockList.mockResolvedValue({ specialists: [{ specialistId: 'SupportSpecialist', enabled: true }] });
    mockUpdate.mockResolvedValue({ specialist: { specialistId: 'SupportSpecialist', enabled: false } });
    const read = await GET(readRequest());
    const mutation = await PATCH(patchRequest());
    expect(read.status).toBe(200);
    expect(mutation.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith('admin-001');
    expect(mockUpdate).toHaveBeenCalledWith('admin-001', {
      specialistId: 'SupportSpecialist', enabled: false,
    });
  });

  test.each(['Renter', 'Individual Provider'])('%s receives 403 for read and mutation', async role => {
    session.mockResolvedValue({ user: { id: 'denied-001', role } } as never);
    const denied = new SpecialistFeatureControlError('Specialist feature control access denied', 'UNAUTHORIZED');
    mockList.mockRejectedValue(denied);
    mockUpdate.mockRejectedValue(denied);
    expect((await GET(readRequest())).status).toBe(403);
    expect((await PATCH(patchRequest())).status).toBe(403);
  });

  test('unauthenticated request receives 401 for read and mutation', async () => {
    session.mockResolvedValue(null);
    expect((await GET(readRequest())).status).toBe(401);
    expect((await PATCH(patchRequest())).status).toBe(401);
    expect(mockList).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
