import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VocabCard from '../../../features/vocab/VocabCard.js';

const vocabEntry = {
  term: 'Variable',
  definition: 'A named storage location in memory.',
};

const vocabEntryWithExample = {
  term: 'Variable',
  definition: 'A named storage location in memory.',
  example: 'let x = 5 declares a variable.',
};

describe('VocabCard', () => {
  it('renders without crashing', () => {
    render(<VocabCard vocab={vocabEntry} />);
    expect(screen.getByText('Variable')).toBeInTheDocument();
  });

  it('shows the definition', () => {
    render(<VocabCard vocab={vocabEntry} />);
    expect(screen.getByText('A named storage location in memory.')).toBeInTheDocument();
  });

  it('shows edit/delete actions when handlers provided', () => {
    render(<VocabCard vocab={vocabEntry} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('does not show edit/delete actions when handlers are not provided', () => {
    render(<VocabCard vocab={vocabEntry} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('renders example sentence when present', () => {
    render(<VocabCard vocab={vocabEntryWithExample} />);
    expect(screen.getByText('let x = 5 declares a variable.')).toBeInTheDocument();
  });

  it('does not render example block when absent', () => {
    render(<VocabCard vocab={vocabEntry} />);
    expect(screen.queryByText(/declares a variable/i)).not.toBeInTheDocument();
  });
});
