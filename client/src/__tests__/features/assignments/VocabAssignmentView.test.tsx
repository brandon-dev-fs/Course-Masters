import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VocabAssignmentView from '../../../features/assignments/VocabAssignmentView.js';

// Mock auth context so component does not attempt to fetch saved flashcards
vi.mock('../../../context/AuthContext.js', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

// Mock assignments API
vi.mock('../../../api/assignments.js', () => ({
  assignmentsApi: {
    getSavedVocabEntryFlashCards: vi.fn().mockResolvedValue([]),
  },
}));

describe('VocabAssignmentView', () => {
  it('shows "no terms" message when entries are empty', () => {
    render(<VocabAssignmentView entries={[]} lessonId="lesson-1" />);
    expect(screen.getByText(/no terms defined/i)).toBeInTheDocument();
  });

  it('renders vocab entries', () => {
    render(
      <VocabAssignmentView
        lessonId="lesson-1"
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
