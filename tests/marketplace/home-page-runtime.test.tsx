import React from 'react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('lucide-react', () => {
  const Icon = () => null;
  return { Search: Icon, ShieldCheck: Icon, Zap: Icon, ArrowRight: Icon, Bot: Icon };
});

jest.mock('@/components/brand/RentipidLogo', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/ai/AIAssistantButton', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/lib/prisma', () => ({
  prisma: { category: { findMany: jest.fn() } },
}));

import Home from '@/app/page';
import { prisma } from '@/lib/prisma';
import { MARKETPLACE_CATEGORY_METADATA_PREFIX } from '@/lib/marketplace/category-metadata';

describe('home page runtime query path', () => {
  test('executes Home and builds the valid optional requirements relation filter', async () => {
    const findMany = prisma.category.findMany as jest.Mock;
    findMany.mockResolvedValue([]);

    const result = await Home();

    expect(result).toBeTruthy();
    expect(findMany).toHaveBeenCalledWith({
      where: {
        is_active: true,
        requirements: { is: { notes: { startsWith: MARKETPLACE_CATEGORY_METADATA_PREFIX } } },
      },
      include: { requirements: true },
    });
  });
});
