const useMediaQueryMock = vi.hoisted(() => vi.fn(() => false));

vi.mock('../../../hooks/useMediaQuery.js', () => ({
  useMediaQuery: useMediaQueryMock,
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalculatorPanel from '../../../features/assessments/CalculatorPanel.js';

function renderPanel(isDesktop = false, onClose = vi.fn()) {
  useMediaQueryMock.mockReturnValue(isDesktop);
  const triggerRef = React.createRef<HTMLButtonElement>();
  return { onClose, triggerRef, ...render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />) };
}

// ── Shared structure ──────────────────────────────────────────────────────────

describe('CalculatorPanel — structure', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders calculator region', () => {
    renderPanel(false);
    expect(screen.getByRole('region', { name: /calculator/i })).toBeInTheDocument();
  });

  it('renders digit buttons', () => {
    renderPanel(false);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument();
  });

  it('renders operator buttons', () => {
    renderPanel(false);
    expect(screen.getByLabelText('Add')).toBeInTheDocument();
    expect(screen.getByLabelText('Subtract')).toBeInTheDocument();
    expect(screen.getByLabelText('Multiply')).toBeInTheDocument();
    expect(screen.getByLabelText('Divide')).toBeInTheDocument();
  });

  it('renders utility buttons', () => {
    renderPanel(false);
    expect(screen.getByLabelText('Clear')).toBeInTheDocument();
    expect(screen.getByLabelText('Backspace')).toBeInTheDocument();
    expect(screen.getByLabelText('Equals')).toBeInTheDocument();
    expect(screen.getByLabelText('Square root')).toBeInTheDocument();
  });

  it('renders display with initial value', () => {
    renderPanel(false);
    const display = screen.getByLabelText('Calculator display');
    expect(display).toBeInTheDocument();
    expect(display).toHaveTextContent('0');
  });
});

// ── Mobile mode ───────────────────────────────────────────────────────────────

describe('CalculatorPanel — mobile mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMediaQueryMock.mockReturnValue(false);
  });

  it('does not show a Close button in mobile mode', () => {
    renderPanel(false);
    expect(screen.queryByRole('button', { name: /close calculator/i })).not.toBeInTheDocument();
  });

  it('does not show drag handle in mobile mode', () => {
    renderPanel(false);
    const panel = screen.getByRole('region', { name: /calculator/i });
    expect(panel.textContent).not.toContain('≡');
  });
});

// ── Desktop mode ──────────────────────────────────────────────────────────────

describe('CalculatorPanel — desktop mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMediaQueryMock.mockReturnValue(true);
  });

  it('renders calculator via portal into document.body', () => {
    renderPanel(true);
    expect(screen.getByRole('region', { name: /calculator/i })).toBeInTheDocument();
  });

  it('shows Close button in desktop mode', () => {
    renderPanel(true);
    expect(screen.getByRole('button', { name: /close calculator/i })).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    renderPanel(true, onClose);
    fireEvent.click(screen.getByRole('button', { name: /close calculator/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders drag handle affordance in desktop mode', () => {
    renderPanel(true);
    const panel = screen.getByRole('region', { name: /calculator/i });
    expect(panel.textContent).toContain('≡');
  });
});

// ── Keyboard / focus behaviour ────────────────────────────────────────────────

describe('CalculatorPanel — keyboard behaviour', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderPanel(false, onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose for non-Escape keys', () => {
    const onClose = vi.fn();
    renderPanel(false, onClose);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── Calculator logic ──────────────────────────────────────────────────────────

describe('CalculatorPanel — calculator logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMediaQueryMock.mockReturnValue(false);
  });

  it('accumulates multi-digit numbers', () => {
    renderPanel(false);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('42');
  });

  it('clears display when Clear is clicked', () => {
    renderPanel(false);
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByLabelText('Clear'));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('0');
  });

  it('evaluates simple addition with Equals', () => {
    renderPanel(false);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByLabelText('Add'));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByLabelText('Equals'));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('7');
  });

  it('evaluates simple multiplication', () => {
    renderPanel(false);
    fireEvent.click(screen.getByRole('button', { name: '6' }));
    fireEvent.click(screen.getByLabelText('Multiply'));
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByLabelText('Equals'));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('42');
  });

  it('supports decimal point entry', () => {
    renderPanel(false);
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByLabelText('Decimal point'));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('1.5');
  });

  it('removes last digit with Backspace', () => {
    renderPanel(false);
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByLabelText('Backspace'));
    expect(screen.getByLabelText('Calculator display')).toHaveTextContent('9');
  });
});
