import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityTypePill from '../../../features/builder/ActivityTypePill.js';
import type { AssignmentType } from '../../../api/types.js';

describe('ActivityTypePill', () => {
  it('renders "Note" for type note', () => {
    render(<ActivityTypePill type="note" />);
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  it('renders "Video" for type video', () => {
    render(<ActivityTypePill type="video" />);
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('renders "Link" for type reading', () => {
    render(<ActivityTypePill type="reading" />);
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('renders "Vocab" for type vocab', () => {
    render(<ActivityTypePill type="vocab" />);
    expect(screen.getByText('Vocab')).toBeInTheDocument();
  });

  it('renders "Practice" for type practice_problem', () => {
    render(<ActivityTypePill type="practice_problem" />);
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });

  it('renders "File" for type file', () => {
    render(<ActivityTypePill type="file" />);
    expect(screen.getByText('File')).toBeInTheDocument();
  });

  it('renders a span element', () => {
    const { container } = render(<ActivityTypePill type="note" />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
  });

  const types: AssignmentType[] = ['note', 'video', 'reading', 'vocab', 'practice_problem', 'file'];
  it.each(types)('renders without crashing for type %s', (type) => {
    const { container } = render(<ActivityTypePill type={type} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
