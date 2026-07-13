const { authClientMock } = vi.hoisted(() => ({
  authClientMock: {
    getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    signIn: { email: vi.fn() },
    signUp: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));
const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../api/auth.js', () => ({ authClient: authClientMock }));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import StudentMaterialsModal from '../../../features/student-notes/StudentMaterialsModal.js';
import type { StudentToolType } from '../../../features/student-notes/StudentToolsBar.js';
import type { Assignment, Bookmark } from '../../../api/types.js';

describe('StudentMaterialsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
    // Stub student note fetch
    apiClientMock.get.mockResolvedValue({ note: null });
  });

  it('renders null when closed', () => {
    const { container } = renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={false}
        activeTool="notes"
        availableTools={['notes']}
        onSwitchTool={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders null when activeTool is null', () => {
    const { container } = renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool={null}
        availableTools={['notes']}
        onSwitchTool={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders header when open', async () => {
    renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool="notes"
        availableTools={['notes']}
        onSwitchTool={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(await screen.findByText('Student Materials')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool="notes"
        availableTools={['notes']}
        onSwitchTool={vi.fn()}
        onClose={onClose}
      />,
    );
    await screen.findByText('Student Materials');
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows tool switcher when multiple tools are available', async () => {
    const availableTools: StudentToolType[] = ['notes', 'flashcards'];
    renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool="notes"
        availableTools={availableTools}
        onSwitchTool={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText('Student Materials');
    expect(screen.getByText('Flash Cards')).toBeInTheDocument();
  });

  it('calls onSwitchTool when another tool button is clicked', async () => {
    const onSwitchTool = vi.fn();
    const availableTools: StudentToolType[] = ['notes', 'flashcards'];
    renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool="notes"
        availableTools={availableTools}
        onSwitchTool={onSwitchTool}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText('Student Materials');
    fireEvent.click(screen.getByText('Flash Cards'));
    expect(onSwitchTool).toHaveBeenCalledWith('flashcards');
  });

  it('does not render tool switcher tabs when only one tool is available', async () => {
    renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool="notes"
        availableTools={['notes']}
        onSwitchTool={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText('Student Materials');
    // With a single tool there is no tab row — "Notes" label should not appear as a switch button
    expect(screen.queryByRole('button', { name: /^notes$/i })).not.toBeInTheDocument();
  });

  it('renders bookmarked assignment title when activeTool is bookmarks', async () => {
    const bookmark: Bookmark = { id: 'bm-1', note: 'My note', updatedAt: '2024-01-01T00:00:00Z' };
    const assignment: Assignment = {
      id: 'a-1',
      lessonId: 'l1',
      order: 1,
      title: 'Chapter 3 Reading',
      objective: null,
      type: 'note',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      completed: false,
      bookmark,
      noteAssignment: null,
      videoAssignment: null,
      readingAssignment: null,
      vocabAssignment: null,
      practiceProblemAssignment: null,
      fileAssignment: null,
    };
    renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool="bookmarks"
        availableTools={['bookmarks']}
        onSwitchTool={vi.fn()}
        onClose={vi.fn()}
        assignments={[assignment]}
      />,
    );
    expect(await screen.findByText('Chapter 3 Reading')).toBeInTheDocument();
  });

  it('calls onNavigateToAssignment and onClose when a bookmark item is clicked', async () => {
    const onNavigateToAssignment = vi.fn();
    const onClose = vi.fn();
    const bookmark: Bookmark = { id: 'bm-1', note: '', updatedAt: '2024-01-01T00:00:00Z' };
    const assignment: Assignment = {
      id: 'a-1',
      lessonId: 'l1',
      order: 1,
      title: 'Chapter 3 Reading',
      objective: null,
      type: 'note',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      completed: false,
      bookmark,
      noteAssignment: null,
      videoAssignment: null,
      readingAssignment: null,
      vocabAssignment: null,
      practiceProblemAssignment: null,
      fileAssignment: null,
    };
    renderWithProviders(
      <StudentMaterialsModal
        lessonId="l1"
        isOpen={true}
        activeTool="bookmarks"
        availableTools={['bookmarks']}
        onSwitchTool={vi.fn()}
        onClose={onClose}
        assignments={[assignment]}
        onNavigateToAssignment={onNavigateToAssignment}
      />,
    );
    fireEvent.click(await screen.findByText('Chapter 3 Reading'));
    expect(onNavigateToAssignment).toHaveBeenCalledWith('a-1');
    expect(onClose).toHaveBeenCalled();
  });
});
