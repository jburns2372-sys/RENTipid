import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length === 0) {
    return false;
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const expected = `Bearer ${cronSecret}`;
  const authBuffer = Buffer.from(authHeader, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (authBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(authBuffer, expectedBuffer);
}

export async function handleTrigger(req: Request): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const token = process.env.GITHUB_DISPATCH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { error: 'DISPATCH_CONFIG_MISSING' },
      { status: 500 }
    );
  }

  const repo = process.env.GITHUB_REPOSITORY || 'jburns2372-sys/RENTipid';
  const url = `https://api.github.com/repos/${repo}/actions/workflows/backup-freshness-monitor.yml/dispatches`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'RENTipid-Vercel-Cron/1.0',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          trigger_source: 'vercel_cron',
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (response.status === 204) {
      return Response.json(
        {
          status: 'DISPATCHED',
          workflow: 'backup-freshness-monitor.yml',
          ref: 'main',
          trigger_source: 'vercel_cron',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return Response.json(
      {
        error: 'GITHUB_DISPATCH_FAILED',
        status: response.status,
      },
      { status: 502 }
    );
  } catch {
    return Response.json(
      { error: 'GITHUB_DISPATCH_UNAVAILABLE' },
      { status: 503 }
    );
  }
}

export async function GET(req: Request) {
  return handleTrigger(req);
}

export async function POST(req: Request) {
  return handleTrigger(req);
}
