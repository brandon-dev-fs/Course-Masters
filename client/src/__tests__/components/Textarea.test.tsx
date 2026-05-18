import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Textarea from '../../components/Textarea.js';

describe('Textarea', () => {
  it('renders the textarea element', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when label prop is provided', () => {
    render(<Textarea label="Description" id="desc" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('label is associated with textarea via htmlFor/id', () => {
    render(<Textarea label="Notes" id="notes" />);
    const label = screen.getByText('Notes');
    expect(label).toHaveAttribute('for', 'notes');
  });

  it('does not render label when label prop is omitted', () => {
    render(<Textarea placeholder="Enter text" />);
    const labels = document.querySelectorAll('label');
    expect(labels.length).toBe(0);
  });

  it('renders error message when error prop is provided', () => {
    render(<Textarea error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('does not render error message when error prop is omitted', () => {
    render(<Textarea />);
    const paragraphs = document.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  it('forwards placeholder prop to textarea', () => {
    render(<Textarea placeholder="Write something..." />);
    expect(screen.getByPlaceholderText('Write something...')).toBeInTheDocument();
  });

  it('forwards disabled prop to textarea', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('merges custom className', () => {
    render(<Textarea className="custom-textarea" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.className).toContain('custom-textarea');
  });

  it('renders both label and error when both props are provided', () => {
    render(<Textarea label="Body" id="body" error="Body is required" />);
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Body is required')).toBeInTheDocument();
  });
});
