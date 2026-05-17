import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Input from '../../components/Input.js';

describe('Input', () => {
  it('renders the input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders label when label prop is provided', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('label is associated with input via htmlFor/id', () => {
    render(<Input label="Username" id="username" />);
    const label = screen.getByText('Username');
    expect(label).toHaveAttribute('for', 'username');
  });

  it('does not render label when label prop is omitted', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
    // No <label> element in the DOM
    const labels = document.querySelectorAll('label');
    expect(labels.length).toBe(0);
  });

  it('renders error message when error prop is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('does not render error message when error prop is omitted', () => {
    render(<Input />);
    const paragraphs = document.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  it('forwards placeholder prop to input', () => {
    render(<Input placeholder="Enter your name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('forwards type prop to input', () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('forwards disabled prop to input', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('merges custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-input');
  });

  it('renders both label and error when both props are provided', () => {
    render(<Input label="Name" id="name" error="Name is required" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });
});
