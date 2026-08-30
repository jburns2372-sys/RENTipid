jest.mock('@/lib/ai/ai-settings-service', () => ({
  getAISettings: jest.fn(),
  isModuleAIEnabled: jest.fn(),
  isBotEnabled: jest.fn(),
}));

jest.mock('@/components/ai/RentipidAIAssistant', () => ({
  __esModule: true,
  default: () => null,
}));

import AIAssistantButton from '@/components/ai/AIAssistantButton';
import { getAISettings } from '@/lib/ai/ai-settings-service';

describe('AI assistant button runtime failure path', () => {
  test('fails closed and logs only safe error fields when settings loading throws', async () => {
    const error = Object.assign(new Error('settings unavailable'), {
      code: 'P1001',
      meta: 'database unavailable',
    });
    (getAISettings as jest.Mock).mockRejectedValue(error);
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(AIAssistantButton({ context: 'Homepage' })).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith(
      '[ai-assistant-button] disabled after settings failure',
      expect.objectContaining({ name: 'Error', message: 'settings unavailable', code: 'P1001', meta: 'database unavailable' }),
    );
    expect(log.mock.calls[0][1]).not.toHaveProperty('password');
    log.mockRestore();
  });
});
