import { getServerSession } from 'next-auth/next';
import { GET } from '@/app/api/admin/ai-customer-service/analytics/route';
import { SupportAnalyticsError } from '@/lib/ai/analytics/SupportAnalyticsService';

const mockGetTraceDetail = jest.fn();

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/ai/analytics/SupportAnalyticsService', () => {
  const actual = jest.requireActual('@/lib/ai/analytics/SupportAnalyticsService');
  return {
    ...actual,
    SupportAnalyticsService: jest.fn().mockImplementation(() => ({
      getTraceDetail: (...args: unknown[]) => mockGetTraceDetail(...args),
      getControlCenter: jest.fn(),
    })),
  };
});

const session = getServerSession as jest.MockedFunction<typeof getServerSession>;
const request = () => new Request(
  'https://preview.example.test/api/admin/ai-customer-service/analytics?traceId=trace-request-001',
);

describe('Admin Control Center specialist trace route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('authorized Admin receives 200 with bounded trace detail', async () => {
    session.mockResolvedValue({ user: { id: 'admin-001', role: 'Admin' } } as any);
    mockGetTraceDetail.mockResolvedValue({
      contractVersion: 'uaics-specialist-trace.v1',
      trace: { traceId: 'trace-request-001', selectedSpecialist: 'SupportSpecialist' },
    });

    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      trace: { traceId: 'trace-request-001', selectedSpecialist: 'SupportSpecialist' },
    });
    expect(mockGetTraceDetail).toHaveBeenCalledWith('admin-001', 'trace-request-001');
  });

  test.each([
    ['Renter', 'renter-001'],
    ['Individual Provider', 'provider-001'],
  ])('%s receives 403', async (role, id) => {
    session.mockResolvedValue({ user: { id, role } } as any);
    mockGetTraceDetail.mockRejectedValue(
      new SupportAnalyticsError('Administrative analytics access denied', 'UNAUTHORIZED'),
    );

    const response = await GET(request());
    expect(response.status).toBe(403);
  });

  test('unauthenticated request receives 401', async () => {
    session.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mockGetTraceDetail).not.toHaveBeenCalled();
  });
});
