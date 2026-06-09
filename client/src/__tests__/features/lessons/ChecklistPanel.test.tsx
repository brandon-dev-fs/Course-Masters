const { useChecklistMock } = vi.hoisted(() => ({
  useChecklistMock: vi.fn(),
}));

vi.mock('../../../features/lessons/hooks/useChecklist.js', () => ({
  default: useChecklistMock,
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import ChecklistPanel from '../../../features/lessons/ChecklistPanel.js';
import type { ChecklistItem } from '../../../api/types.js';

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: 'item-1',
    lessonId: 'l-1',
    text: 'Do thing',
    checked: false,
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeHookReturn(overrides: Record<string, unknown> = {}) {
  return {
    items: [] as ChecklistItem[],
    loading: false,
    error: null as string | null,
    addItem: vi.fn().mockResolvedValue(undefined),
    toggleItem: vi.fn().mockResolvedValue(undefined),
    updateItemText: vi.fn().mockResolvedValue(undefined),
    deleteItem: vi.fn().mockResolvedValue(undefined),
    moveItem: vi.fn().mockResolvedValue(undefined),
    deletingItemId: null as string | null,
    ...overrides,
  };
}

describe('ChecklistPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChecklistMock.mockReturnValue(makeHookReturn());
  });

  it('shows LoadingSpinner while loading', () => {
    useChecklistMock.mockReturnValue(makeHookReturn({ loading: true }));
    render(<ChecklistPanel lessonId="l-1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when items list is empty', () => {
    render(<ChecklistPanel lessonId="l-1" />);
    expect(screen.getByText(/no checklist items yet/i)).toBeInTheDocument();
  });

  it('shows ErrorMessage when hook returns an error', () => {
    useChecklistMock.mockReturnValue(makeHookReturn({ error: 'Something failed' }));
    render(<ChecklistPanel lessonId="l-1" />);
    expect(screen.getByText(/something failed/i)).toBeInTheDocument();
  });

  it('renders each item text and checkbox', () => {
    useChecklistMock.mockReturnValue(makeHookReturn({
      items: [makeItem({ id: 'item-1', text: 'First task' })],
    }));
    render(<ChecklistPanel lessonId="l-1" />);
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('first item Move up button is disabled', () => {
    useChecklistMock.mockReturnValue(makeHookReturn({
      items: [
        makeItem({ id: 'item-1', order: 1 }),
        makeItem({ id: 'item-2', order: 2 }),
      ],
    }));
    render(<ChecklistPanel lessonId="l-1" />);
    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveUpButtons[1]).not.toBeDisabled();
  });

  it('last item Move down button is disabled', () => {
    useChecklistMock.mockReturnValue(makeHookReturn({
      items: [
        makeItem({ id: 'item-1', order: 1 }),
        makeItem({ id: 'item-2', order: 2 }),
      ],
    }));
    render(<ChecklistPanel lessonId="l-1" />);
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    expect(moveDownButtons[0]).not.toBeDisabled();
    expect(moveDownButtons[1]).toBeDisabled();
  });

  it('checkbox change calls toggleItem with itemId and new checked value', () => {
    const toggleItem = vi.fn().mockResolvedValue(undefined);
    useChecklistMock.mockReturnValue(makeHookReturn({
      items: [makeItem({ id: 'item-1', checked: false })],
      toggleItem,
    }));
    render(<ChecklistPanel lessonId="l-1" />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(toggleItem).toHaveBeenCalledWith('item-1', true);
  });

  it('Move up button calls moveItem with "up"', () => {
    const moveItem = vi.fn().mockResolvedValue(undefined);
    useChecklistMock.mockReturnValue(makeHookReturn({
      items: [
        makeItem({ id: 'item-1', order: 1 }),
        makeItem({ id: 'item-2', order: 2 }),
      ],
      moveItem,
    }));
    render(<ChecklistPanel lessonId="l-1" />);
    const moveUpButtons = screen.getAllByRole('button', { name: /move up/i });
    fireEvent.click(moveUpButtons[1]);
    expect(moveItem).toHaveBeenCalledWith('item-2', 'up');
  });

  it('Move down button calls moveItem with "down"', () => {
    const moveItem = vi.fn().mockResolvedValue(undefined);
    useChecklistMock.mockReturnValue(makeHookReturn({
      items: [
        makeItem({ id: 'item-1', order: 1 }),
        makeItem({ id: 'item-2', order: 2 }),
      ],
      moveItem,
    }));
    render(<ChecklistPanel lessonId="l-1" />);
    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i });
    fireEvent.click(moveDownButtons[0]);
    expect(moveItem).toHaveBeenCalledWith('item-1', 'down');
  });

  it('delete button calls deleteItem with itemId', () => {
    const deleteItem = vi.fn().mockResolvedValue(undefined);
    useChecklistMock.mockReturnValue(makeHookReturn({
      items: [makeItem({ id: 'item-1', text: 'Do thing' })],
      deleteItem,
    }));
    render(<ChecklistPanel lessonId="l-1" />);
    fireEvent.click(screen.getByRole('button', { name: /delete: do thing/i }));
    expect(deleteItem).toHaveBeenCalledWith('item-1');
  });

  it('typing in input updates character counter', () => {
    render(<ChecklistPanel lessonId="l-1" />);
    const input = screen.getByRole('textbox', { name: /new checklist item/i });
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(screen.getByText('5/200')).toBeInTheDocument();
  });

  it('pressing Enter with non-empty input calls addItem with trimmed text', async () => {
    const addItem = vi.fn().mockResolvedValue(undefined);
    useChecklistMock.mockReturnValue(makeHookReturn({ addItem }));
    render(<ChecklistPanel lessonId="l-1" />);
    const input = screen.getByRole('textbox', { name: /new checklist item/i });
    fireEvent.change(input, { target: { value: '  My task  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(addItem).toHaveBeenCalledWith('My task'));
  });

  it('pressing Enter with whitespace-only input does not call addItem', () => {
    const addItem = vi.fn().mockResolvedValue(undefined);
    useChecklistMock.mockReturnValue(makeHookReturn({ addItem }));
    render(<ChecklistPanel lessonId="l-1" />);
    const input = screen.getByRole('textbox', { name: /new checklist item/i });
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(addItem).not.toHaveBeenCalled();
  });

  it('input clears after successful addItem', async () => {
    const addItem = vi.fn().mockResolvedValue(undefined);
    useChecklistMock.mockReturnValue(makeHookReturn({ addItem }));
    render(<ChecklistPanel lessonId="l-1" />);
    const input = screen.getByRole('textbox', { name: /new checklist item/i });
    fireEvent.change(input, { target: { value: 'My task' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(input).toHaveValue(''));
  });

  it('shows inputError when addItem throws', async () => {
    const addItem = vi.fn().mockRejectedValueOnce(new Error('Add failed'));
    useChecklistMock.mockReturnValue(makeHookReturn({ addItem }));
    render(<ChecklistPanel lessonId="l-1" />);
    const input = screen.getByRole('textbox', { name: /new checklist item/i });
    fireEvent.change(input, { target: { value: 'My task' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/add failed/i)).toBeInTheDocument();
  });
});
