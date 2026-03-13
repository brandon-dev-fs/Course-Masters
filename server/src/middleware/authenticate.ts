import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export function authenticate() {
	return async (req: Request, res: Response, next: NextFunction) => {
		const session = await auth.api.getSession({
			headers: fromNodeHeaders(req.headers),
		});
		if (!session) {
			res.status(401).json({
				error: {
					code: 'UNAUTHENTICATED',
					message: 'Authentication required',
				},
			});
			return;
		}
		req.user = session.user as typeof req.user & { role: string };
		req.session = session.session;
		next();
	};
}
