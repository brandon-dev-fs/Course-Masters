import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActivityRow from '../../../features/builder/ActivityRow.js';
import type { BuilderActivity } from '../../../api/types.js';

// Mock DropdownMenu to make it simple to work with
vi.mock('../../../features/builder/DropdownMenu.js', () => ({
  default: ({
    items,
    onClose,
  }: {
    items: Array<{ label: string; onClick: () => void; disabled?: boolean }>;
    onClose: () => void;
    ariaLabel: string;
  }) => (
    <div role="menu">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            if (!item.disabled) item.onClick();
            onClose();
          }}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock ActivityTypePill
vi.mock('../../../features/builder/ActivityTypePill.js', () => ({
  default: ({ type }: { type: string }) => <span data-testid="activity-type-pill">{type}</span>,
}));

const makeActivity = (overrides?: Partial<BuilderActivity>): BuilderActivity => ({
  id: 'act-1',
  title: 'Test Activity',
  type: 'note',
  order: 1,
  ...overrides,
});

describe('ActivityRow', () => {
  const onDelete = vi.fn();
  const onMoveActivity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    expect(screen.getByRole('treeitem')).toBeInTheDocument();
  });

  it('shows the activity title', () => {
    render(
      <ActivityRow
        activity={makeActivity({ title: 'My Activity Title' })}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    expect(screen.getByText('My Activity Title')).toBeInTheDocument();
  });

  it('has aria-label with type and title', () => {
    render(
      <ActivityRow
        activity={makeActivity({ type: 'vocab', title: 'Vocab Activity' })}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    expect(screen.getByRole('treeitem')).toHaveAttribute('aria-label', 'vocab: Vocab Activity');
  });

  it('renders the ActivityTypePill', () => {
    render(
      <ActivityRow
        activity={makeActivity({ type: 'flash_card' })}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    expect(screen.getByTestId('activity-type-pill')).toBeInTheDocument();
  });

  it('opens context menu when actions button is clicked', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    const actionsBtn = screen.getByRole('button', { name: /actions for test activity/i });
    fireEvent.click(actionsBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes context menu after clicking Close', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    const actionsBtn = screen.getByRole('button', { name: /actions for test activity/i });
    fireEvent.click(actionsBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onDelete when Delete menu item is clicked', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /actions for test activity/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onMoveActivity with "up" when Move up is clicked', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /actions for test activity/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Move up' }));
    expect(onMoveActivity).toHaveBeenCalledWith('up');
  });

  it('calls onMoveActivity with "down" when Move down is clicked', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /actions for test activity/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Move down' }));
    expect(onMoveActivity).toHaveBeenCalledWith('down');
  });

  it('disables Move up when isFirst is true', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={true}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /actions for test activity/i }));
    const moveUpBtn = screen.getByRole('button', { name: 'Move up' });
    expect(moveUpBtn).toBeDisabled();
  });

  it('disables Move down when isLast is true', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={true}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /actions for test activity/i }));
    const moveDownBtn = screen.getByRole('button', { name: 'Move down' });
    expect(moveDownBtn).toBeDisabled();
  });

  it('applies opacity class when isDragging is true', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
        isDragging={true}
      />,
    );
    expect(screen.getByRole('treeitem')).toHaveClass('opacity-50');
  });

  it('does not apply opacity class when isDragging is false', () => {
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
        isDragging={false}
      />,
    );
    expect(screen.getByRole('treeitem')).not.toHaveClass('opacity-50');
  });

  it('passes dragHandleProps to the drag handle button', () => {
    const dragHandleProps = { 'data-drag': 'true' };
    render(
      <ActivityRow
        activity={makeActivity()}
        isFirst={false}
        isLast={false}
        onDelete={onDelete}
        onMoveActivity={onMoveActivity}
        dragHandleProps={dragHandleProps}
      />,
    );
    // The drag handle button is aria-hidden, find it by tabIndex
    const dragBtn = document.querySelector('button[aria-hidden="true"]');
    expect(dragBtn).toHaveAttribute('data-drag', 'true');
  });
});
