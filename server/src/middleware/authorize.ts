import { Request, Response, NextFunction } from 'express';

export function authorize(...allowedRoles: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.user) {
			res.status(401).json({
				error: {
					code: 'UNAUTHENTICATED',
					message: 'Authentication required',
				},
			});
			return;
		}
		if (!allowedRoles.includes(req.user.role)) {
			res.status(403).json({
				error: {
					code: 'FORBIDDEN',
					message: 'Insufficient permissions',
				},
			});
			return;
		}
		next();
	};
}
