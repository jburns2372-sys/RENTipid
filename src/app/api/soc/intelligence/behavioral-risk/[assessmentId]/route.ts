import { NextResponse } from 'next/server';
import { requireAuthenticatedUser, getValidSessionIdentity, assertSecurityPermissionForService } from '@/lib/security/authorization';
import { SECURITY_PERMISSIONS } from '@/lib/security/permissions';
import { getBehavioralRiskAssessmentById } from '@/lib/security/intelligence/behavioral-risk.queries';
import { SecurityEnvironment, SecurityLifecycle } from '@prisma/client';

const VALID_ENVIRONMENTS = new Set<string>(["DEVELOPMENT", "TEST", "UAT", "STAGING", "PRODUCTION"]);
const VALID_LIFECYCLES = new Set<string>(["LIVE", "TEST", "SIMULATION"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await context.params;
    if (!assessmentId) return NextResponse.json({ error: "BAD_REQUEST", details: "Missing assessmentId" }, { status: 400 });

    const user = await requireAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const userId = getValidSessionIdentity({ user });

    const isAllowed = await assertSecurityPermissionForService(userId, SECURITY_PERMISSIONS.DASHBOARD_VIEW);
    if (!isAllowed) return NextResponse.json({ error: "PERMISSION_DENIED" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('environment');
    const lifecycle = searchParams.get('lifecycle');

    if (!environment || !VALID_ENVIRONMENTS.has(environment)) {
      return NextResponse.json({ error: "BAD_REQUEST", details: "Invalid or missing environment" }, { status: 400 });
    }
    if (!lifecycle || !VALID_LIFECYCLES.has(lifecycle)) {
      return NextResponse.json({ error: "BAD_REQUEST", details: "Invalid or missing lifecycle" }, { status: 400 });
    }

    const result = await getBehavioralRiskAssessmentById(assessmentId, {
      environment: environment as SecurityEnvironment,
      lifecycle: lifecycle as SecurityLifecycle
    });

    if (!result) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('PERMISSION_DENIED')) {
      return NextResponse.json({ error: "PERMISSION_DENIED" }, { status: 403 });
    }
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
