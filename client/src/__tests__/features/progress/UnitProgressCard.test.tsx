const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../api/client.js', () => ({ apiClient: apiClientMock }));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import UnitProgressCard from '../../../features/progress/UnitProgressCard.js';

describe('UnitProgressCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while loading (no progress)', () => {
    // API resolves after render; initially null → nothing shown
    apiClientMock.get.mockResolvedValue({
      percentComplete: 0,
      completedLessons: 0,
      totalLessons: 5,
      testPassed: false,
    });
    const { container } = render(<UnitProgressCard courseId="c1" unitId="u1" />);
    // Before promise resolves, component returns null
    expect(container.firstChild).toBeNull();
  });

  it('shows progress once data resolves', async () => {
    apiClientMock.get.mockResolvedValue({
      percentComplete: 60,
      completedLessons: 3,
      totalLessons: 5,
      testPassed: false,
    });
    render(<UnitProgressCard courseId="c1" unitId="u1" />);
    expect(await screen.findByText('Unit Progress')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows test passed status', async () => {
    apiClientMock.get.mockResolvedValue({
      percentComplete: 100,
      completedLessons: 5,
      totalLessons: 5,
      testPassed: true,
    });
    render(<UnitProgressCard courseId="c1" unitId="u1" />);
    expect(await screen.findByText('✓ Passed')).toBeInTheDocument();
  });
});
