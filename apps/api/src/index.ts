import { initAppInsights } from './middleware/appInsights';
initAppInsights();

import express from 'express';
import healthRoutes from './routes/health';
import bookingRoutes from './routes/bookings';
import documentRoutes from './routes/documents';

import { mobileCorsMiddleware } from './middleware/cors';
import { correlationMiddleware } from './middleware/correlationId';
import helmet from 'helmet';
import { generalLimiter, strictLimiter } from './middleware/rateLimiter';

const app = express();

// Phase 13: Enable CORS and OPTIONS preflight specifically for Mobile WebViews
app.use(mobileCorsMiddleware);
app.use(helmet());
app.use(generalLimiter);
app.use(correlationMiddleware);
app.use(express.json());

// Phase 4: Core Health Checks for Azure Container Apps
app.use('/health', healthRoutes);
app.use('/bookings', strictLimiter, bookingRoutes);
app.use('/documents', documentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rentipid Azure API running on port ${PORT}`));