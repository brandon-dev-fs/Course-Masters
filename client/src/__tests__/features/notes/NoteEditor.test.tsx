const { lessonResourcesApiMock } = vi.hoisted(() => ({
  lessonResourcesApiMock: { update: vi.fn() },
}));
vi.mock('../../../api/lesson-resources.js', () => ({ lessonResourcesApi: lessonResourcesApiMock }));

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
vi.mock('../../../components/RichTextEditor.js', () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeTeacherUser } from '../../mocks/authContext.mock.js';
import NoteEditor from '../../../features/notes/NoteEditor.js';
import type { LessonResource } from '../../../api/types.js';

const noteResource: LessonResource = {
  id: 'r1',
  type: 'note',
  title: 'My Note',
  content: { body: { type: 'doc', content: [] } },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

const lectureResource: LessonResource = {
  ...noteResource,
  id: 'r2',
  type: 'lecture',
  title: 'My Lecture',
};

const videoResource: LessonResource = {
  id: 'r3',
  type: 'video',
  title: 'My Video',
  content: { url: 'https://youtube.com/watch?v=abc' },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

describe('NoteEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
  });

  it('renders note title', async () => {
    renderWithProviders(<NoteEditor note={noteResource} />);
    expect(await screen.findByText('My Note')).toBeInTheDocument();
  });

  it('renders lecture title', async () => {
    renderWithProviders(<NoteEditor note={lectureResource} />);
    expect(await screen.findByText('My Lecture')).toBeInTheDocument();
  });

  it('shows unsupported type for video resource', async () => {
    renderWithProviders(<NoteEditor note={videoResource} />);
    expect(await screen.findByText(/unsupported resource type/i)).toBeInTheDocument();
  });

  it('shows edit button for teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<NoteEditor note={noteResource} />);
    expect(await screen.findByText('Edit')).toBeInTheDocument();
  });

  it('does not show edit button for student', async () => {
    renderWithProviders(<NoteEditor note={noteResource} />);
    await screen.findByText('My Note');
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('switches to edit mode when edit is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<NoteEditor note={noteResource} />);
    fireEvent.click(await screen.findByText('Edit'));
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('starts in editing mode when initialEditing is true', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<NoteEditor note={noteResource} initialEditing={true} />);
    expect(await screen.findByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('shows toggle completion when onToggleComplete is provided', async () => {
    renderWithProviders(
      <NoteEditor note={noteResource} isComplete={false} onToggleComplete={vi.fn()} />,
    );
    await screen.findByText('My Note');
    // ResourceCompletionCheckbox is rendered
    expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument();
  });

  it('cancels editing on cancel click', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<NoteEditor note={noteResource} initialEditing={true} />);
    fireEvent.click(await screen.findByText('Cancel'));
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('calls lessonResourcesApi.update when save is clicked', async () => {
    lessonResourcesApiMock.update.mockResolvedValue(noteResource);
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<NoteEditor note={noteResource} initialEditing={true} />);
    fireEvent.click(await screen.findByText('Save'));
    await waitFor(() => expect(lessonResourcesApiMock.update).toHaveBeenCalledWith('r1', expect.any(Object)));
  });

  it('shows error message when save fails', async () => {
    lessonResourcesApiMock.update.mockRejectedValue(new Error('Save failed'));
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<NoteEditor note={noteResource} initialEditing={true} />);
    fireEvent.click(await screen.findByText('Save'));
    await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
  });

  it('changing title input updates value', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<NoteEditor note={noteResource} initialEditing={true} />);
    const titleInput = await screen.findByDisplayValue('My Note');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument();
  });
});
