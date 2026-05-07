import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { envelopeMiddleware } from './middleware/envelope.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { httpLogger } from './middleware/httpLogger.js';
import { authLimiter, apiLimiter } from './middleware/rateLimiter.js';
import { config } from './config.js';
import { swaggerDocument } from './swagger.js';

const app = express();

app.use(
	cors({
		origin: config.CLIENT_URL,
		credentials: true, // Required for session cookies
	}),
);

// 1. Attach a unique request ID to every request and set X-Request-Id header
app.use(requestIdMiddleware);

// 2. Structured HTTP request/response logging via pino-http
app.use(httpLogger);

// 3. Rate-limit auth endpoints — 20 requests per 15 minutes per IP
// Better Auth handles its own body parsing — mount BEFORE express.json()
// Rate limiter is chained inline to avoid path-stripping side effects from app.use()
app.all('/api/auth/*splat', authLimiter, toNodeHandler(auth));

// 4. Broad API rate limit — 300 requests per 15 minutes per IP
app.use('/api', apiLimiter);

app.use(express.json());
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api', envelopeMiddleware);
app.use('/api', router);
app.use(errorHandler);

export default app;
