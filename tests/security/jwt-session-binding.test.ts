import { authOptions } from '@/lib/auth';

const jwtCallback = authOptions.callbacks?.jwt as (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
const sessionCallback = authOptions.callbacks?.session as unknown as (params: Record<string, unknown>) => Promise<Record<string, unknown>>;

function loginToken(userId = 'user-1') {
  return jwtCallback({
    token: {},
    user: {
      id: userId,
      role: 'Renter',
      status: 'Verified',
    },
    trigger: 'signIn',
  });
}

describe('NextAuth JWT MFA session binding', () => {
  it('creates a server-generated session identifier on new login', async () => {
    const token = await loginToken();

    expect(typeof token.mfaSessionId).toBe('string');
    expect((token.mfaSessionId as string).length >= 32).toBe(true);
  });

  it('preserves the session identifier on normal JWT refresh', async () => {
    const token = await loginToken();
    const original = token.mfaSessionId;

    const refreshed = await jwtCallback({ token });

    expect(refreshed.mfaSessionId === original).toBe(true);
  });

  it('rotates the session identifier on a new login for the same user', async () => {
    const first = await loginToken('same-user');
    const second = await loginToken('same-user');

    expect(first.mfaSessionId === second.mfaSessionId).toBe(false);
  });

  it('does not let client session updates replace the server identifier', async () => {
    const token = await loginToken();
    const original = token.mfaSessionId;

    const updated = await jwtCallback({
      token,
      trigger: 'update',
      session: { mfaSessionId: 'client-supplied-value' },
    });

    expect(updated.mfaSessionId === original).toBe(true);
  });

  it('does not expose the raw session identifier through the client session callback', async () => {
    const token = await loginToken();
    const session = await sessionCallback({
      session: { user: {} },
      token,
    });

    const serialized = JSON.stringify(session);
    expect(serialized.includes('mfaSessionId')).toBe(false);
    expect(serialized.includes(String(token.mfaSessionId))).toBe(false);
  });
});
