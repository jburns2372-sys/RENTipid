import 'server-only';

import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  PlaybookWriterError,
  createSecurityResponsePlaybookDraft,
  updateSecurityResponsePlaybookDraft,
  addSecurityResponseStep,
  updateSecurityResponseStep,
  removeSecurityResponseStep,
  reorderSecurityResponseSteps,
  createSecurityResponsePlaybookVersion,
  submitSecurityResponsePlaybookForReview,
  activateSecurityResponsePlaybook,
} from './security-response-playbook.service';
import { SecurityResponseActionType, SecurityResponseReversibility, SecuritySeverity } from '@prisma/client';

export type PlaybookApiDatabase = PrismaClient;

export type PlaybookApiDependencies = {
  database: PlaybookApiDatabase;
  getAuthenticatedUser: () => Promise<{ id?: string; name?: string | null; email?: string | null; image?: string | null } | null>;
};

const createDraftSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

const updateDraftSchema = z.object({
  playbook_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

const addStepSchema = z.object({
  playbook_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
  step_order: z.number().int().min(1),
  action_type: z.nativeEnum(SecurityResponseActionType),
  human_instruction: z.string().min(1),
  expected_evidence: z.string().optional(),
  reversibility: z.nativeEnum(SecurityResponseReversibility),
  duration_seconds: z.number().int().min(1).optional(),
  risk_level: z.nativeEnum(SecuritySeverity),
  approval_required: z.boolean().optional(),
});

const updateStepSchema = z.object({
  playbook_id: z.string().min(1),
  step_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
  action_type: z.nativeEnum(SecurityResponseActionType).optional(),
  human_instruction: z.string().min(1).optional(),
  expected_evidence: z.string().optional(),
  reversibility: z.nativeEnum(SecurityResponseReversibility).optional(),
  duration_seconds: z.number().int().min(1).optional(),
  risk_level: z.nativeEnum(SecuritySeverity).optional(),
  approval_required: z.boolean().optional(),
});

const removeStepSchema = z.object({
  playbook_id: z.string().min(1),
  step_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
});

const reorderStepsSchema = z.object({
  playbook_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
  order_mapping: z.array(z.object({
    step_id: z.string().min(1),
    new_order: z.number().int().min(1),
  })).min(1),
});

const createVersionSchema = z.object({
  playbook_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
});

const submitReviewSchema = z.object({
  playbook_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
});

const activateSchema = z.object({
  playbook_id: z.string().min(1),
  expected_lock_version: z.number().int().min(0),
});

export function createPlaybookApiHandlers(deps: PlaybookApiDependencies) {
  const { database: db, getAuthenticatedUser } = deps;

  async function handleWriterError(error: unknown) {
    if (error instanceof PlaybookWriterError) {
      if (error.code === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 });
      }
      if (['NOT_FOUND', 'STEP_NOT_FOUND'].includes(error.code)) {
        return NextResponse.json({ error: error.code }, { status: 404 });
      }
      if (['STALE_OR_INVALID_STATE', 'INVALID_ORDER', 'DUPLICATE_STEP_ORDER', 'EMPTY_DEFINITION'].includes(error.code)) {
        return NextResponse.json({ error: error.code }, { status: 400 });
      }
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    console.error('Unhandled Playbook API Error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }

  return {
    createDraft: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const input = createDraftSchema.parse(body);
        const result = await db.$transaction(async (tx) => {
          return await createSecurityResponsePlaybookDraft(tx, userId, input);
        });
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    updateDraft: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, expected_lock_version, ...input } = updateDraftSchema.parse(body);
        const result = await db.$transaction(async (tx) => {
          return await updateSecurityResponsePlaybookDraft(tx, userId, playbook_id, expected_lock_version, input);
        });
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    addStep: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, expected_lock_version, ...input } = addStepSchema.parse(body);
        const result = await db.$transaction(async (tx) => {
          return await addSecurityResponseStep(tx, userId, playbook_id, expected_lock_version, input);
        });
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    updateStep: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, step_id, expected_lock_version, ...input } = updateStepSchema.parse(body);
        await db.$transaction(async (tx) => {
          return await updateSecurityResponseStep(tx, userId, playbook_id, step_id, expected_lock_version, input);
        });
        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    removeStep: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, step_id, expected_lock_version } = removeStepSchema.parse(body);
        await db.$transaction(async (tx) => {
          return await removeSecurityResponseStep(tx, userId, playbook_id, step_id, expected_lock_version);
        });
        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    reorderSteps: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, expected_lock_version, order_mapping } = reorderStepsSchema.parse(body);
        await db.$transaction(async (tx) => {
          return await reorderSecurityResponseSteps(tx, userId, playbook_id, expected_lock_version, order_mapping);
        });
        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    createVersion: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, expected_lock_version } = createVersionSchema.parse(body);
        const result = await db.$transaction(async (tx) => {
          return await createSecurityResponsePlaybookVersion(tx, userId, playbook_id, expected_lock_version);
        });
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    submitReview: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, expected_lock_version } = submitReviewSchema.parse(body);
        await db.$transaction(async (tx) => {
          return await submitSecurityResponsePlaybookForReview(tx, userId, playbook_id, expected_lock_version);
        });
        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },

    activate: async (req: Request) => {
      const user = await getAuthenticatedUser();
      const userId = user?.id;
      if (!userId) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

      try {
        const body = await req.json();
        const { playbook_id, expected_lock_version } = activateSchema.parse(body);
        await db.$transaction(async (tx) => {
          return await activateSecurityResponsePlaybook(tx, userId, playbook_id, expected_lock_version);
        });
        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'BAD_REQUEST', details: error.issues }, { status: 400 });
        return handleWriterError(error);
      }
    },
  };
}
