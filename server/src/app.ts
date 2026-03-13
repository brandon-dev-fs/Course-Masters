import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(
	cors({
		origin: 'http://localhost:5000',
		credentials: true, // Required for session cookies
	}),
);

// Better Auth handles its own body parsing — mount BEFORE express.json()
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());
app.use('/api', router);
app.use(errorHandler);

export default app;
