import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSegmentedControl from '../../../features/auth/ThemeSegmentedControl.js';
import type { ThemePreference } from '../../../api/types.js';

describe('ThemeSegmentedControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a radiogroup', () => {
    render(<ThemeSegmentedControl value="light" onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('has aria-label "Theme preference"', () => {
    render(<ThemeSegmentedControl value="light" onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Theme preference');
  });

  it('renders all three segment options', () => {
    render(<ThemeSegmentedControl value="light" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /Light/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Dark/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /System/i })).toBeInTheDocument();
  });

  it('marks the active segment as aria-checked="true"', () => {
    render(<ThemeSegmentedControl value="dark" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /Dark/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Light/i })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /System/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('marks the active segment as tabIndex=0 and others as -1', () => {
    render(<ThemeSegmentedControl value="system" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /System/i })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: /Light/i })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: /Dark/i })).toHaveAttribute('tabindex', '-1');
  });

  it('calls onChange with the segment value when clicked', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="light" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /Dark/i }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('calls onChange with "light" when Light is clicked', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="dark" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /Light/i }));
    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('calls onChange with "system" when System is clicked', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="light" onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: /System/i }));
    expect(onChange).toHaveBeenCalledWith('system');
  });

  it('ArrowRight moves selection to next segment', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="light" onChange={onChange} />);
    const lightBtn = screen.getByRole('radio', { name: /Light/i });
    fireEvent.keyDown(lightBtn, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('ArrowLeft moves selection to previous segment', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="dark" onChange={onChange} />);
    const darkBtn = screen.getByRole('radio', { name: /Dark/i });
    fireEvent.keyDown(darkBtn, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('ArrowRight wraps from last to first', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="system" onChange={onChange} />);
    const systemBtn = screen.getByRole('radio', { name: /System/i });
    fireEvent.keyDown(systemBtn, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('ArrowLeft wraps from first to last', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="light" onChange={onChange} />);
    const lightBtn = screen.getByRole('radio', { name: /Light/i });
    fireEvent.keyDown(lightBtn, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('system');
  });

  it('Space key calls onChange with current segment value', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="light" onChange={onChange} />);
    const lightBtn = screen.getByRole('radio', { name: /Light/i });
    fireEvent.keyDown(lightBtn, { key: ' ' });
    expect(onChange).toHaveBeenCalledWith('light');
  });

  it('Enter key calls onChange with current segment value', () => {
    const onChange = vi.fn();
    render(<ThemeSegmentedControl value="dark" onChange={onChange} />);
    const darkBtn = screen.getByRole('radio', { name: /Dark/i });
    fireEvent.keyDown(darkBtn, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  const allPreferences: ThemePreference[] = ['light', 'dark', 'system'];
  it.each(allPreferences)('renders correctly with value="%s"', (pref) => {
    const { getByRole } = render(<ThemeSegmentedControl value={pref} onChange={vi.fn()} />);
    expect(getByRole('radiogroup')).toBeInTheDocument();
  });
});
