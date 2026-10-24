import 'server-only';

import { PrismaClient } from '@prisma/client';
import { requireAuthenticatedUser } from '../authorization';
import { createApprovalApiHandlers } from './security-response-approval-api';

const prisma = new PrismaClient();

export const approvalRouteHandlers = createApprovalApiHandlers({
  database: prisma,
  getAuthenticatedUser: requireAuthenticatedUser,
});
