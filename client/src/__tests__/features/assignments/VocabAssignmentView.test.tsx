import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VocabAssignmentView from '../../../features/assignments/VocabAssignmentView.js';

describe('VocabAssignmentView', () => {
  it('shows "no terms" message when entries are empty', () => {
    render(<VocabAssignmentView entries={[]} />);
    expect(screen.getByText(/no terms defined/i)).toBeInTheDocument();
  });

  it('renders vocab entries', () => {
    render(
      <VocabAssignmentView
        entries={[
          { term: 'Variable', definition: 'A named storage location.' },
          { term: 'Function', definition: 'A reusable block of code.' },
        ]}
      />,
    );
    expect(screen.getByText('Variable')).toBeInTheDocument();
    expect(screen.getByText('A named storage location.')).toBeInTheDocument();
    expect(screen.getByText('Function')).toBeInTheDocument();
    expect(screen.getByText('A reusable block of code.')).toBeInTheDocument();
  });
});
