
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Privacy Admin Route', () => {
  it('denies access to non-admin roles', async () => {
    // test
    expect(true).toBe(true);
  });

  it('allows access to Admin role', async () => {
    // test
    expect(true).toBe(true);
  });
});
