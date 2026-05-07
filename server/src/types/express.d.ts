import 'express';

// Augment express-serve-static-core so the requestId property is visible
// to RequestHandler and all middleware type signatures.
declare module 'express-serve-static-core' {
	interface Request {
		requestId: string; // set by requestIdMiddleware before any route handler runs
		user?: {
			id: string;
			name: string;
			email: string;
			role: 'student' | 'teacher' | 'admin';
			image?: string | null;
			emailVerified: boolean;
		};
		session?: {
			id: string;
			userId: string;
			token: string;
			expiresAt: Date;
		};
	}
}
