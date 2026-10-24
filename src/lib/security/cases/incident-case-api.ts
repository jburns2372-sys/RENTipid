import 'server-only';

import {
  IncidentCase,
  IncidentCaseEvidence,
  IncidentCaseEvidenceSource,
  IncidentCaseEvidenceType,
  IncidentCaseHistory,
  IncidentCaseNote,
  IncidentCaseNoteType,
  IncidentCaseOrigin,
  IncidentCaseSeverity,
  IncidentCaseStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addIncidentCaseEvidence,
  addIncidentCaseNote,
  assignIncidentCase,
  createIncidentCase,
  IncidentCaseWriterError,
  requireIncidentCasePermission,
  transitionIncidentCaseStatus,
} from './incident-case-writers.service';
import { SECURITY_PERMISSIONS } from '../permissions';

export const INCIDENT_CASE_API_MAX_PAGE_SIZE = 100;
export const INCIDENT_CASE_API_DEFAULT_PAGE_SIZE = 50;

type IncidentCaseApiDatabase = PrismaClient | Prisma.TransactionClient;

export type IncidentCaseRouteContext = {
  params: Promise<{ caseId: string }>;
};

export type IncidentCaseApiDependencies = {
  database: IncidentCaseApiDatabase;
  getAuthenticatedUser: () => Promise<unknown>;
};

const boundedId = z.string().trim().min(1).max(191);
const idempotencyKey = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/);

const caseParamsSchema = z
  .object({
    caseId: boundedId,
  })
  .strict();

const listQuerySchema = z
  .object({
    cursor: boundedId.optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(INCIDENT_CASE_API_MAX_PAGE_SIZE)
      .default(INCIDENT_CASE_API_DEFAULT_PAGE_SIZE),
    status: z.nativeEnum(IncidentCaseStatus).optional(),
    severity: z.nativeEnum(IncidentCaseSeverity).optional(),
    origin: z.nativeEnum(IncidentCaseOrigin).optional(),
    assigned_user_id: boundedId.optional(),
    security_event_id: boundedId.optional(),
  })
  .strict();

const createCaseSchema = z
  .object({
    severity: z.nativeEnum(IncidentCaseSeverity),
    origin: z.nativeEnum(IncidentCaseOrigin),
    title: z.string().trim().min(1).max(160),
    summary: z.string().max(2000).nullable().optional(),
    security_event_id: boundedId.nullable().optional(),
    initial_status: z.literal(IncidentCaseStatus.OPEN).optional(),
    idempotency_key: idempotencyKey,
  })
  .strict();

const transitionSchema = z
  .object({
    expected_status: z.nativeEnum(IncidentCaseStatus),
    expected_version: z.number().int().min(1),
    new_status: z.nativeEnum(IncidentCaseStatus),
    reason_note: z.string().max(1000).nullable().optional(),
    idempotency_key: idempotencyKey,
  })
  .strict();

const assignmentSchema = z
  .object({
    assignee_user_id: boundedId,
    expected_version: z.number().int().min(1),
    reason_note: z.string().max(1000).nullable().optional(),
    idempotency_key: idempotencyKey,
  })
  .strict();

const noteSchema = z
  .object({
    note_type: z.nativeEnum(IncidentCaseNoteType),
    content: z.string().trim().min(1).max(4000),
    idempotency_key: idempotencyKey,
  })
  .strict();

const evidenceSchema = z
  .object({
    evidence_type: z.nativeEnum(IncidentCaseEvidenceType),
    source: z.nativeEnum(IncidentCaseEvidenceSource),
    reference_key: z.string().trim().min(1).max(256),
    integrity_hash: z.string().regex(/^[0-9a-f]{64}$/i),
    collected_at: z.string().datetime(),
    content_type: z.string().trim().min(1).max(120).nullable().optional(),
    size_bytes: z
      .number()
      .int()
      .min(0)
      .max(2_147_483_647)
      .nullable()
      .optional(),
    idempotency_key: idempotencyKey,
  })
  .strict();

const listCaseSelect = {
  id: true,
  case_reference: true,
  status: true,
  severity: true,
  origin: true,
  title: true,
  created_at: true,
  updated_at: true,
  opened_at: true,
  assigned_user: {
    select: {
      id: true,
      full_name: true,
    },
  },
  originating_security_event_id: true,
  version: true,
} satisfies Prisma.IncidentCaseSelect;

