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
vi.mock('../../../features/vocab/VocabForm.js', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (data: object) => void; onCancel: () => void }) => (
    <div data-testid="vocab-form">
      <button onClick={() => onSubmit({ term: 'NewTerm', definition: 'NewDef', order: 1 })}>Submit Vocab</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  ),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../setup/renderWithProviders.js';
import { makeTeacherUser } from '../../mocks/authContext.mock.js';
import VocabList from '../../../features/vocab/VocabList.js';
import type { Assignment } from '../../../api/types.js';

const vocabAssignment: Assignment = {
  id: 't1',
  lessonId: 'l1',
  order: 1,
  title: 'Variable',
  objective: null,
  type: 'vocab',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  completed: false,
  bookmark: null,
  noteAssignment: null,
  videoAssignment: null,
  readingAssignment: null,
  practiceProblemAssignment: null,
  fileAssignment: null,
  vocabAssignment: {
    id: 'va1',
    entries: [{ id: 'e1', term: 'Variable', definition: 'A named storage location in memory.' }],
  },
};

describe('VocabList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authClientMock.getSession.mockResolvedValue({ data: null, error: null });
    apiClientMock.get.mockResolvedValue([]);
  });

  it('renders without crashing', async () => {
    renderWithProviders(<VocabList lessonId="l1" />);
    expect(await screen.findByText(/no vocabulary yet/i)).toBeInTheDocument();
  });

  it('shows vocab cards when data is available', async () => {
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    expect(await screen.findByText('Variable')).toBeInTheDocument();
  });

  it('shows add term button for teacher with items', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    expect(await screen.findByRole('button', { name: /\+ add term/i })).toBeInTheDocument();
  });

  it('does not show add button for student', async () => {
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText(/no vocabulary yet/i);
    expect(screen.queryByRole('button', { name: /\+ add term/i })).not.toBeInTheDocument();
  });

  it('opens add modal when add term button clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    fireEvent.click(await screen.findByRole('button', { name: /\+ add term/i }));
    expect(screen.getByText('Add Vocabulary Term')).toBeInTheDocument();
  });

  it('opens add modal from empty state action for teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText(/no vocabulary yet/i);
    // Toolbar + EmptyState action both show for teacher + empty state
    fireEvent.click(screen.getAllByRole('button', { name: /\+ add term/i })[0]);
    expect(screen.getByText('Add Vocabulary Term')).toBeInTheDocument();
  });

  it('shows edit/delete buttons on vocab cards for teacher', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText('Variable');
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('opens edit modal when edit button clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText('Variable');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByText('Edit Vocabulary Term')).toBeInTheDocument();
  });

  it('shows delete confirmation when delete button clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText('Variable');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByText('Delete Term')).toBeInTheDocument();
  });

  it('submits add form and calls create API', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    apiClientMock.post.mockResolvedValue({ ...vocabAssignment, id: 't2' });
    renderWithProviders(<VocabList lessonId="l1" />);
    fireEvent.click(await screen.findByRole('button', { name: /\+ add term/i }));
    fireEvent.click(screen.getByText('Submit Vocab'));
    await waitFor(() => expect(apiClientMock.post).toHaveBeenCalled());
  });

  it('closes add modal when form cancel is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    fireEvent.click(await screen.findByRole('button', { name: /\+ add term/i }));
    expect(screen.getByTestId('vocab-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel Form'));
    expect(screen.queryByTestId('vocab-form')).not.toBeInTheDocument();
  });

  it('submits edit form and calls update API', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    apiClientMock.put.mockResolvedValue(vocabAssignment);
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText('Variable');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.click(screen.getByText('Submit Vocab'));
    await waitFor(() => expect(apiClientMock.put).toHaveBeenCalled());
  });

  it('closes edit modal when form cancel is clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText('Variable');
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByTestId('vocab-form')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel Form'));
    expect(screen.queryByTestId('vocab-form')).not.toBeInTheDocument();
  });

  it('calls delete API when confirm delete clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    apiClientMock.delete.mockResolvedValue(undefined);
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText('Variable');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(apiClientMock.delete).toHaveBeenCalled());
  });

  it('closes delete dialog when cancel clicked', async () => {
    authClientMock.getSession.mockResolvedValue({ data: { user: makeTeacherUser() }, error: null });
    apiClientMock.get.mockResolvedValue([vocabAssignment]);
    renderWithProviders(<VocabList lessonId="l1" />);
    await screen.findByText('Variable');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
