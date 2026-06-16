import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PracticeResourceSidebar, { PracticeResourceMobileBar } from '../../../features/lessons/PracticeResourceSidebar.js';

function renderSidebar(props: Partial<React.ComponentProps<typeof PracticeResourceSidebar>> = {}) {
  const defaults = {
    activeResource: null as string | null,
    onResourceChange: vi.fn(),
  };
  return render(<PracticeResourceSidebar {...defaults} {...props} />);
}

function renderMobileBar(props: Partial<React.ComponentProps<typeof PracticeResourceMobileBar>> = {}) {
  const defaults = {
    activeResource: null as string | null,
    onResourceChange: vi.fn(),
  };
  return render(<PracticeResourceMobileBar {...defaults} {...props} />);
}

describe('PracticeResourceMobileBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both practice item labels', () => {
    renderMobileBar();
    expect(screen.getByText('Flash Cards')).toBeTruthy();
    expect(screen.getByText('Practice Problems')).toBeTruthy();
  });

  it('renders two buttons', () => {
    renderMobileBar();
    expect(screen.getAllByRole('button').length).toBe(2);
  });

  it('applies active styling to the active item (flashcards)', () => {
    renderMobileBar({ activeResource: 'flashcards' });
    const flashcardsBtn = screen.getByRole('button', { name: /Flash Cards/i });
    expect(flashcardsBtn.className).toContain('bg-primary-subtle');
  });

  it('applies active styling to the active item (practice)', () => {
    renderMobileBar({ activeResource: 'practice' });
    const practiceBtn = screen.getByRole('button', { name: /Practice Problems/i });
    expect(practiceBtn.className).toContain('bg-primary-subtle');
  });

  it('does not apply active styling when no item is active', () => {
    renderMobileBar({ activeResource: null });
    screen.getAllByRole('button').forEach(btn => {
      expect(btn.className).not.toContain('bg-primary-subtle');
    });
  });

  it('does not apply active styling to the inactive item', () => {
    renderMobileBar({ activeResource: 'flashcards' });
    const practiceBtn = screen.getByRole('button', { name: /Practice Problems/i });
    expect(practiceBtn.className).not.toContain('bg-primary-subtle');
  });

  it('calls onResourceChange with "flashcards" when Flash Cards is clicked', () => {
    const onResourceChange = vi.fn();
    renderMobileBar({ onResourceChange });
    fireEvent.click(screen.getByRole('button', { name: /Flash Cards/i }));
    expect(onResourceChange).toHaveBeenCalledWith('flashcards');
  });

  it('calls onResourceChange with "practice" when Practice Problems is clicked', () => {
    const onResourceChange = vi.fn();
    renderMobileBar({ onResourceChange });
    fireEvent.click(screen.getByRole('button', { name: /Practice Problems/i }));
    expect(onResourceChange).toHaveBeenCalledWith('practice');
  });
});

describe('PracticeResourceSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an aside element', () => {
    renderSidebar();
    expect(document.querySelector('aside')).toBeTruthy();
  });

  it('renders a toggle button with "Expand sidebar" label when collapsed', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeTruthy();
  });

  it('does not show "Practice" heading when collapsed', () => {
    renderSidebar();
    expect(screen.queryByText('Practice')).toBeNull();
  });

  it('does not show item labels in collapsed state', () => {
    renderSidebar();
    expect(screen.queryByText('Flash Cards')).toBeNull();
    expect(screen.queryByText('Practice Problems')).toBeNull();
  });

  it('shows "Collapse sidebar" label after clicking expand', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeTruthy();
  });

  it('shows "Practice" heading after expanding', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    expect(screen.getByText('Practice')).toBeTruthy();
  });

  it('shows item labels after expanding', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    expect(screen.getByText('Flash Cards')).toBeTruthy();
    expect(screen.getByText('Practice Problems')).toBeTruthy();
  });

  it('collapses back when toggle is clicked again', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }));
    expect(screen.queryByText('Practice')).toBeNull();
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeTruthy();
  });

  it('applies active styling to active item in collapsed mode', () => {
    renderSidebar({ activeResource: 'flashcards' });
    // In collapsed mode, items have title attributes
    const flashcardsBtn = screen.getByTitle('Flash Cards');
    expect(flashcardsBtn.className).toContain('bg-primary-subtle');
  });

  it('applies active styling to active item in expanded mode', () => {
    renderSidebar({ activeResource: 'practice' });
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    const practiceBtn = screen.getByRole('button', { name: /Practice Problems/i });
    expect(practiceBtn.className).toContain('bg-primary-subtle');
  });

  it('calls onResourceChange when a practice item is clicked (collapsed)', () => {
    const onResourceChange = vi.fn();
    renderSidebar({ onResourceChange });
    fireEvent.click(screen.getByTitle('Flash Cards'));
    expect(onResourceChange).toHaveBeenCalledWith('flashcards');
  });

  it('calls onResourceChange when a practice item is clicked (expanded)', () => {
    const onResourceChange = vi.fn();
    renderSidebar({ onResourceChange });
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Practice Problems/i }));
    expect(onResourceChange).toHaveBeenCalledWith('practice');
  });

  it('has the correct width class when expanded', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }));
    const aside = document.querySelector('aside')!;
    expect(aside.className).toContain('w-64');
  });

  it('has the collapsed width class when not expanded', () => {
    renderSidebar();
    const aside = document.querySelector('aside')!;
    expect(aside.className).toContain('w-14');
  });
});
