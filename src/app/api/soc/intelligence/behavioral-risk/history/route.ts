import { NextResponse } from 'next/server';
import { requireAuthenticatedUser, getValidSessionIdentity, assertSecurityPermissionForService } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { listBehavioralRiskHistoryForSubject, MAX_ASSESSMENT_HISTORY_LIMIT } from '@/lib/security/intelligence/behavioral-risk.queries';
import { SecurityEnvironment, SecurityLifecycle } from '@prisma/client';

const VALID_ENVIRONMENTS = new Set<string>(["DEVELOPMENT", "TEST", "UAT", "STAGING", "PRODUCTION"]);
const VALID_LIFECYCLES = new Set<string>(["LIVE", "TEST", "SIMULATION"]);

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const userId = getValidSessionIdentity({ user });

    const isAllowed = await assertSecurityPermissionForService(userId, SECURITY_PERMISSIONS.DASHBOARD_VIEW);
    if (!isAllowed) return NextResponse.json({ error: "PERMISSION_DENIED" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const subjectRef = searchParams.get('subjectRef');
    const environment = searchParams.get('environment');
    const lifecycle = searchParams.get('lifecycle');

    let limit: number | undefined = undefined;
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return NextResponse.json({ error: "BAD_REQUEST", details: "Limit must be a positive integer" }, { status: 400 });
      }
      limit = Math.min(parsedLimit, MAX_ASSESSMENT_HISTORY_LIMIT);
    }

    if (!subjectRef || subjectRef.trim() === '') {
      return NextResponse.json({ error: "BAD_REQUEST", details: "Missing subjectRef" }, { status: 400 });
    }
    if (!environment || !VALID_ENVIRONMENTS.has(environment)) {
      return NextResponse.json({ error: "BAD_REQUEST", details: "Invalid or missing environment" }, { status: 400 });
    }
    if (!lifecycle || !VALID_LIFECYCLES.has(lifecycle)) {
      return NextResponse.json({ error: "BAD_REQUEST", details: "Invalid or missing lifecycle" }, { status: 400 });
    }

    const result = await listBehavioralRiskHistoryForSubject({
      subjectReference: subjectRef.trim(),
      environment: environment as SecurityEnvironment,
      lifecycle: lifecycle as SecurityLifecycle
    }, limit);

    return NextResponse.json({ history: result });
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('PERMISSION_DENIED')) {
      return NextResponse.json({ error: "PERMISSION_DENIED" }, { status: 403 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
