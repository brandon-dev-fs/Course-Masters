import { Request, Response, NextFunction } from 'express';

/**
 * Wraps every successful res.json() call in { data: payload }.
 * Error responses (statusCode >= 400) pass through unchanged,
 * preventing double-wrapping by the centralized errorHandler.
 * 204 responses use res.send() and never invoke res.json(), so they are
 * naturally excluded.
 */
export function envelopeMiddleware(_req: Request, res: Response, next: NextFunction): void {
	const originalJson = res.json.bind(res);

	res.json = function (payload: unknown): Response {
		// Do not wrap error responses — keyed off HTTP status to avoid fragile
		// payload inspection (e.g. a 200 body with an 'error' field would skip wrapping)
		if (res.statusCode >= 400) {
			return originalJson(payload);
		}
		return originalJson({ data: payload });
	};

	next();
}
