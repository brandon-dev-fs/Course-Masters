import { z } from 'zod';

const envSchema = z.object({
	DATABASE_URL: z.string().min(1),
	SERVER_PORT: z.coerce.number().default(5002),
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	BETTER_AUTH_SECRET: z.string().min(32),
	CLIENT_URL: z.string().url().default('http://localhost:5000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error('❌ Invalid environment variables:');
	console.error(parsed.error.flatten().fieldErrors);
	process.exit(1);
}

export const config = parsed.data;
