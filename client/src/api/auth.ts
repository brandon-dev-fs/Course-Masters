import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:5002',
  basePath: '/api/auth',
  plugins: [adminClient()],
});
