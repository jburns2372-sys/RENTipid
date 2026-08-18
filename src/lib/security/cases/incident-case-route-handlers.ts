import 'server-only';

import { PrismaClient } from '@prisma/client';
import { requireAuthenticatedUser } from '../authorization';
import { createIncidentCaseApiHandlers } from './incident-case-api';

const prisma = new PrismaClient();

export const incidentCaseRouteHandlers = createIncidentCaseApiHandlers({
  database: prisma,
  getAuthenticatedUser: requireAuthenticatedUser,
});
