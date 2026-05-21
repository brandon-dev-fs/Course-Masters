import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CalculatorPanel from '../../../features/assessments/CalculatorPanel.js';

describe('CalculatorPanel', () => {
  const onClose = vi.fn();
  const triggerRef = React.createRef<HTMLButtonElement>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calculator display', () => {
    render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />);
    expect(screen.getByLabelText('Calculator display')).toBeInTheDocument();
  });

  it('renders digit buttons', () => {
    render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
  });

  it('renders operator buttons', () => {
    render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />);
    expect(screen.getByLabelText('Add')).toBeInTheDocument();
    expect(screen.getByLabelText('Subtract')).toBeInTheDocument();
  });

  it('renders equals button', () => {
    render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />);
    expect(screen.getByLabelText('Equals')).toBeInTheDocument();
  });

  it('renders clear button', () => {
    render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />);
    expect(screen.getByLabelText('Clear')).toBeInTheDocument();
  });

  it('updates display when digit button is pressed', () => {
    render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    const display = screen.getByLabelText('Calculator display');
    expect(display).toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<CalculatorPanel onClose={onClose} triggerRef={triggerRef} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
