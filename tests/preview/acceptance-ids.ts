export const PREVIEW_ACCEPTANCE_IDS = [
  'A-HELP-01', 'A-HELP-02', 'A-HELP-03',
  'A-CTX-01', 'A-CTX-02', 'A-CTX-03',
  'A-CONT-01', 'A-CONT-02', 'A-CONT-03',
  'A-SPEC-01', 'A-SPEC-02', 'A-SPEC-03', 'A-SPEC-04', 'A-SPEC-05',
  'A-SUP-01',
  'A-KNOW-01', 'A-KNOW-02',
  'A-ACT-01', 'A-ACT-02', 'A-ACT-03',
  'A-PAY-01', 'A-KYC-01', 'A-INS-01',
  'A-SEC-01', 'A-SEC-02',
  'A-DH-01',
  'A-FB-01', 'A-FB-02',
  'A-PRO-01',
  'A-MED-01',
  'A-OPS-01',
  'A-SUPSP-01', 'A-SUPSP-02',
  'A-MKT-01', 'A-MKT-02',
  'A-GROW-01',
  'A-PROV-01',
  'A-FIN-01', 'A-FIN-02',
  'A-RCA-01',
  'A-CON-01',
  'A-UX-01',
  'A-CONFLICT-01', 'A-CONFLICT-02', 'A-CONFLICT-03',
] as const;

export type PreviewAcceptanceId = (typeof PREVIEW_ACCEPTANCE_IDS)[number];

export const REQUEST_TRACE_ROUTE =
  'authenticated POST /api/ai/chat -> x-rentipid-ai-trace-id -> admin GET /api/admin/ai-customer-service/analytics?traceId=<opaque>';

export const IMPLEMENTED_PREVIEW_TRACE_IDS = [
  'A-SPEC-01',
  'A-SPEC-02',
  'A-SPEC-03',
  'A-SPEC-04',
] as const satisfies readonly PreviewAcceptanceId[];

export const NEXT_UNPROVABLE_PREVIEW_ID: PreviewAcceptanceId = 'A-SPEC-05';
