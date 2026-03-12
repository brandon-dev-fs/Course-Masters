import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import prisma from './prisma.js';
import { config } from '../config.js';

const statement = {
	course: ['create', 'update', 'delete'],
	content: ['create', 'update', 'delete'],
	user: ['manage', 'assign-role'],
} as const;

const ac = createAccessControl(statement);

const student = ac.newRole({
	course: [],
	content: [],
	user: [],
});

const teacher = ac.newRole({
	course: ['create', 'update', 'delete'],
	content: ['create', 'update', 'delete'],
	user: [],
});

const adminRole = ac.newRole({
	course: ['create', 'update', 'delete'],
	content: ['create', 'update', 'delete'],
	user: ['manage', 'assign-role'],
});

export const auth = betterAuth({
	secret: config.BETTER_AUTH_SECRET,
	baseURL: `http://localhost:${config.SERVER_PORT}`,
	basePath: '/api/auth',
	trustedOrigins: ['http://localhost:5000'],
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	emailAndPassword: { enabled: true },
	plugins: [
		admin({
			ac,
			roles: { student, teacher, admin: adminRole },
			defaultRole: 'student',
		}),
	],
});

export type Auth = typeof auth;
