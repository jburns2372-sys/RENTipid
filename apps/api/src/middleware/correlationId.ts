import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import * as appInsights from 'applicationinsights';

/**
 * Extracts the x-correlation-id header sent by the Vercel frontend, 
 * or generates a new one if missing. Injects it into App Insights context.
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  
  // Attach back to response for client tracing
  res.setHeader('x-correlation-id', correlationId);

  const client = appInsights.defaultClient;
  if (client) {
    // Use AppInsights Zone to track the context natively
    const telemetryContext = appInsights.getCorrelationContext();
    if (telemetryContext) {
      telemetryContext.customProperties.correlationId = correlationId;
    }
  }

  // Attach to request object for easy internal logging
  (req as any).correlationId = correlationId;
  
  next();
};