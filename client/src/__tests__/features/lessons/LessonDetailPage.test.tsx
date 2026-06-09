const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { authClientMock } from '../../mocks/authClient.mock.js';
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.js';
import LessonDetailPage from '../../../features/lessons/LessonDetailPage.js';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/courses/c1/units/u1/lessons/l1']}>
      <AuthProvider>
        <Routes>
          <Route path="/courses/:courseId/units/:unitId/lessons/:lessonId" element={<LessonDetailPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('LessonDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  it('shows loading indicator while data is fetching', () => {
    // Never resolve — component stays in loading state
    apiClientMock.get.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows error message when fetch fails', async () => {
    apiClientMock.get.mockRejectedValue(new Error('Network error'));
    renderPage();
    // useFetch sets error to 'Failed to load' for non-ApiClientError rejections
    await screen.findByText('Failed to load');
  });
});
