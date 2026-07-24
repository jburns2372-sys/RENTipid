import 'server-only';

import { PrismaClient } from '@prisma/client';
import { requireAuthenticatedUser } from '../authorization';
import { createPlaybookApiHandlers } from './security-response-playbook-api';

const prisma = new PrismaClient();

export const playbookRouteHandlers = createPlaybookApiHandlers({
  database: prisma,
  getAuthenticatedUser: requireAuthenticatedUser,
});
