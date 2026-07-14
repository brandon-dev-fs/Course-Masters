import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CourseCardMenu from '../../../features/courses/CourseCardMenu.js';

describe('CourseCardMenu', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the trigger button with correct aria-label', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: /course options/i })).toBeInTheDocument();
  });

  it('menu is closed on initial render', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('trigger has aria-expanded=false when closed', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: /course options/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens menu on trigger click', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('trigger has aria-expanded=true when menu is open', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    expect(screen.getByRole('button', { name: /course options/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows Edit Course and Delete Course menu items when open', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    expect(screen.getByRole('menuitem', { name: /edit course/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete course/i })).toBeInTheDocument();
  });

  it('calls onEdit and closes menu when Edit Course is clicked', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /edit course/i }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onDelete and closes menu when Delete Course is clicked', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /delete course/i }));
    expect(onDelete).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu on Escape key', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu on Tab key', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    render(
      <div>
        <CourseCardMenu onEdit={onEdit} onDelete={onDelete} />
        <div data-testid="outside">Outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not close menu when clicking inside the menu', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /course options/i }));
    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('toggles menu closed on second trigger click', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    const trigger = screen.getByRole('button', { name: /course options/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('trigger has aria-haspopup=menu attribute', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: /course options/i })).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('Escape key has no effect when menu is already closed', () => {
    render(<CourseCardMenu onEdit={onEdit} onDelete={onDelete} />);
    // Menu is closed — Escape should not throw or cause issues
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
