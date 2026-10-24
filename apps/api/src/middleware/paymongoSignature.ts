import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyPaymongoSignature = (req: Request, res: Response, next: NextFunction) => {
  const signatureHeader = req.headers['paymongo-signature'] as string;
  if (!signatureHeader) {
    return res.status(401).json({ error: 'Missing PayMongo signature' });
  }

  // Extract timestamp (t) and signature (te or v1)
  const parts = signatureHeader.split(',');
  const t = parts.find(p => p.startsWith('t='))?.split('=')[1];
  const te = parts.find(p => p.startsWith('te='))?.split('=')[1] || parts.find(p => p.startsWith('v1='))?.split('=')[1];

  if (!t || !te) {
    return res.status(401).json({ error: 'Invalid PayMongo signature format' });
  }

  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('PAYMONGO_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook configuration error' });
  }

  // Reconstruct payload and hash
  // Enforce exact raw request bytes
  const rawBody = (req as { rawBody?: unknown }).rawBody;
  if (!rawBody) {
    return res.status(500).json({ error: 'Raw body is required for signature verification' });
  }

  const payloadString = typeof rawBody === 'string' ? `${t}.${rawBody}` : `${t}.${(rawBody as Buffer).toString('utf8')}`;
  const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');

  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(te, 'hex');
    
    if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
      return res.status(401).json({ error: 'Webhook signature verification failed' });
    }
  } catch {
    return res.status(401).json({ error: 'Webhook signature verification failed' });
  }

  next();
};