import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

describe('VocabCard', () => {
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
});
