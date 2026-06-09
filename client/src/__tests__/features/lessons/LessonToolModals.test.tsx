const { lessonToolsApiMock } = vi.hoisted(() => ({
  lessonToolsApiMock: { update: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../api/lesson-tools.js', () => ({ lessonToolsApi: lessonToolsApiMock }));
vi.mock('../../../features/flashcards/FlashCardForm.js', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (data: object) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onSubmit({ front: 'F', back: 'B', order: 1 })}>Submit Flash Card</button>
      <button onClick={onCancel}>Cancel Flash</button>
    </div>
  ),
}));
vi.mock('../../../features/practice-problems/PracticeProblemForm.js', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (data: object) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onSubmit({ question: 'Q?', content: { options: ['a', 'b'], correctIndex: 0 }, calculatorEnabled: false, order: 1 })}>Submit Practice Problem</button>
      <button onClick={onCancel}>Cancel Practice</button>
    </div>
  ),
}));
vi.mock('../../../features/vocab/VocabForm.js', () => ({
  default: ({ onSubmit, onCancel }: { onSubmit: (data: object) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onSubmit({ term: 'T', definition: 'D', order: 1 })}>Submit Vocab</button>
      <button onClick={onCancel}>Cancel Vocab</button>
    </div>
  ),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LessonToolModals from '../../../features/lessons/LessonToolModals.js';
import type { LessonTool } from '../../../api/types.js';

const flashCardTool: LessonTool = {
  id: 't1',
  lessonId: 'l1',
  type: 'flash_card',
  title: 'Flash Card 1',
  order: 1,
  isRequired: false,
  content: { front: 'Q?', back: 'A!' },
};

const practiceProblemTool: LessonTool = {
  id: 't2',
  lessonId: 'l1',
  type: 'practice_problem',
  title: 'Practice 1',
  order: 1,
  isRequired: false,
  content: { question: 'What is 2+2?', options: ['3', '4', '5'], correctIndex: 1 },
};

const vocabTool: LessonTool = {
  id: 't3',
  lessonId: 'l1',
  type: 'vocab',
  title: 'Vocab 1',
  order: 1,
  isRequired: false,
  content: { term: 'Variable', definition: 'Storage location' },
};

describe('LessonToolModals', () => {
  const onClose = vi.fn();
  const onToolUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    lessonToolsApiMock.update.mockResolvedValue(flashCardTool);
    lessonToolsApiMock.delete.mockResolvedValue(undefined);
  });

  it('renders null when canEdit is false', () => {
    const { container } = render(
      <MemoryRouter>
        <LessonToolModals canEdit={false} editingTool={flashCardTool} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders null when editingTool is null', () => {
    const { container } = render(
      <MemoryRouter>
        <LessonToolModals canEdit={true} editingTool={null} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders flash card edit modal', () => {
    render(
      <MemoryRouter>
        <LessonToolModals canEdit={true} editingTool={flashCardTool} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Edit Flash Card')).toBeInTheDocument();
  });

  it('renders practice problem edit modal', () => {
    render(
      <MemoryRouter>
        <LessonToolModals canEdit={true} editingTool={practiceProblemTool} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Edit Practice Problem')).toBeInTheDocument();
  });

  it('renders vocab edit modal', () => {
    render(
      <MemoryRouter>
        <LessonToolModals canEdit={true} editingTool={vocabTool} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Edit Vocab Term')).toBeInTheDocument();
  });

  it('calls lessonToolsApi.update, onToolUpdated, and onClose when flash card form submitted', async () => {
    lessonToolsApiMock.update.mockResolvedValue(flashCardTool);
    render(
      <MemoryRouter>
        <LessonToolModals canEdit={true} editingTool={flashCardTool} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Submit Flash Card'));
    await waitFor(() => expect(lessonToolsApiMock.update).toHaveBeenCalledWith('t1', expect.objectContaining({ content: { front: 'F', back: 'B' } })));
    expect(onToolUpdated).toHaveBeenCalledWith(flashCardTool);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls lessonToolsApi.update, onToolUpdated, and onClose when practice problem form submitted', async () => {
    lessonToolsApiMock.update.mockResolvedValue(practiceProblemTool);
    render(
      <MemoryRouter>
        <LessonToolModals canEdit={true} editingTool={practiceProblemTool} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Submit Practice Problem'));
    await waitFor(() => expect(lessonToolsApiMock.update).toHaveBeenCalledWith('t2', expect.any(Object)));
    expect(onToolUpdated).toHaveBeenCalledWith(practiceProblemTool);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls lessonToolsApi.update, onToolUpdated, and onClose when vocab form submitted', async () => {
    lessonToolsApiMock.update.mockResolvedValue(vocabTool);
    render(
      <MemoryRouter>
        <LessonToolModals canEdit={true} editingTool={vocabTool} onClose={onClose} onToolUpdated={onToolUpdated} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Submit Vocab'));
    await waitFor(() => expect(lessonToolsApiMock.update).toHaveBeenCalledWith('t3', expect.objectContaining({ content: { term: 'T', definition: 'D' } })));
    expect(onToolUpdated).toHaveBeenCalledWith(vocabTool);
    expect(onClose).toHaveBeenCalled();
  });
});
