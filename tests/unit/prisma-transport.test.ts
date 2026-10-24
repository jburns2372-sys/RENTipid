import { neonConfig } from '@neondatabase/serverless';
import { WebSocket } from 'ws';

describe('Prisma Transport Configuration', () => {
  it('must configure WebSocket constructor for Node.js Neon serverless adapter', async () => {
    // We import prisma to ensure its side effects run
    await import('../../src/lib/prisma');
    
    // The webSocketConstructor should now be strictly equal to the WebSocket class
    expect(neonConfig.webSocketConstructor).toBe(WebSocket);
  });
});
