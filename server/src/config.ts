import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string().min(1),
	SERVER_PORT: z.coerce.number().default(5002),
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	BETTER_AUTH_SECRET: z.string().min(32),
	CLIENT_URL: z.string().url().default('http://localhost:5000'),
	LOG_LEVEL: z
		.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
		.default('info'),
	S3_ENDPOINT: z.string().url().optional(),
	S3_BUCKET: z.string().optional().transform(v => v || undefined),
	S3_ACCESS_KEY_ID: z.string().optional().transform(v => v || undefined),
	S3_SECRET_ACCESS_KEY: z.string().optional().transform(v => v || undefined),
	S3_REGION: z.string().min(1).default('garage'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	// Cannot use logger here — logger depends on config, which hasn't finished
	// initializing. Write directly to stderr to avoid circular dependency.
	process.stderr.write('Invalid environment variables:\n');
	process.stderr.write(JSON.stringify(parsed.error.flatten().fieldErrors) + '\n');
	process.exit(1);
}

export const config = parsed.data;
