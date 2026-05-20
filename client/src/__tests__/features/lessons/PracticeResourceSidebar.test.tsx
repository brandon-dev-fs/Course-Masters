import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PracticeResourceSidebar, { PracticeResourceMobileBar } from '../../../features/lessons/PracticeResourceSidebar.js';

describe('PracticeResourceSidebar', () => {
  const onResourceChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders expand button', () => {
    render(<PracticeResourceSidebar activeResource={null} onResourceChange={onResourceChange} />);
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('toggles to collapsed when expand is clicked', () => {
    render(<PracticeResourceSidebar activeResource={null} onResourceChange={onResourceChange} />);
    const btn = screen.getByLabelText('Expand sidebar');
    fireEvent.click(btn);
    expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
  });

  it('shows Practice label when expanded', () => {
    render(<PracticeResourceSidebar activeResource={null} onResourceChange={onResourceChange} />);
    fireEvent.click(screen.getByLabelText('Expand sidebar'));
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });

  it('calls onResourceChange when Flash Cards is clicked', () => {
    render(<PracticeResourceSidebar activeResource={null} onResourceChange={onResourceChange} />);
    const flashBtn = screen.getAllByTitle('Flash Cards')[0];
    if (flashBtn) {
      fireEvent.click(flashBtn);
      expect(onResourceChange).toHaveBeenCalledWith('flashcards');
    }
  });
});

describe('PracticeResourceMobileBar', () => {
  const onResourceChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Flash Cards and Practice Problems', () => {
    render(<PracticeResourceMobileBar activeResource={null} onResourceChange={onResourceChange} />);
    expect(screen.getByText('Flash Cards')).toBeInTheDocument();
    expect(screen.getByText('Practice Problems')).toBeInTheDocument();
  });

  it('calls onResourceChange when Flash Cards is clicked', () => {
    render(<PracticeResourceMobileBar activeResource={null} onResourceChange={onResourceChange} />);
    fireEvent.click(screen.getByText('Flash Cards'));
    expect(onResourceChange).toHaveBeenCalledWith('flashcards');
  });

  it('calls onResourceChange when Practice Problems is clicked', () => {
    render(<PracticeResourceMobileBar activeResource={null} onResourceChange={onResourceChange} />);
    fireEvent.click(screen.getByText('Practice Problems'));
    expect(onResourceChange).toHaveBeenCalledWith('practice');
  });

  it('highlights active resource', () => {
    render(
      <PracticeResourceMobileBar activeResource="flashcards" onResourceChange={onResourceChange} />,
    );
    const btn = screen.getByText('Flash Cards').closest('button');
    expect(btn?.className).toContain('text-primary');
  });
});
