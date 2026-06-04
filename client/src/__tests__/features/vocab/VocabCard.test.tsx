const { apiClientMock } = vi.hoisted(() => ({
  apiClientMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock('../../../api/client.js', () => ({
  apiClient: apiClientMock,
  ApiClientError: class ApiClientError extends Error {},
  classifyError: (e: unknown) => String(e),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VocabCard from '../../../features/vocab/VocabCard.js';
import type { LessonTool } from '../../../api/types.js';

const vocabTool: LessonTool = {
  id: 't1',
  type: 'vocab',
  title: 'Variable',
  content: { term: 'Variable', definition: 'A named storage location in memory.' },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

const vocabWithExample: LessonTool = {
  id: 't1',
  type: 'vocab',
  title: 'Variable',
  content: { term: 'Variable', definition: 'A named storage location in memory.', example: 'let x = 5 declares a variable.' },
  order: 1,
  lessonId: 'l1',
  isRequired: false,
};

describe('VocabCard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders without crashing', () => {
    render(<VocabCard vocab={vocabTool} />);
    expect(screen.getByText('Variable')).toBeInTheDocument();
  });

  it('shows the definition', () => {
    render(<VocabCard vocab={vocabTool} />);
    expect(screen.getByText('A named storage location in memory.')).toBeInTheDocument();
  });

  it('shows edit/delete actions when handlers provided', () => {
    render(<VocabCard vocab={vocabTool} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows unsupported message for wrong type', () => {
    const wrongType = { ...vocabTool, type: 'flash_card' } as unknown as LessonTool;
    render(<VocabCard vocab={wrongType} />);
    expect(screen.getByText(/unsupported tool type/i)).toBeInTheDocument();
  });

  it('falls back to vocab.title when content.term is missing (covers ?? branch)', () => {
    const noTerm = { ...vocabTool, content: { definition: 'A storage location.' } } as unknown as LessonTool;
    render(<VocabCard vocab={noTerm} />);
    expect(screen.getByText('Variable')).toBeInTheDocument(); // vocab.title
  });

  it('falls back to empty string when content.definition is missing (covers ?? branch)', () => {
    const noDef = { ...vocabTool, content: { term: 'Variable' } } as unknown as LessonTool;
    render(<VocabCard vocab={noDef} />);
    expect(screen.getByText('Variable')).toBeInTheDocument();
  });

  it('renders example sentence when present', () => {
    render(<VocabCard vocab={vocabWithExample} />);
    expect(screen.getByText('let x = 5 declares a variable.')).toBeInTheDocument();
  });

  it('does not render example block when absent', () => {
    render(<VocabCard vocab={vocabTool} />);
    expect(screen.queryByText(/declares a variable/i)).not.toBeInTheDocument();
  });

  it('does not show bookmark button when onSavedChange is not provided', () => {
    render(<VocabCard vocab={vocabTool} />);
    expect(screen.queryByRole('button', { name: /flashcard/i })).not.toBeInTheDocument();
  });

  it('shows save bookmark button when saved=false and onSavedChange provided', () => {
    render(<VocabCard vocab={vocabTool} saved={false} onSavedChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save to flashcards/i })).toBeInTheDocument();
  });

  it('shows remove bookmark button when saved=true', () => {
    render(<VocabCard vocab={vocabTool} saved={true} onSavedChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /remove from flashcards/i })).toBeInTheDocument();
  });

  it('calls saveVocabFlashCard and onSavedChange when toggling unsaved card', async () => {
    apiClientMock.post.mockResolvedValue(undefined);
    const onSavedChange = vi.fn();
    render(<VocabCard vocab={vocabTool} saved={false} onSavedChange={onSavedChange} />);
    fireEvent.click(screen.getByRole('button', { name: /save to flashcards/i }));
    await waitFor(() => expect(apiClientMock.post).toHaveBeenCalledWith('/tools/t1/vocab-flashcard', {}));
    expect(onSavedChange).toHaveBeenCalledWith('t1', true);
  });

  it('calls removeVocabFlashCard and onSavedChange when toggling saved card', async () => {
    apiClientMock.delete.mockResolvedValue(undefined);
    const onSavedChange = vi.fn();
    render(<VocabCard vocab={vocabTool} saved={true} onSavedChange={onSavedChange} />);
    fireEvent.click(screen.getByRole('button', { name: /remove from flashcards/i }));
    await waitFor(() => expect(apiClientMock.delete).toHaveBeenCalledWith('/tools/t1/vocab-flashcard'));
    expect(onSavedChange).toHaveBeenCalledWith('t1', false);
  });
});
