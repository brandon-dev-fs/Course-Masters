import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DropdownMenu from '../../../features/builder/DropdownMenu.js';
import type { DropdownMenuItem } from '../../../features/builder/DropdownMenu.js';

function makeItems(overrides?: Partial<DropdownMenuItem>[]): DropdownMenuItem[] {
  const defaults: DropdownMenuItem[] = [
    { label: 'Edit', onClick: vi.fn() },
    { label: 'Rename', onClick: vi.fn() },
    { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
  ];
  if (overrides) {
    return overrides.map((o, i) => ({ ...defaults[i], ...o }));
  }
  return defaults;
}

describe('DropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with role="menu"', () => {
    render(
      <DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Unit actions" />,
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(
      <DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Unit actions" />,
    );
    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', 'Unit actions');
  });

  it('renders all menu items', () => {
    render(
      <DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" />,
    );
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls item onClick and onClose when item is clicked', () => {
    const onClose = vi.fn();
    const items = makeItems();
    render(<DropdownMenu items={items} onClose={onClose} ariaLabel="Actions" />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(items[0].onClick).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<DropdownMenu items={makeItems()} onClose={onClose} ariaLabel="Actions" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking outside', () => {
    const onClose = vi.fn();
    render(
      <div>
        <DropdownMenu items={makeItems()} onClose={onClose} ariaLabel="Actions" />
        <button>Outside</button>
      </div>,
    );
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking inside', () => {
    const onClose = vi.fn();
    render(<DropdownMenu items={makeItems()} onClose={onClose} ariaLabel="Actions" />);
    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders disabled items', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Edit', onClick: vi.fn(), disabled: true },
    ];
    render(<DropdownMenu items={items} onClose={vi.fn()} ariaLabel="Actions" />);
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeDisabled();
  });

  it('renders divider when dividerBefore is set', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Edit', onClick: vi.fn() },
      { label: 'Delete', onClick: vi.fn(), dividerBefore: true },
    ];
    render(<DropdownMenu items={items} onClose={vi.fn()} ariaLabel="Actions" />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('does not render divider when dividerBefore is not set', () => {
    render(
      <DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" />,
    );
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('navigates down with ArrowDown key', () => {
    render(<DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" />);
    const menuItems = screen.getAllByRole('menuitem');
    menuItems[0].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(menuItems[1]);
  });

  it('navigates up with ArrowUp key', () => {
    render(<DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" />);
    const menuItems = screen.getAllByRole('menuitem');
    menuItems[1].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('wraps ArrowDown from last item to first', () => {
    render(<DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" />);
    const menuItems = screen.getAllByRole('menuitem');
    menuItems[menuItems.length - 1].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it('wraps ArrowUp from first item to last', () => {
    render(<DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" />);
    const menuItems = screen.getAllByRole('menuitem');
    menuItems[0].focus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' });
    expect(document.activeElement).toBe(menuItems[menuItems.length - 1]);
  });

  it('renders icon when item has icon', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Edit', onClick: vi.fn(), icon: <span data-testid="icon">✏️</span> },
    ];
    render(<DropdownMenu items={items} onClose={vi.fn()} ariaLabel="Actions" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('aligns right by default', () => {
    const { container } = render(
      <DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" />,
    );
    const menu = container.querySelector('[role="menu"]');
    expect(menu?.className).toContain('right-0');
  });

  it('aligns left when align="left"', () => {
    const { container } = render(
      <DropdownMenu items={makeItems()} onClose={vi.fn()} ariaLabel="Actions" align="left" />,
    );
    const menu = container.querySelector('[role="menu"]');
    expect(menu?.className).toContain('left-0');
  });

  it('ignores unhandled keys in menu keydown handler', () => {
    const onClose = vi.fn();
    render(<DropdownMenu items={makeItems()} onClose={onClose} ariaLabel="Actions" />);
    // Firing a key that is not ArrowDown/ArrowUp should not throw and should not close
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies destructive variant class to destructive items', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
    ];
    render(<DropdownMenu items={items} onClose={vi.fn()} ariaLabel="Actions" />);
    const btn = screen.getByRole('menuitem', { name: 'Delete' });
    expect(btn.className).toContain('text-destructive');
  });

  it('does not render icon span when item has no icon', () => {
    const items: DropdownMenuItem[] = [
      { label: 'Edit', onClick: vi.fn() },
    ];
    const { container } = render(
      <DropdownMenu items={items} onClose={vi.fn()} ariaLabel="Actions" />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
