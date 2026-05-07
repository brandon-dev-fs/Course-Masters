import { Request, Response, NextFunction } from 'express';

/**
 * Wraps every successful res.json() call in { data: payload }.
 * Error responses carrying a top-level `error` key pass through unchanged,
 * preventing double-wrapping by the centralized errorHandler.
 * 204 responses use res.send() and never invoke res.json(), so they are
 * naturally excluded.
 */
export function envelopeMiddleware(_req: Request, res: Response, next: NextFunction): void {
	const originalJson = res.json.bind(res);

	res.json = function (payload: unknown): Response {
		// Do not wrap error responses — they carry { error: { code, message } }
		if (
			payload !== null &&
			typeof payload === 'object' &&
			'error' in (payload as object)
		) {
			return originalJson(payload);
		}
		return originalJson({ data: payload });
	};

	next();
}
