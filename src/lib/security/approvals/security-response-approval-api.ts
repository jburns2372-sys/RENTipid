import 'server-only';

import { Prisma, PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ApprovalWriterError,
  submitResponseApprovalRequest,
  approveResponseRequest,
  rejectResponseRequest,
  cancelResponseRequest,
  revokeApprovalGrant,
  consumeApprovalGrant,
  expireResponseRequest
} from './security-response-approval.service';

export type ApprovalApiDatabase = PrismaClient;

export type ApprovalApiDependencies = {
  database: ApprovalApiDatabase;
  getAuthenticatedUser: () => Promise<{ id?: string; name?: string | null; email?: string | null; image?: string | null } | null>;
};

const submitRequestSchema = z.object({
  incident_case_id: z.string().min(1),
  playbook_id: z.string().min(1),
  playbook_version: z.number().int().min(0),
  justification: z.string().min(1),
});

const approveRequestSchema = z.object({
  request_id: z.string().min(1),
  reason: z.string().optional(),
  validity_duration_ms: z.number().int().min(1),
});

const rejectRequestSchema = z.object({
  request_id: z.string().min(1),
  reason: z.string().min(1),
});

const cancelRequestSchema = z.object({
  request_id: z.string().min(1),
  reason: z.string().optional(),
});

const revokeGrantSchema = z.object({
  request_id: z.string().min(1),
  reason: z.string().optional(),
});

export function createApprovalApiHandlers(deps: ApprovalApiDependencies) {
  const { database: db, getAuthenticatedUser } = deps;

  async function handleWriterError(error: unknown) {
    if (error instanceof ApprovalWriterError) {
      if (error.code === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 });
      }
      if (['REQUEST_NOT_FOUND', 'GRANT_NOT_FOUND'].includes(error.code)) {
        return NextResponse.json({ error: error.code }, { status: 404 });
      }
      if (['REQUEST_NOT_PENDING', 'REQUEST_NOT_APPROVED', 'GRANT_NOT_AVAILABLE', 'GRANT_EXPIRED', 'SELF_APPROVAL_NOT_ALLOWED', 'UNAUTHORIZED_CONSUMPTION'].includes(error.code)) {
        return NextResponse.json({ error: error.code }, { status: 400 });
      }
      if (error.code === 'CONCURRENCY_ERROR') {
        return NextResponse.json({ error: 'CONCURRENCY_ERROR' }, { status: 409 });
      }
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    console.error('Unhandled Approval API Error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }

  return {
    submitRequest: async (req: Request) => {
      const user = await getAuthenticatedUser();
      if (!user || !user.id) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const input = submitRequestSchema.parse(body);

        const result = await db.$transaction(async (tx) => {
          return await submitResponseApprovalRequest(tx, user.id, input);
        });

        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        }
        return handleWriterError(error);
      }
    },

    approveRequest: async (req: Request) => {
      const user = await getAuthenticatedUser();
      if (!user || !user.id) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const input = approveRequestSchema.parse(body);

        const result = await db.$transaction(async (tx) => {
          return await approveResponseRequest(tx, user.id, input);
        });

        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        }
        return handleWriterError(error);
      }
    },

    rejectRequest: async (req: Request) => {
      const user = await getAuthenticatedUser();
      if (!user || !user.id) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const input = rejectRequestSchema.parse(body);

        const result = await db.$transaction(async (tx) => {
          return await rejectResponseRequest(tx, user.id, input);
        });

        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        }
        return handleWriterError(error);
      }
    },

    cancelRequest: async (req: Request) => {
      const user = await getAuthenticatedUser();
      if (!user || !user.id) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const input = cancelRequestSchema.parse(body);

        const result = await db.$transaction(async (tx) => {
          return await cancelResponseRequest(tx, user.id, input);
        });

        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        }
        return handleWriterError(error);
      }
    },

    revokeGrant: async (req: Request) => {
      const user = await getAuthenticatedUser();
      if (!user || !user.id) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const input = revokeGrantSchema.parse(body);

        const result = await db.$transaction(async (tx) => {
          return await revokeApprovalGrant(tx, user.id, input);
        });

        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        }
        return handleWriterError(error);
      }
    },
  };
}
