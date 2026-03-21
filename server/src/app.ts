import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config.js';

const app = express();

app.use(
	cors({
		origin: config.CLIENT_URL,
		credentials: true, // Required for session cookies
	}),
);

// Rate limit auth endpoints — 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});
// Better Auth handles its own body parsing — mount BEFORE express.json()
// Rate limiter is chained inline to avoid path-stripping side effects from app.use()
app.all('/api/auth/*splat', authLimiter, toNodeHandler(auth));

app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

export default app;