const detailCaseSelect = {
  id: true,
  case_reference: true,
  status: true,
  severity: true,
  origin: true,
  title: true,
  summary: true,
  created_at: true,
  updated_at: true,
  opened_at: true,
  resolved_at: true,
  closed_at: true,
  reopened_at: true,
  assigned_user: {
    select: {
      id: true,
      full_name: true,
    },
  },
  created_by_user: {
    select: {
      id: true,
      full_name: true,
    },
  },
  originating_security_event_id: true,
  version: true,
  histories: {
    orderBy: [{ occurred_at: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      previous_status: true,
      new_status: true,
      reason: true,
      reason_note: true,
      occurred_at: true,
      actor_user: {
        select: {
          id: true,
          full_name: true,
        },
      },
      assigned_to_user: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
  },
  notes: {
    orderBy: [{ created_at: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      note_type: true,
      content: true,
      is_redacted: true,
      created_at: true,
      actor_user: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
  },
  evidences: {
    orderBy: [{ collected_at: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      evidence_type: true,
      source_classification: true,
      collected_at: true,
      created_at: true,
      reference_key: true,
      integrity_hash: true,
      content_type: true,
      size_bytes: true,
      added_by_user: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },
  },
} satisfies Prisma.IncidentCaseSelect;

type ListCaseRow = Prisma.IncidentCaseGetPayload<{
  select: typeof listCaseSelect;
}>;

type DetailCaseRow = Prisma.IncidentCaseGetPayload<{
  select: typeof detailCaseSelect;
}>;

type ApiError = {
  code: string;
  message: string;
};

type Parsed<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

function errorResponse(status: number, error: ApiError) {
  return NextResponse.json({ error }, { status });
}

function invalidRequest(message = 'The request is invalid.') {
  return errorResponse(400, {
    code: 'INCIDENT_CASE_INVALID_REQUEST',
    message,
  });
}

async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<Parsed<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { success: false, response: invalidRequest() };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { success: false, response: invalidRequest() };
  }
  return { success: true, data: result.data };
}

async function parseCaseId(
  context: IncidentCaseRouteContext,
): Promise<Parsed<string>> {
  const result = caseParamsSchema.safeParse(await context.params);
  if (!result.success) {
    return { success: false, response: invalidRequest('The case ID is invalid.') };
  }
  return { success: true, data: result.data.caseId };
}

async function authenticate(
  dependencies: IncidentCaseApiDependencies,
): Promise<Parsed<string>> {
  const sessionUser = await dependencies.getAuthenticatedUser();
  const sessionUserId =
    sessionUser && typeof sessionUser === 'object' && 'id' in sessionUser
      ? sessionUser.id
      : undefined;
  if (
    typeof sessionUserId !== 'string' ||
    sessionUserId.length === 0
  ) {
    return {
      success: false,
      response: errorResponse(401, {
        code: 'INCIDENT_CASE_AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
      }),
    };
  }
  return { success: true, data: sessionUserId };
}

function writerErrorResponse(error: IncidentCaseWriterError) {
  if (error.code === 'INCIDENT_CASE_PERMISSION_DENIED') {
    return errorResponse(403, {
      code: 'INCIDENT_CASE_FORBIDDEN',
      message: 'You are not authorized to perform this operation.',
    });
  }

  if (
    error.code === 'CASE_NOT_FOUND' ||
    error.code === 'ASSIGNEE_NOT_FOUND' ||
    error.code === 'SECURITY_EVENT_NOT_FOUND'
  ) {
    return errorResponse(404, {
      code: error.code,
      message: 'The requested resource was not found.',
    });
  }

  if (
    error.code === 'TRANSITION_NOT_APPROVED' ||
    error.code === 'SELF_TRANSITION_REJECTED' ||
    error.code === 'STALE_TRANSITION_CONFLICT' ||
    error.code === 'STALE_ASSIGNMENT_CONFLICT' ||
    error.code === 'SAME_ASSIGNEE_REJECTED'
  ) {
    return errorResponse(409, {
      code: error.code,
      message: 'The requested operation conflicts with the current case state.',
    });
  }

  return errorResponse(400, {
    code: error.code,
    message:
      error.code === 'PRIVACY_REJECTED'
        ? 'The request contains prohibited sensitive content.'
        : 'The request is invalid.',
  });
}

function safeOperationError(error: unknown) {
  if (error instanceof IncidentCaseWriterError) {
    return writerErrorResponse(error);
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    return errorResponse(409, {
      code: 'INCIDENT_CASE_IDEMPOTENCY_CONFLICT',
      message: 'The operation conflicts with an existing request.',
    });
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  ) {
    return errorResponse(404, {
      code: 'INCIDENT_CASE_RESOURCE_NOT_FOUND',
      message: 'The requested resource was not found.',
    });
  }
  return errorResponse(500, {
    code: 'INCIDENT_CASE_INTERNAL_ERROR',
    message: 'The request could not be completed.',
  });
}

function serializeUser(user: { id: string; full_name: string } | null) {
  return user
    ? {
        id: user.id,
        full_name: user.full_name,
      }
    : null;
}

function serializeListCase(row: ListCaseRow) {
  return {
    id: row.id,
    case_reference: row.case_reference,
    status: row.status,
    severity: row.severity,
    origin: row.origin,
    title: row.title,
    created_at: row.created_at,
    updated_at: row.updated_at,
    opened_at: row.opened_at,
    assigned_user: serializeUser(row.assigned_user),
    originating_security_event_id: row.originating_security_event_id,
    version: row.version,
  };
}

function serializeCaseRoot(row: IncidentCase) {
  return {
    id: row.id,
    case_reference: row.case_reference,
    status: row.status,
    severity: row.severity,
    origin: row.origin,
    title: row.title,
    summary: row.summary,
    created_at: row.created_at,
    updated_at: row.updated_at,
    opened_at: row.opened_at,
    resolved_at: row.resolved_at,
    closed_at: row.closed_at,
    reopened_at: row.reopened_at,
    assigned_user_id: row.assigned_user_id,
    originating_security_event_id: row.originating_security_event_id,
    version: row.version,
  };
}

function serializeHistory(row: IncidentCaseHistory) {
  return {
    id: row.id,
    previous_status: row.previous_status,
    new_status: row.new_status,
    reason: row.reason,
    reason_note: row.reason_note,
    actor_user_id: row.actor_user_id,
    assigned_to_user_id: row.assigned_to_user_id,
    occurred_at: row.occurred_at,
  };
}

function serializeNote(row: IncidentCaseNote) {
  return {
    id: row.id,
    incident_case_id: row.incident_case_id,
    actor_user_id: row.actor_user_id,
    note_type: row.note_type,
    content: row.is_redacted ? null : row.content,
    is_redacted: row.is_redacted,
    created_at: row.created_at,
  };
}

function serializeEvidence(row: IncidentCaseEvidence) {
  return {
    id: row.id,
    incident_case_id: row.incident_case_id,
    evidence_type: row.evidence_type,
    source: row.source_classification,
    added_by_user_id: row.added_by_user_id,
    collected_at: row.collected_at,
    created_at: row.created_at,
    reference_key: row.reference_key,
    integrity_hash: row.integrity_hash,
    content_type: row.content_type,
    size_bytes: row.size_bytes,
  };
}

function serializeDetailCase(row: DetailCaseRow) {
  return {
    id: row.id,
    case_reference: row.case_reference,
    status: row.status,
    severity: row.severity,
    origin: row.origin,
    title: row.title,
    summary: row.summary,
    created_at: row.created_at,
    updated_at: row.updated_at,
    opened_at: row.opened_at,
    resolved_at: row.resolved_at,
    closed_at: row.closed_at,
    reopened_at: row.reopened_at,
    assigned_user: serializeUser(row.assigned_user),
    created_by_user: serializeUser(row.created_by_user),
    originating_security_event_id: row.originating_security_event_id,
    version: row.version,
    histories: row.histories.map((history) => ({
      id: history.id,
      previous_status: history.previous_status,
      new_status: history.new_status,
      reason: history.reason,
      reason_note: history.reason_note,
      occurred_at: history.occurred_at,
      actor_user: serializeUser(history.actor_user),
      assigned_to_user: serializeUser(history.assigned_to_user),
    })),
    notes: row.notes.map((note) => ({
      id: note.id,
      note_type: note.note_type,
      content: note.is_redacted ? null : note.content,
      is_redacted: note.is_redacted,
      created_at: note.created_at,
      actor_user: serializeUser(note.actor_user),
    })),
    evidences: row.evidences.map((evidence) => ({
      id: evidence.id,
      evidence_type: evidence.evidence_type,
      source: evidence.source_classification,
      collected_at: evidence.collected_at,
      created_at: evidence.created_at,
      reference_key: evidence.reference_key,
      integrity_hash: evidence.integrity_hash,
      content_type: evidence.content_type,
      size_bytes: evidence.size_bytes,
      added_by_user: serializeUser(evidence.added_by_user),
    })),
  };
}

export function createIncidentCaseApiHandlers(
  dependencies: IncidentCaseApiDependencies,
) {
  const listCases = async (request: Request) => {
    const actor = await authenticate(dependencies);
    if (!actor.success) return actor.response;

    const rawQuery = Object.fromEntries(new URL(request.url).searchParams);
    const query = listQuerySchema.safeParse(rawQuery);
    if (!query.success) return invalidRequest('The query parameters are invalid.');

    try {
      await requireIncidentCasePermission(
        dependencies.database,
        actor.data,
        SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW,
      );

      if (query.data.cursor) {
        const cursor = await dependencies.database.incidentCase.findUnique({
          where: { id: query.data.cursor },
          select: { id: true },
        });
        if (!cursor) {
          return invalidRequest('The pagination cursor is invalid.');
        }
      }

      const where: Prisma.IncidentCaseWhereInput = {};
      if (query.data.status) where.status = query.data.status;
      if (query.data.severity) where.severity = query.data.severity;
      if (query.data.origin) where.origin = query.data.origin;
      if (query.data.assigned_user_id) {
        where.assigned_user_id = query.data.assigned_user_id;
      }
      if (query.data.security_event_id) {
        where.originating_security_event_id = query.data.security_event_id;
      }

      const rows = await dependencies.database.incidentCase.findMany({
        where,
        take: query.data.limit + 1,
        skip: query.data.cursor ? 1 : undefined,
        cursor: query.data.cursor ? { id: query.data.cursor } : undefined,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        select: listCaseSelect,
      });
      const hasMore = rows.length > query.data.limit;
      if (hasMore) rows.pop();
      const nextCursor = hasMore ? rows.at(-1)?.id ?? null : null;

      return NextResponse.json({
        data: rows.map(serializeListCase),
        pagination: {
          limit: query.data.limit,
          next_cursor: nextCursor,
        },
      });
    } catch (error) {
      return safeOperationError(error);
    }
  };

  const readCase = async (
    _request: Request,
    context: IncidentCaseRouteContext,
  ) => {
    const actor = await authenticate(dependencies);
    if (!actor.success) return actor.response;
    const caseId = await parseCaseId(context);
    if (!caseId.success) return caseId.response;

    try {
      await requireIncidentCasePermission(
        dependencies.database,
        actor.data,
        SECURITY_PERMISSIONS.INCIDENT_CASE_VIEW,
      );
      const row = await dependencies.database.incidentCase.findUnique({
        where: { id: caseId.data },
        select: detailCaseSelect,
      });
      if (!row) {
        return errorResponse(404, {
          code: 'CASE_NOT_FOUND',
          message: 'The requested resource was not found.',
        });
      }
      return NextResponse.json({ data: serializeDetailCase(row) });
    } catch (error) {
      return safeOperationError(error);
    }
  };

  const createCase = async (request: Request) => {
    const actor = await authenticate(dependencies);
    if (!actor.success) return actor.response;
    const body = await parseJsonBody(request, createCaseSchema);
    if (!body.success) return body.response;

    try {
      const result = await createIncidentCase(dependencies.database, {
        severity: body.data.severity,
        origin: body.data.origin,
        title: body.data.title,
        summary: body.data.summary,
        actorUserId: actor.data,
        securityEventId: body.data.security_event_id,
        initialStatus: body.data.initial_status,
        historyIdempotencyKey: body.data.idempotency_key,
      });
      return NextResponse.json(
        {
          data: {
            incident_case: serializeCaseRoot(result.incidentCase),
            history: serializeHistory(result.history),
          },
        },
        { status: 201 },
      );
    } catch (error) {
      return safeOperationError(error);
    }
  };

  const transitionCase = async (
    request: Request,
    context: IncidentCaseRouteContext,
  ) => {
    const actor = await authenticate(dependencies);
    if (!actor.success) return actor.response;
    const caseId = await parseCaseId(context);
    if (!caseId.success) return caseId.response;
    const body = await parseJsonBody(request, transitionSchema);
    if (!body.success) return body.response;

    try {
      const result = await transitionIncidentCaseStatus(dependencies.database, {
        incidentCaseId: caseId.data,
        expectedStatus: body.data.expected_status,
        expectedVersion: body.data.expected_version,
        newStatus: body.data.new_status,
        actorUserId: actor.data,
        reasonNote: body.data.reason_note,
        historyIdempotencyKey: body.data.idempotency_key,
      });
      return NextResponse.json({
        data: {
          incident_case: serializeCaseRoot(result.incidentCase),
          history: serializeHistory(result.history),
        },
      });
    } catch (error) {
      return safeOperationError(error);
    }
  };

  const assignCase = async (
    request: Request,
    context: IncidentCaseRouteContext,
  ) => {
    const actor = await authenticate(dependencies);
    if (!actor.success) return actor.response;
    const caseId = await parseCaseId(context);
    if (!caseId.success) return caseId.response;
    const body = await parseJsonBody(request, assignmentSchema);
    if (!body.success) return body.response;

    try {
      const result = await assignIncidentCase(dependencies.database, {
        incidentCaseId: caseId.data,
        assigneeUserId: body.data.assignee_user_id,
        actorUserId: actor.data,
        expectedVersion: body.data.expected_version,
        reasonNote: body.data.reason_note,
        historyIdempotencyKey: body.data.idempotency_key,
      });
      return NextResponse.json({
        data: {
          incident_case: serializeCaseRoot(result.incidentCase),
          history: serializeHistory(result.history),
        },
      });
    } catch (error) {
      return safeOperationError(error);
    }
  };

  const appendNote = async (
    request: Request,
    context: IncidentCaseRouteContext,
  ) => {
    const actor = await authenticate(dependencies);
    if (!actor.success) return actor.response;
    const caseId = await parseCaseId(context);
    if (!caseId.success) return caseId.response;
    const body = await parseJsonBody(request, noteSchema);
    if (!body.success) return body.response;

    try {
      const note = await addIncidentCaseNote(dependencies.database, {
        incidentCaseId: caseId.data,
        noteType: body.data.note_type,
        content: body.data.content,
        actorUserId: actor.data,
        idempotencyKey: body.data.idempotency_key,
      });
      return NextResponse.json({ data: serializeNote(note) });
    } catch (error) {
      return safeOperationError(error);
    }
  };

  const appendEvidence = async (
    request: Request,
    context: IncidentCaseRouteContext,
  ) => {
    const actor = await authenticate(dependencies);
    if (!actor.success) return actor.response;
    const caseId = await parseCaseId(context);
    if (!caseId.success) return caseId.response;
    const body = await parseJsonBody(request, evidenceSchema);
    if (!body.success) return body.response;

    try {
      const evidence = await addIncidentCaseEvidence(dependencies.database, {
        incidentCaseId: caseId.data,
        evidenceType: body.data.evidence_type,
        source: body.data.source,
        referenceKey: body.data.reference_key,
        integrityHash: body.data.integrity_hash,
        actorUserId: actor.data,
        collectedAt: new Date(body.data.collected_at),
        contentType: body.data.content_type,
        sizeBytes: body.data.size_bytes,
        idempotencyKey: body.data.idempotency_key,
      });
      return NextResponse.json({ data: serializeEvidence(evidence) });
    } catch (error) {
      return safeOperationError(error);
    }
  };

  return {
    listCases,
    readCase,
    createCase,
    transitionCase,
    assignCase,
    appendNote,
    appendEvidence,
  };
}
