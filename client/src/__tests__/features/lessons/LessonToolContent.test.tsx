const { lessonToolsApiMock } = vi.hoisted(() => ({
  lessonToolsApiMock: { update: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/lesson-tools.js', () => ({ lessonToolsApi: lessonToolsApiMock }));
vi.mock('../../../features/flashcards/FlashCard.js', () => ({
  default: ({ card, onUpdate, onDelete }: { card: { id: string; content: { front: string } }; onUpdate?: (id: string, data: object) => void; onDelete?: () => void }) => (
    <div>
      <span>{card.content.front}</span>
      {onUpdate && <button onClick={() => onUpdate(card.id, { front: 'Updated', back: 'B' })}>Update Card</button>}
      {onDelete && <button onClick={onDelete}>Delete Card</button>}
    </div>
  ),
}));
vi.mock('../../../features/practice-problems/PracticeProblemCard.js', () => ({
  default: ({ problem, onEdit, onDelete }: { problem: { content: { question: string } }; onEdit?: () => void; onDelete?: () => void }) => (
    <div>
      <span>{problem.content.question}</span>
      {onEdit && <button onClick={onEdit}>Edit Problem</button>}
      {onDelete && <button onClick={onDelete}>Delete Problem</button>}
    </div>
  ),
}));
vi.mock('../../../features/vocab/VocabCard.js', () => ({
  default: ({ vocab, onEdit, onDelete }: { vocab: { content: { term: string } }; onEdit?: () => void; onDelete?: () => void }) => (
    <div>
      <span>{vocab.content.term}</span>
      {onEdit && <button onClick={onEdit}>Edit Vocab</button>}
      {onDelete && <button onClick={onDelete}>Delete Vocab</button>}
    </div>
  ),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LessonToolContent from '../../../features/lessons/LessonToolContent.js';
import type { LessonTool } from '../../../api/types.js';

const flashCardTool: LessonTool = {
  id: 't1',
  lessonId: 'l1',
  type: 'flash_card',
  title: 'Flash Card 1',
  order: 1,
  isRequired: false,
  content: { front: 'Question?', back: 'Answer!' },
};

const practiceProblemTool: LessonTool = {
  id: 't2',
  lessonId: 'l1',
  type: 'practice_problem',
  title: 'Practice 1',
  order: 2,
  isRequired: false,
  content: { question: 'What is 2+2?', options: ['3', '4', '5'], correctIndex: 1 },
};

const vocabTool: LessonTool = {
  id: 't3',
  lessonId: 'l1',
  type: 'vocab',
  title: 'Vocab 1',
  order: 3,
  isRequired: false,
  content: { term: 'Variable', definition: 'A named storage location' },
};

const updatedTool: LessonTool = { ...flashCardTool, content: { front: 'Updated', back: 'B' } };

describe('LessonToolContent', () => {
  const onEditRequest = vi.fn();
  const onDeleted = vi.fn();
  const onToolUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    lessonToolsApiMock.update.mockResolvedValue(updatedTool);
    lessonToolsApiMock.delete.mockResolvedValue(undefined);
  });

  it('renders flash card content', () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={flashCardTool} canEdit={false} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Question?')).toBeInTheDocument();
  });

  it('renders practice problem content', () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={practiceProblemTool} canEdit={false} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
  });

  it('renders vocab content', () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={vocabTool} canEdit={false} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Variable')).toBeInTheDocument();
  });

  it('renders null for unknown tool type', () => {
    const unknownTool = { ...flashCardTool, type: 'unknown' as 'flash_card' };
    const { container } = render(
      <MemoryRouter>
        <LessonToolContent tool={unknownTool} canEdit={false} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls lessonToolsApi.update and onToolUpdated when flash card updated', async () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={flashCardTool} canEdit={true} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Update Card'));
    await waitFor(() => expect(lessonToolsApiMock.update).toHaveBeenCalledWith('t1', expect.objectContaining({ content: { front: 'Updated', back: 'B' } })));
    expect(onToolUpdated).toHaveBeenCalledWith(updatedTool);
  });

  it('calls lessonToolsApi.delete and onDeleted when flash card deleted', async () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={flashCardTool} canEdit={true} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Delete Card'));
    await waitFor(() => expect(lessonToolsApiMock.delete).toHaveBeenCalledWith('t1'));
    expect(onDeleted).toHaveBeenCalledWith('t1');
  });

  it('calls onEditRequest when practice problem edit clicked', () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={practiceProblemTool} canEdit={true} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Edit Problem'));
    expect(onEditRequest).toHaveBeenCalledWith(practiceProblemTool);
  });

  it('calls lessonToolsApi.delete and onDeleted when practice problem deleted', async () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={practiceProblemTool} canEdit={true} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Delete Problem'));
    await waitFor(() => expect(lessonToolsApiMock.delete).toHaveBeenCalledWith('t2'));
    expect(onDeleted).toHaveBeenCalledWith('t2');
  });

  it('calls onEditRequest when vocab edit clicked', () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={vocabTool} canEdit={true} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Edit Vocab'));
    expect(onEditRequest).toHaveBeenCalledWith(vocabTool);
  });

  it('calls lessonToolsApi.delete and onDeleted when vocab deleted', async () => {
    render(
      <MemoryRouter>
        <LessonToolContent tool={vocabTool} canEdit={true} onEditRequest={onEditRequest} onDeleted={onDeleted} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Delete Vocab'));
    await waitFor(() => expect(lessonToolsApiMock.delete).toHaveBeenCalledWith('t3'));
    expect(onDeleted).toHaveBeenCalledWith('t3');
  });
});
