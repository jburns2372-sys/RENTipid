import { incidentCaseRouteHandlers } from '@/lib/security/cases/incident-case-route-handlers';

export const GET = incidentCaseRouteHandlers.listCases;
export const POST = incidentCaseRouteHandlers.createCase;
