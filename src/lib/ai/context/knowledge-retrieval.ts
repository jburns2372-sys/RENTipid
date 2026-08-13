import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function retrieveApprovedKnowledge(prompt: string, userRole: string | undefined): Promise<string | null> {
  // Extract keywords from the prompt to match against title or category
  const lowerPrompt = prompt.toLowerCase();
  
  // A simple heuristic for keyword extraction
  let keyword = '';
  if (lowerPrompt.includes('rentipid')) {
    keyword = 'rentipid';
  } else if (lowerPrompt.includes('onboard') || lowerPrompt.includes('become a provider')) {
    keyword = 'onboarding';
  } else if (lowerPrompt.includes('rent')) {
    keyword = 'rent';
  }

  if (!keyword) {
    return null; // No identifiable keyword for RENTipid general knowledge
  }

  // Find active knowledge sources that match
  const knowledgeSources = await prisma.aiKnowledgeSource.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { slug: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } }
      ]
    }
  });

  if (knowledgeSources.length === 0) {
    return null;
  }

  // Filter by role if applicable
  const validSources = knowledgeSources.filter(src => {
    if (!src.applicableRoles || src.applicableRoles === 'All') return true;
    if (!userRole) return false;
    const roles = src.applicableRoles.split(',').map(r => r.trim().toLowerCase());
    return roles.includes(userRole.toLowerCase()) || roles.includes('all');
  });

  if (validSources.length === 0) {
    return null;
  }

  // Combine references as the "retrieved knowledge" content
  // Since AiKnowledgeSource lacks a 'content' field in schema, we use sourceReference or title
  return validSources.map(src => src.sourceReference || src.title).join('\n');
}
