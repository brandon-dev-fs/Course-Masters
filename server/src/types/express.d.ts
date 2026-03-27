import 'express';

declare module 'express' {
	interface Request {
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
