import { vi } from 'vitest';
import type { AuthUser } from '../../api/types.js';
import type { AuthContextValue } from '../../context/AuthContext.js';

/**
 * Returns a fully-typed AuthContextValue with sensible defaults.
 * Tests override individual fields: makeAuthContext({ user: teacherUser })
 */
export function makeAuthContext(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  };
}

/** Convenience factory for a student user. */
export function makeStudentUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'user-1',
    name: 'Student',
    email: 's@test.com',
    role: 'student',
    emailVerified: true,
    ...overrides,
  };
}

/** Convenience factory for a teacher user. */
export function makeTeacherUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'user-2',
    name: 'Teacher',
    email: 't@test.com',
    role: 'teacher',
    emailVerified: true,
    ...overrides,
  };
}

/** Convenience factory for an admin user. */
export function makeAdminUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'user-3',
    name: 'Admin',
    email: 'a@test.com',
    role: 'admin',
    emailVerified: true,
    ...overrides,
  };
}
