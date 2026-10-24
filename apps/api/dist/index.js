"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appInsights_1 = require("./middleware/appInsights");
(0, appInsights_1.initAppInsights)();
const express_1 = __importDefault(require("express"));
const health_1 = __importDefault(require("./routes/health"));
const bookings_1 = __importDefault(require("./routes/bookings"));
const documents_1 = __importDefault(require("./routes/documents"));
const cors_1 = require("./middleware/cors");
const correlationId_1 = require("./middleware/correlationId");
const helmet_1 = __importDefault(require("helmet"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
// Phase 13: Enable CORS and OPTIONS preflight specifically for Mobile WebViews
app.use(cors_1.mobileCorsMiddleware);
app.use((0, helmet_1.default)());
app.use(rateLimiter_1.generalLimiter);
app.use(correlationId_1.correlationMiddleware);
app.use(express_1.default.json());
// Phase 4: Core Health Checks for Azure Container Apps
app.use('/health', health_1.default);
app.use('/bookings', rateLimiter_1.strictLimiter, bookings_1.default);
app.use('/documents', documents_1.default);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rentipid Azure API running on port ${PORT}`));
