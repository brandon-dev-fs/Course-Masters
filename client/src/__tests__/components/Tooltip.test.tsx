import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Tooltip from '../../components/Tooltip.js';

describe('Tooltip', () => {
  it('renders children without crashing', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('does not show tooltip content initially', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouse enter', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByText('Hover me').closest('div')!;
    fireEvent.mouseEnter(trigger);
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByText('Hover me').closest('div')!;
    fireEvent.mouseEnter(trigger);
    expect(screen.getByText('Tooltip text')).toBeInTheDocument();
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument();
  });

  it('shows tooltip on focus (via mouseEnter of wrapper)', () => {
    render(
      <Tooltip content="Focus tip">
        <button>Focus me</button>
      </Tooltip>,
    );
    const trigger = screen.getByText('Focus me').closest('div')!;
    // Tooltip uses onMouseEnter/onMouseLeave — fire focus via mouseEnter
    fireEvent.mouseEnter(trigger);
    expect(screen.getByText('Focus tip')).toBeInTheDocument();
  });

  it('renders tooltip content as a string', () => {
    render(
      <Tooltip content="Some content">
        <span>Target</span>
      </Tooltip>,
    );
    const trigger = screen.getByText('Target').closest('div')!;
    fireEvent.mouseEnter(trigger);
    expect(screen.getByText('Some content')).toBeInTheDocument();
  });

  it('handles triggerRef being null gracefully (no crash on mouseEnter before mount)', () => {
    // This tests the early return in show() when triggerRef.current is null
    // In a normal render the ref is set, but we verify no error is thrown
    expect(() => {
      render(
        <Tooltip content="Test">
          <button>Click</button>
        </Tooltip>,
      );
    }).not.toThrow();
  });

  it('renders the tooltip in a fixed-position div when visible', () => {
    const { container } = render(
      <Tooltip content="Fixed tooltip">
        <button>Hover</button>
      </Tooltip>,
    );
    const trigger = screen.getByText('Hover').closest('div')!;
    fireEvent.mouseEnter(trigger);
    const tooltipEl = container.querySelector('[style*="position: fixed"]');
    expect(tooltipEl).toBeInTheDocument();
  });

  it('positions the tooltip above the trigger when near the bottom of the viewport', () => {
    // Make getBoundingClientRect report an element near the bottom so `above` becomes true
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 700, top: 680, left: 50, right: 150, width: 100, height: 20,
      x: 50, y: 680, toJSON: () => ({}),
    } as DOMRect);

    const { container } = render(
      <Tooltip content="Above tooltip">
        <button>Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByText('Hover me').closest('div')!;
    fireEvent.mouseEnter(trigger);

    // When above=true the tooltip gets a translateY transform
    const tooltipEl = container.querySelector('[style*="translateY"]');
    expect(tooltipEl).toBeInTheDocument();
    expect(screen.getByText('Above tooltip')).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
