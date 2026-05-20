const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../api/client.js', () => ({ apiClient: { get: vi.fn().mockResolvedValue(undefined), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../api/assessments.js', () => ({
  assessmentsApi: {
    getUnitQuiz: vi.fn().mockResolvedValue(null),
    getCourseExam: vi.fn().mockResolvedValue(null),
    createUnitQuiz: vi.fn(),
    createCourseExam: vi.fn(),
    update: vi.fn(),
    submitAttempt: vi.fn(),
    getAttempts: vi.fn().mockResolvedValue([]),
  },
}));

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext.js';
import { makeAuthContext, makeStudentUser } from '../../mocks/authContext.mock.js';
import UnitCardStrip from '../../../features/units/UnitCardStrip.js';
import type { Unit } from '../../../api/types.js';

const unit1: Unit = {
  id: 'u1',
  title: 'Unit One',
  description: '',
  order: 1,
  courseId: 'c1',
  lessons: [],
};
const unit2: Unit = {
  id: 'u2',
  title: 'Unit Two',
  description: '',
  order: 2,
  courseId: 'c1',
  lessons: [],
};

describe('UnitCardStrip', () => {
  it('shows empty state when no units', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: makeStudentUser() })}>
          <UnitCardStrip courseId="c1" units={[]} canEdit={false} progress={null} />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('No units yet')).toBeInTheDocument();
  });

  it('shows teacher-specific empty state when canEdit is true', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: makeStudentUser() })}>
          <UnitCardStrip courseId="c1" units={[]} canEdit={true} progress={null} />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText(/add a unit/i)).toBeInTheDocument();
  });

  it('renders unit cards for each unit', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={makeAuthContext({ user: makeStudentUser() })}>
          <UnitCardStrip courseId="c1" units={[unit1, unit2]} canEdit={false} progress={null} />
        </AuthContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Unit One')).toBeInTheDocument();
    expect(screen.getByText('Unit Two')).toBeInTheDocument();
  });
});
