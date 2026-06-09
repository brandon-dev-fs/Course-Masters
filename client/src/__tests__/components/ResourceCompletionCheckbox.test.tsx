import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResourceCompletionCheckbox from '../../components/ResourceCompletionCheckbox.js';

describe('ResourceCompletionCheckbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Mark as complete" when not complete', () => {
    render(<ResourceCompletionCheckbox isComplete={false} onToggle={vi.fn()} />);
    expect(screen.getByText('Mark as complete')).toBeInTheDocument();
  });

  it('renders "Completed" when complete', () => {
    render(<ResourceCompletionCheckbox isComplete={true} onToggle={vi.fn()} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ResourceCompletionCheckbox isComplete={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('calls onToggle when already complete and clicked', () => {
    const onToggle = vi.fn();
    render(<ResourceCompletionCheckbox isComplete={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
