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
vi.mock('../../../features/videos/VideoForm.js', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (data: object) => void; onCancel: () => void }) => (
    <div data-testid="video-form">
      <button onClick={() => onSubmit({ title: 'Test Video', url: 'https://youtube.com/watch?v=abc', order: 1 })}>Submit Video</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}));
vi.mock('../../../features/videos/VideoCard.js', () => ({
  default: ({ video, onEdit, onDelete }: { video: { title: string }; onEdit?: () => void; onDelete?: () => void }) => (
    <div>
      <span>{video.title}</span>
      {onEdit && <button onClick={onEdit}>Edit Video</button>}
      {onDelete && <button onClick={onDelete}>Delete Video</button>}
    </div>
  ),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeTeacherUser } from '../../mocks/authContext.mock.js';
import VideoList from '../../../features/videos/VideoList.js';

const makeVideo = (id: string, title: string, order: number) => ({
  id,
  type: 'video',
  title,
  content: { url: `https://youtube-nocookie.com/embed/${id}` },
  order,
  lessonId: 'l1',
  isRequired: false,
});

describe('VideoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
  });

  it('renders without crashing with empty list', async () => {
    renderWithProviders(<VideoList lessonId="l1" />);
    expect(await screen.findByText(/no videos yet/i)).toBeInTheDocument();
  });

  it('shows a video card when data exists', async () => {
    apiClientMock.get.mockResolvedValue([makeVideo('r1', 'Python Intro', 1)]);
    renderWithProviders(<VideoList lessonId="l1" />);
    expect(await screen.findByText('Python Intro')).toBeInTheDocument();
  });

  it('shows add video button for teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText(/no videos yet/i);
    // Toolbar + EmptyState action both render for teacher + empty state
    expect(screen.getAllByRole('button', { name: /\+ add video/i }).length).toBeGreaterThan(0);
  });

  it('does not show add video button for student', async () => {
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText(/no videos yet/i);
    expect(screen.queryByRole('button', { name: /\+ add video/i })).not.toBeInTheDocument();
  });

  it('shows navigation when multiple videos exist', async () => {
    apiClientMock.get.mockResolvedValue([
      makeVideo('r1', 'Video One', 1),
      makeVideo('r2', 'Video Two', 2),
    ]);
    renderWithProviders(<VideoList lessonId="l1" />);
    expect(await screen.findByText('1 / 2')).toBeInTheDocument();
  });

  it('previous button is disabled on first video', async () => {
    apiClientMock.get.mockResolvedValue([
      makeVideo('r1', 'Video One', 1),
      makeVideo('r2', 'Video Two', 2),
    ]);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('1 / 2');
    const prevBtn = screen.getByRole('button', { name: /previous video/i });
    expect(prevBtn).toBeDisabled();
  });

  it('navigates to next video when next button clicked', async () => {
    apiClientMock.get.mockResolvedValue([
      makeVideo('r1', 'Video One', 1),
      makeVideo('r2', 'Video Two', 2),
    ]);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('1 / 2');
    fireEvent.click(screen.getByRole('button', { name: /next video/i }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('Video Two')).toBeInTheDocument();
  });

  it('navigates back to previous video when prev button clicked', async () => {
    apiClientMock.get.mockResolvedValue([
      makeVideo('r1', 'Video One', 1),
      makeVideo('r2', 'Video Two', 2),
    ]);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('1 / 2');
    fireEvent.click(screen.getByRole('button', { name: /next video/i }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /previous video/i }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Video One')).toBeInTheDocument();
  });

  it('shows add video modal when button is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText(/no videos yet/i);
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add video/i })[0]);
    expect(screen.getByTestId('video-form')).toBeInTheDocument();
  });

  it('submits add form and calls create API', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.post.mockResolvedValue(makeVideo('r2', 'Test Video', 2));
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText(/no videos yet/i);
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add video/i })[0]);
    fireEvent.click(screen.getByText('Submit Video'));
    await waitFor(() => expect(apiClientMock.post).toHaveBeenCalled());
  });

  it('closes add modal when form cancel is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText(/no videos yet/i);
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add video/i })[0]);
    fireEvent.click(screen.getByText('Cancel Form'));
    expect(screen.queryByTestId('video-form')).not.toBeInTheDocument();
  });

  it('opens edit modal when edit button clicked on video card', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([makeVideo('r1', 'Python Intro', 1)]);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('Python Intro');
    fireEvent.click(screen.getByText('Edit Video'));
    expect(screen.getByTestId('video-form')).toBeInTheDocument();
  });

  it('submits edit form and calls update API', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([makeVideo('r1', 'Python Intro', 1)]);
    apiClientMock.put.mockResolvedValue(makeVideo('r1', 'Test Video', 1));
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('Python Intro');
    fireEvent.click(screen.getByText('Edit Video'));
    fireEvent.click(screen.getByText('Submit Video'));
    await waitFor(() => expect(apiClientMock.put).toHaveBeenCalled());
  });

  it('closes edit modal when form cancel is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([makeVideo('r1', 'Python Intro', 1)]);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('Python Intro');
    fireEvent.click(screen.getByText('Edit Video'));
    fireEvent.click(screen.getByText('Cancel Form'));
    expect(screen.queryByTestId('video-form')).not.toBeInTheDocument();
  });

  it('shows delete confirm when delete button clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([makeVideo('r1', 'Python Intro', 1)]);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('Python Intro');
    fireEvent.click(screen.getByText('Delete Video'));
    expect(screen.getByText(/Delete "Python Intro"\?/)).toBeInTheDocument();
  });

  it('calls delete API when confirm delete clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([makeVideo('r1', 'Python Intro', 1)]);
    apiClientMock.delete.mockResolvedValue(undefined);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('Python Intro');
    fireEvent.click(screen.getByText('Delete Video'));
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(apiClientMock.delete).toHaveBeenCalled());
  });

  it('closes delete dialog when cancel clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([makeVideo('r1', 'Python Intro', 1)]);
    renderWithProviders(<VideoList lessonId="l1" />);
    await screen.findByText('Python Intro');
    fireEvent.click(screen.getByText('Delete Video'));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
